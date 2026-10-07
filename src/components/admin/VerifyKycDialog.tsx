'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AdminUser } from '@/types';

interface VerifyKycDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onConfirm: (user: AdminUser, reason: string) => Promise<void>;
  isPending: boolean;
}

interface VerifyKycFormProps {
  user: AdminUser;
  onConfirm: (user: AdminUser, reason: string) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function VerifyKycForm({
  user,
  onConfirm,
  onCancel,
  isPending,
}: VerifyKycFormProps) {
  const [verifyReason, setVerifyReason] = useState('');

  const handleSubmit = async () => {
    await onConfirm(user, verifyReason.trim());
  };

  const isValid = verifyReason.trim().length >= 10;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-primary">Manually Verify KYC</DialogTitle>
        <DialogDescription>
          Grant manual verification status for <strong className="text-foreground">{user.name || user.email}</strong>. A detailed reason is required for the compliance audit log.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 py-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="verify-reason">Verification reason</Label>
          <span className={`text-xs ${isValid ? 'text-success' : 'text-muted-foreground'}`}>
            {verifyReason.trim().length}/10 characters min
          </span>
        </div>
        <Textarea
          id="verify-reason"
          placeholder="e.g. Verified official national identity document and bank statement during video onboarding interview."
          value={verifyReason}
          onChange={(e) => setVerifyReason(e.target.value)}
          rows={3}
          disabled={isPending}
        />
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          variant="gradient"
          loading={isPending}
          loadingText="Verifying…"
          disabled={!isValid || isPending}
          onClick={handleSubmit}
        >
          Verify User
        </Button>
      </DialogFooter>
    </>
  );
}

export function VerifyKycDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isPending,
}: VerifyKycDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isPending && onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-md">
        {user && (
          <VerifyKycForm
            key={user.id}
            user={user}
            onConfirm={onConfirm}
            onCancel={() => onOpenChange(false)}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
