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
import { countMeaningfulChars } from '@/lib/text-validation';

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

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

  const reasonLength = verifyReason.trim().length;
  const isValid = countMeaningfulChars(verifyReason) >= MIN_REASON_LENGTH && reasonLength <= MAX_REASON_LENGTH;

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
          <Label htmlFor="verify-reason">Audit reason</Label>
          <span className={`text-xs ${isValid ? 'text-success' : 'text-muted-foreground'}`}>
            {reasonLength}/{MAX_REASON_LENGTH}
          </span>
        </div>
        <Textarea
          id="verify-reason"
          placeholder="e.g. Verified official national identity document and bank statement during video onboarding interview."
          value={verifyReason}
          onChange={(e) => setVerifyReason(e.target.value)}
          rows={3}
          minLength={MIN_REASON_LENGTH}
          maxLength={MAX_REASON_LENGTH}
          disabled={isPending}
          aria-invalid={verifyReason.length > 0 && !isValid}
          aria-describedby="verify-reason-validation"
        />
        <p
          id="verify-reason-validation"
          className={`text-xs ${verifyReason.length > 0 && !isValid ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
          role={verifyReason.length > 0 && !isValid ? 'alert' : undefined}
        >
          Audit reason needs at least {MIN_REASON_LENGTH} letters or numbers (max {MAX_REASON_LENGTH} characters).
        </p>
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
