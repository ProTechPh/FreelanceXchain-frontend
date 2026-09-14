'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import type { MfaFactor } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MfaCardProps {
  factors: MfaFactor[];
  onFactorsChange: (factors: MfaFactor[]) => void;
}

export function MfaCard({ factors, onFactorsChange }: MfaCardProps) {
  const [otpCode, setOtpCode] = useState('');
  const [isDisablingMfa, setIsDisablingMfa] = useState(false);

  const isTotpEnabled = factors.some((f) => f.type === 'totp');
  const totpFactor = factors.find((f) => f.type === 'totp') ?? factors[0];

  const disableMfa = async () => {
    const factor = totpFactor;
    if (!factor || otpCode.length !== 6) return;

    setIsDisablingMfa(true);
    try {
      await authApi.mfaDisable(factor.id, otpCode);
      onFactorsChange([]);
      setOtpCode('');
      toast.success('Two-factor authentication disabled.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to disable two-factor authentication.'));
    } finally {
      setIsDisablingMfa(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-5" /> Two-factor authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">Authenticator protection</p>
              <Badge variant="secondary">{isTotpEnabled ? 'Enabled' : 'Not enabled'}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Require a one-time code from your authenticator app during sign in.</p>
          </div>
          {!isTotpEnabled && (
            <Button asChild>
              <Link href="/mfa/setup">Enable 2FA</Link>
            </Button>
          )}
        </div>
        {isTotpEnabled && totpFactor && (
          <div className="max-w-sm space-y-2 rounded-lg border border-border p-4">
            <Label htmlFor="disable-mfa-code">Authenticator code to disable 2FA</Label>
            <div className="flex gap-2">
              <Input
                id="disable-mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <Button variant="destructive" disabled={otpCode.length !== 6 || isDisablingMfa} onClick={disableMfa}>
                Disable
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
