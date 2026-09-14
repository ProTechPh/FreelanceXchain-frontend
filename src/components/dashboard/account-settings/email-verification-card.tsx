'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import type { User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmailVerificationCardProps {
  user: User | null;
}

export function EmailVerificationCard({ user }: EmailVerificationCardProps) {
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setIsResending(true);
    try {
      await authApi.resendConfirmation(user.email);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to send verification email.'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-5" /> Email address & verification
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="min-w-0 truncate font-medium text-foreground" title={user?.email}>{user?.email}</p>
            {user?.emailVerification ? (
              <Badge variant="secondary" className="bg-success-subtle text-success border border-success-border">
                Verified email
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-warning-subtle text-warning border border-warning-border">
                Unverified
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.emailVerification
              ? 'Your email address is verified with Appwrite.'
              : 'Your email address is unverified. Click the button to send a verification link to your inbox.'}
          </p>
        </div>
        {!user?.emailVerification && (
          <Button
            variant="outline"
            disabled={isResending}
            onClick={handleResendVerification}
          >
            {isResending ? 'Sending…' : 'Resend verification email'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
