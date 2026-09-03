'use client';

import { useState } from 'react';
import { Mail, RefreshCw, LogOut, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function EmailVerificationGate() {
  const { user, loadUser, logout } = useAuthStore();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleResend = async () => {
    if (!user?.email || cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await authApi.resendConfirmation(user.email);
      toast.success('Verification link sent!', {
        description: `We've sent a new confirmation link to ${user.email}. Check your spam or inbox.`,
      });
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      toast.error('Failed to resend email. Please try again in a few moments.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      await loadUser();
      const updatedUser = useAuthStore.getState().user;
      if (updatedUser?.emailVerification) {
        toast.success('Email verified successfully! Welcome to FreelanceXchain.');
      } else {
        toast.info('Email not yet verified', {
          description: 'Please click the link sent to your email address before continuing.',
        });
      }
    } catch {
      toast.error('Unable to verify status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="max-w-md w-full border-border/80 shadow-2xl bg-card">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto size-14 rounded-full bg-warning-subtle flex items-center justify-center text-warning mb-3 ring-8 ring-warning/10">
            <Mail className="size-7" />
          </div>
          <CardTitle className="text-xl font-bold">Email Verification Required</CardTitle>
          <CardDescription className="text-sm mt-1.5">
            Your dashboard and account features are locked until your email address is verified.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2 text-center">
          <div className="rounded-lg bg-muted/60 p-3.5 text-xs text-muted-foreground border border-border/50">
            <p className="font-medium text-foreground text-sm break-all mb-1">{user?.email}</p>
            <p>Check your inbox (and spam folder) for the verification link we sent you.</p>
          </div>

          <div className="flex items-start gap-2.5 text-left text-xs text-muted-foreground bg-warning-subtle border border-warning-border rounded-md p-3">
            <AlertCircle className="size-4 text-warning shrink-0 mt-0.5" />
            <span>
              All platform actions (creating proposals, smart contract escrow, hiring, and messaging) are disabled to protect against bot accounts and fraudulent activity.
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2.5 pt-2">
          <Button
            className="w-full gap-2 font-medium"
            onClick={handleCheckStatus}
            disabled={isChecking}
          >
            <RefreshCw className={`size-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking status...' : "I've Verified My Email"}
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2 text-xs"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
          >
            <Mail className="size-3.5" />
            {cooldown > 0 ? `Resend link (${cooldown}s)` : isResending ? 'Sending...' : 'Resend verification link'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="size-3.5" />
            Log out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
