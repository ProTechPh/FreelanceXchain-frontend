'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';
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
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Please type DELETE to confirm account deletion.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const { data } = await authApi.deleteAccount();
      toast.success(data.message || 'Your account and personal data have been permanently deleted.');
      setShowDeleteModal(false);
      await onLogout();
      router.push('/');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete account.'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (user?.role !== 'freelancer') {
    return null;
  }

  return (
    <>
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" /> Danger Zone: Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account, profiles, and associated personal records in compliance with data privacy regulations (GDPR Right to Erasure).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Irreversible Account Removal</p>
            <p className="text-xs text-muted-foreground">
              Once deleted, all your active sessions, profile details, and portfolio attachments will be permanently removed.
            </p>
          </div>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="size-4 mr-1.5" /> Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
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
              <p className="text-xs text-muted-foreground">
                All profile information, preferences, and authentication sessions will be immediately erased. Note that accounts with active smart contract escrows cannot be deleted until contracts are closed.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="delete-confirm-input" className="text-xs font-semibold">
              Type <span className="font-mono text-destructive">DELETE</span> to confirm:
            </Label>
            <Input
              id="delete-confirm-input"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeletingAccount}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteConfirmationText.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
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
