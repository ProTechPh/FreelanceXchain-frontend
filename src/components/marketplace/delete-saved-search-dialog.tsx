"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SavedSearch } from "@/types";

type DeleteSavedSearchDialogProps = {
  searchToDelete: SavedSearch | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (searchId: string) => Promise<void>;
};

export function DeleteSavedSearchDialog({
  searchToDelete,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteSavedSearchDialogProps) {
  return (
    <Dialog
      open={searchToDelete !== null}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Saved Search?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <strong className="text-foreground">&quot;{searchToDelete?.name}&quot;</strong>? This
            saved filter preset will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={isDeleting}
            loadingText="Deleting…"
            onClick={async () => {
              if (!searchToDelete) return;
              await onConfirm(searchToDelete.id);
            }}
          >
            Delete Search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
