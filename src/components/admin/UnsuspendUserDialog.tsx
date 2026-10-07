'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { AdminUser } from '@/types';

interface UnsuspendUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onConfirm: (user: AdminUser) => Promise<void>;
  isPending: boolean;
}

export function UnsuspendUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isPending,
}: UnsuspendUserDialogProps) {
  const handleClose = () => {
    if (!isPending) {
      onOpenChange(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    await onConfirm(user);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isPending && onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-success">Unsuspend User</DialogTitle>
          <DialogDescription>
            Are you sure you want to unsuspend <strong className="text-foreground">{user?.name || user?.email}</strong>? They will immediately regain full access to their account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            loading={isPending}
            loadingText="Unsuspending…"
            disabled={isPending}
            onClick={handleSubmit}
          >
            Unsuspend User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
