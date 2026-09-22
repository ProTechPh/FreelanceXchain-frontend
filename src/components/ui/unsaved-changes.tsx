'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { UnsavedChangesGuard } from '@/hooks/use-unsaved-changes-warning';
import { cn } from '@/lib/utils';

/**
 * Sticky bar that surfaces pending edits and keeps Save reachable without
 * scrolling back to the top of a long form.
 *
 * The pending state is never signalled by colour alone: there is a dot, the
 * word "unsaved", and the bar itself only exists while changes are pending.
 */
function UnsavedChangesBar({
  visible,
  onCancel,
  onSave,
  saving = false,
  label = 'You have unsaved changes',
  className,
}: {
  visible: boolean;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  label?: string;
  className?: string;
}) {
  if (!visible) return null;

  return (
    <div
      data-slot="unsaved-changes-bar"
      role="status"
      aria-live="polite"
      className={cn(
        // The mobile bottom nav owns the bottom of the viewport, so the bar
        // clears it there and sits closer to the edge once that nav is gone.
        'sticky bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-40 flex flex-col gap-3 lg:bottom-4 rounded-xl border border-warning-border bg-card/95 p-3 shadow-lg supports-backdrop-filter:backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pl-4',
        className,
      )}
    >
      <p className="flex items-center gap-2.5 text-sm font-medium text-foreground">
        <span className="size-2 shrink-0 rounded-full bg-warning" aria-hidden="true" />
        {label}
      </p>
      <div className="flex gap-2 sm:shrink-0">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={onSave} loading={saving} loadingText="Saving…">
          Save
        </Button>
      </div>
    </div>
  );
}

/**
 * In-app replacement for `window.confirm` when leaving a form with pending
 * edits. Driven by the guard returned from `useUnsavedChangesWarning`.
 */
function UnsavedChangesDialog({
  guard,
  saving = false,
  title = 'Leave without saving?',
  description = 'Your changes have not been saved yet. Leaving this page discards them.',
}: {
  guard: UnsavedChangesGuard;
  saving?: boolean;
  title?: string;
  description?: string;
}) {
  return (
    <Dialog
      open={guard.isPrompting}
      onOpenChange={(open) => {
        if (!open) guard.keepEditing();
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="ghost" onClick={guard.keepEditing} disabled={saving}>
            Keep editing
          </Button>
          <Button type="button" variant="outline" onClick={guard.discardAndLeave} disabled={saving}>
            Discard changes
          </Button>
          {guard.saveAndLeave && (
            <Button
              type="button"
              onClick={() => void guard.saveAndLeave?.()}
              loading={saving}
              loadingText="Saving…"
            >
              Save and leave
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { UnsavedChangesBar, UnsavedChangesDialog };
