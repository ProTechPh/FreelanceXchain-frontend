'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ShieldAlert, Trash2, Mail, RefreshCw, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DangerZoneCardProps {
  user: User | null;
  onLogout: () => Promise<void>;
}

export function DangerZoneCard({ user, onLogout }: DangerZoneCardProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isFreelancer = user?.role === 'freelancer';

  const [eligibility, setEligibility] = useState<{
    canDelete: boolean;
    reason?: string;
    counts?: { pending: number; active: number; disputed: number };
  } | null>(null);
  const [loadingEligibility, setLoadingEligibility] = useState(isFreelancer);

  // Check whether user has blocking contracts on mount
  useEffect(() => {
    if (!isFreelancer) return;

    let mounted = true;
    authApi.checkDeletionEligibility()
      .then((res) => {
        if (mounted && res.data) {
          setEligibility(res.data);
        }
      })
      .catch(() => {
        // Fallback: silently handle if endpoint fails
      })
      .finally(() => {
        if (mounted) setLoadingEligibility(false);
      });

    return () => {
      mounted = false;
    };
  }, [isFreelancer]);

  // Timer countdown for resending confirmation code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleRequestCode = async () => {
    setIsRequestingCode(true);
    try {
      const response = await authApi.requestAccountDeletion();
      setCodeSent(true);
      if (response.data?.email) {
        setMaskedEmail(response.data.email);
      }
      setResendCooldown(60);
      toast.success(response.data?.message || 'Confirmation code sent to your email.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not send confirmation code. Please try again.'));
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      toast.warning('Type DELETE (in capitals) in the confirmation field to proceed.');
      return;
    }

    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      toast.warning('Please enter the 6-digit confirmation code sent to your email.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const { data } = await authApi.deleteAccount({
        confirmation: deleteConfirmationText.trim().toUpperCase(),
        code: verificationCode.trim(),
      });
      toast.success(data.message || 'Your account has been scheduled for deletion. You can log in within 30 days to cancel and restore it.', { duration: 6000 });
      setShowDeleteModal(false);
      await onLogout();
      router.push('/');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Couldn\'t delete your account. Contact support if this keeps happening.'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setDeleteConfirmationText('');
      setVerificationCode('');
      setCodeSent(false);
    }
    setShowDeleteModal(open);
  };

  if (user?.role !== 'freelancer') {
    return null;
  }

  const hasBlockingContracts = Boolean(eligibility && !eligibility.canDelete);

  const isDeleteReady =
    codeSent &&
    verificationCode.trim().length === 6 &&
    deleteConfirmationText.trim().toUpperCase() === 'DELETE' &&
    !isDeletingAccount &&
    !hasBlockingContracts;

  return (
    <>
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" /> Danger Zone: Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your profile, work history, and personal account data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasBlockingContracts && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Account Deletion Blocked</span>
              </div>
              <p>
                {eligibility?.reason ||
                  'You currently have pending, active, or disputed contracts with escrow commitments. You must complete, cancel, or resolve all ongoing contracts before your account can be deleted.'}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Irreversible Account Removal</p>
              <p className="text-xs text-muted-foreground">
                Once deleted, your profile and login access will be erased forever after a 30-day grace period.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
              disabled={hasBlockingContracts || loadingEligibility}
              title={hasBlockingContracts ? eligibility?.reason : undefined}
            >
              <Trash2 className="size-4 mr-1.5" />
              {hasBlockingContracts ? 'Deletion Blocked' : 'Delete Account'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteModal} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5 text-destructive" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to request account deletion? Your account will be <strong className="text-foreground">deactivated with a 30-day grace period</strong>.
            </DialogDescription>
            <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground space-y-1.5 mt-2 text-left">
              <p><strong>30-Day Retrieval Grace Period:</strong></p>
              <p>• If you change your mind, simply log in within 30 days to cancel the deletion and restore your account.</p>
              <p>• A secondary 6-digit confirmation code must be sent to your email to verify account ownership.</p>
              <p>• After 30 days, your account, profile, and personal data will be permanently and irreversibly purged.</p>
              <p>• Past blockchain transaction history remains immutable on the distributed ledger.</p>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Step 1: Secondary Email Verification Code */}
            <div className="space-y-2 rounded-lg border p-3 bg-background">
              <div className="flex items-center justify-between">
                <Label htmlFor="verification-code-input" className="text-xs font-semibold flex items-center gap-1.5">
                  <KeyRound className="size-3.5 text-primary" />
                  Step 1: Email Confirmation Code
                </Label>
                {codeSent && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleRequestCode}
                    disabled={isRequestingCode || resendCooldown > 0}
                  >
                    <RefreshCw className={`size-3 mr-1 ${isRequestingCode ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend code'}
                  </Button>
                )}
              </div>

              {!codeSent ? (
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-medium"
                    onClick={handleRequestCode}
                    disabled={isRequestingCode}
                  >
                    <Mail className="size-3.5 mr-1.5 text-primary" />
                    {isRequestingCode ? 'Sending verification code…' : 'Send 6-digit code to email'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <Input
                    id="verification-code-input"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    autoComplete="off"
                    className="font-mono text-center tracking-widest text-base"
                  />
                  <p className="text-2xs text-muted-foreground">
                    Code sent to {maskedEmail || 'your email'}. Expires in 15 minutes.
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Typed Confirmation Text */}
            <div className="space-y-2">
              <Label htmlFor="delete-confirm-input" className="text-xs font-semibold">
                Step 2: Type <span className="font-mono text-destructive">DELETE</span> to confirm:
              </Label>
              <Input
                id="delete-confirm-input"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                disabled={!codeSent}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleModalClose(false)}
              disabled={isDeletingAccount}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!isDeleteReady}
              loading={isDeletingAccount}
              loadingText="Deleting account…"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="size-4 mr-1.5" />
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
