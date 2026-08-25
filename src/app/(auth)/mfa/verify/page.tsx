'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { Shield, ArrowLeft } from 'lucide-react';
import { getApiErrorMessage, isAuthSuccessResponse } from '@/lib/auth-contract';

export default function MfaVerifyPage() {
  const [code, setCode] = useState('');
  const [factorId] = useState('totp');
  const [isVerifying, setIsVerifying] = useState(false);
  const verificationCompleted = useRef(false);
  const { mfaPending, mfaSessionToken, completeMfa, clearMfa } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!verificationCompleted.current && (!mfaPending || !mfaSessionToken)) {
      router.push('/login');
    }
  }, [mfaPending, mfaSessionToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaSessionToken) return;

    setIsVerifying(true);
    try {
      const { data } = await authApi.mfaVerify({
        mfaSessionToken,
        factorId,
        code,
      });

      if (!isAuthSuccessResponse(data)) {
        throw new Error('The server returned an invalid MFA response');
      }

      verificationCompleted.current = true;
      completeMfa(data);
      toast.success('MFA verified!');
      router.push(`/dashboard/${data.user.role}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Invalid verification code'), { duration: 5000 });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    clearMfa();
    router.push('/login');
  };

  if (!mfaPending || !mfaSessionToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Two-Factor Authentication</h1>
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

        <Button type="submit" variant="gradient" className="w-full" disabled={isVerifying || code.length !== 6}>
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
      </div>
  );
}
