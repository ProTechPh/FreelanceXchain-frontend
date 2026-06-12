'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MfaVerifyPage() {
  const [code, setCode] = useState('');
  const [factorId] = useState('totp');
  const [isVerifying, setIsVerifying] = useState(false);
  const { mfaPending, mfaAccessToken, completeMfa, clearMfa } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!mfaPending || !mfaAccessToken) {
      router.push('/login');
    }
  }, [mfaPending, mfaAccessToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaAccessToken) return;

    setIsVerifying(true);
    try {
      const { data } = await authApi.mfaVerify({
        accessToken: mfaAccessToken,
        factorId,
        code,
      });

      if (data.user && data.access_token) {
        completeMfa(data.user, data.access_token);
        toast.success('MFA verified!');
        router.push('/dashboard/freelancer');
      }
    } catch {
      toast.error('Invalid verification code', { duration: 5000 });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    clearMfa();
    router.push('/login');
  };

  if (!mfaPending || !mfaAccessToken) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
        <p className="text-muted-foreground mt-2">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Verification Code</Label>
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
          {isVerifying ? 'Verifying...' : 'Verify'}
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>
      </div>
    </div>
  );
}
