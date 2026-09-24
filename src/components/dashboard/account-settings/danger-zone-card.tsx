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
      toast.success(data.message || 'Your account and personal data have been permanently deleted.');
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

  const isDeleteReady =
    codeSent &&
    verificationCode.trim().length === 6 &&
    deleteConfirmationText.trim().toUpperCase() === 'DELETE' &&
    !isDeletingAccount;

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
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Irreversible Account Removal</p>
            <p className="text-xs text-muted-foreground">
              Once deleted, your profile, portfolio items, and login access will be erased forever.
            </p>
          </div>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="size-4 mr-1.5" /> Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDeleteModal} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5 text-destructive" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>
                Are you sure you want to delete your FreelanceXchain account? This action is <strong className="text-foreground">permanent and cannot be undone</strong>.
              </p>
              <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground space-y-1.5">
                <p><strong>Security notice:</strong></p>
                <p>• A secondary 6-digit confirmation code must be sent to your email to verify account ownership.</p>
                <p>• If you have an active contract with funds locked in escrow, please complete or resolve the contract first.</p>
                <p>• Past blockchain transaction history remains immutable on the distributed ledger.</p>
              </div>
            </DialogDescription>
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
                  <p className="text-[11px] text-muted-foreground">
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
