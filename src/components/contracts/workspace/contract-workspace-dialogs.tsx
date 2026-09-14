'use client';

import type { Milestone } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatAmount } from '@/lib/format';

interface ContractWorkspaceDialogsProps {
  cancelModalOpen: boolean;
  onCancelModalChange: (open: boolean) => void;
  approvingMilestone: Milestone | null;
  onApprovingMilestoneChange: (milestone: Milestone | null) => void;
  actionId: string | null;
  onConfirmCancel: () => void;
  onConfirmApproveMilestone: () => void;
}

export function ContractWorkspaceDialogs({
  cancelModalOpen,
  onCancelModalChange,
  approvingMilestone,
  onApprovingMilestoneChange,
  actionId,
  onConfirmCancel,
  onConfirmApproveMilestone,
}: ContractWorkspaceDialogsProps) {
  return (
    <>
      {/* Contract Cancellation Confirmation Modal */}
      <Dialog
        open={cancelModalOpen}
        onOpenChange={(open) => {
          if (!actionId) onCancelModalChange(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancel this contract?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this pending contract? This will release any uncommitted escrow and close the workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onCancelModalChange(false)}
              disabled={actionId === 'cancel'}
            >
              Keep Contract
            </Button>
            <Button
              variant="destructive"
              loading={actionId === 'cancel'}
              loadingText="Cancelling…"
              disabled={actionId === 'cancel'}
              onClick={onConfirmCancel}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Milestone Approval & Escrow Release Confirmation Modal */}
      <Dialog
        open={approvingMilestone !== null}
        onOpenChange={(open) => {
          if (!open && !actionId) onApprovingMilestoneChange(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Approve Milestone & Release Payment?</DialogTitle>
            <DialogDescription>
              You are about to release payment for{' '}
              <strong>&quot;{approvingMilestone?.title}&quot;</strong> (
              {formatAmount(approvingMilestone?.amount)}). This will transfer funds to the freelancer. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onApprovingMilestoneChange(null)}
              disabled={Boolean(actionId)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              loading={Boolean(actionId)}
              loadingText="Releasing funds…"
              onClick={onConfirmApproveMilestone}
            >
              Confirm & Release Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
