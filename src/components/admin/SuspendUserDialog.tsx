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

interface SuspendUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onConfirm: (user: AdminUser, reason: string) => Promise<void>;
  isPending: boolean;
}

interface SuspendUserFormProps {
  user: AdminUser;
  onConfirm: (user: AdminUser, reason: string) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function SuspendUserForm({
  user,
  onConfirm,
  onCancel,
  isPending,
}: SuspendUserFormProps) {
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendReasonError, setSuspendReasonError] = useState<string | null>(null);

  const handleReasonChange = (val: string) => {
    setSuspendReason(val);
    if (val.trim().length >= 10) {
      setSuspendReasonError(null);
    } else if (val.trim().length > 0) {
      setSuspendReasonError('Suspension reason must be at least 10 characters.');
    }
  };

  const handleSubmit = async () => {
    await onConfirm(user, suspendReason.trim());
  };

  const isValid = suspendReason.trim().length >= 10;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-destructive">Suspend User</DialogTitle>
        <DialogDescription>
          Are you sure you want to suspend <strong className="text-foreground">{user.name || user.email}</strong>? They will immediately lose access to their account until unsuspended.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 py-2">
        <Label htmlFor="suspend-reason">Reason for suspension</Label>
        <Textarea
          id="suspend-reason"
          placeholder="e.g. Terms of Service violation, suspicious escrow activity, or chargeback request."
          value={suspendReason}
          onChange={(e) => handleReasonChange(e.target.value)}
          rows={3}
          disabled={isPending}
          aria-invalid={Boolean(suspendReasonError || (suspendReason.length > 0 && !isValid))}
          aria-describedby="suspend-reason-validation"
        />
        <div className="flex items-center justify-between text-xs">
          {(suspendReasonError || (suspendReason.length > 0 && !isValid)) ? (
            <p id="suspend-reason-validation" className="text-destructive font-medium" role="alert">
              Suspension reason must be at least 10 characters.
            </p>
          ) : (
            <p id="suspend-reason-validation" className="text-muted-foreground">
              Minimum 10 characters required for audit trail.
            </p>
          )}
          <span className={`ml-auto font-mono ${!isValid ? 'text-muted-foreground' : 'text-success'}`}>
            {suspendReason.trim().length}/10
          </span>
        </div>
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
          variant="destructive"
          loading={isPending}
          loadingText="Suspending…"
          disabled={!isValid || isPending}
          onClick={handleSubmit}
        >
          Suspend User
        </Button>
      </DialogFooter>
    </>
  );
}

export function SuspendUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isPending,
}: SuspendUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isPending && onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-md">
        {user && (
          <SuspendUserForm
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
