'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { Shield, Copy, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import QRCode from 'qrcode';

type Step = 'enroll' | 'verify' | 'complete';

export default function MfaSetupPage() {
  const [step, setStep] = useState<Step>('enroll');
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const generateQrCode = useCallback(async (totpUri: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(totpUri, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(dataUrl);
    } catch {
      toast.error('Failed to generate QR code');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const { data } = await authApi.mfaEnroll({ factorType: 'totp' });
      if (data.success) {
        setSecret(data.secret || '');
        setUri(data.uri || '');
        setRecoveryCodes(data.recoveryCodes || []);
        setStep('verify');
        if (data.uri) {
          await generateQrCode(data.uri);
        }
      }
    } catch {
      toast.error('Failed to start MFA setup');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const { data } = await authApi.mfaVerifyEnrollment('totp', code);
      if (data.success) {
        setStep('complete');
        toast.success('Two-factor authentication enabled!');
      }
    } catch {
      toast.error('Invalid verification code', { duration: 5000 });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Set Up Two-Factor Authentication</h1>
        <p className="text-muted-foreground mt-2">
          Add an extra layer of security to your account
        </p>
      </div>

      {step === 'enroll' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Two-factor authentication adds an additional layer of security to your account. 
            Once enabled, you will need to enter a code from your authenticator app when signing in.
          </p>
          <Button onClick={handleEnroll} className="w-full gradient-primary text-white" disabled={isEnrolling}>
            {isEnrolling ? 'Setting up...' : 'Enable Two-Factor Authentication'}
          </Button>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-card border border-border">
            <p className="text-sm font-medium mb-2">1. Scan this QR code with your authenticator app</p>
            {qrCodeDataUrl && (
              <div className="flex justify-center mb-4">
                <img
                  src={qrCodeDataUrl}
                  alt="MFA QR Code"
                  className="rounded-lg"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-2">Or enter this secret manually:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">{secret}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(secret);
                  toast.success('Secret copied!');
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-card border border-border">
            <p className="text-sm font-medium mb-2">2. Save your recovery codes</p>
            <p className="text-xs text-muted-foreground mb-2">
              Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {recoveryCodes.map((code, i) => (
                <code key={i} className="p-2 bg-muted rounded text-xs font-mono">{code}</code>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={copyRecoveryCodes} className="w-full">
              {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Recovery Codes'}
            </Button>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">3. Enter the 6-digit code from your authenticator app</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full gradient-primary text-white" disabled={isVerifying || code.length !== 6}>
              {isVerifying ? 'Verifying...' : 'Verify & Enable'}
            </Button>
          </form>
        </div>
      )}

      {step === 'complete' && (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-lg font-medium">Two-Factor Authentication Enabled!</p>
          <p className="text-sm text-muted-foreground">
            Your account is now protected with two-factor authentication.
          </p>
          <Button onClick={() => router.push('/dashboard/freelancer/settings')} className="w-full gradient-primary text-white">
            Go to Settings
          </Button>
        </div>
      )}

      <Link href="/dashboard/freelancer/settings" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Back to settings
      </Link>
    </div>
  );
}
