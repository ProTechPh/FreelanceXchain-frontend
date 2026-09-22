'use client';

import * as React from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Alert variant determining the visual treatment.
 * - destructive: Red/warning styling for irreversible destructive actions
 * - warning: Yellow/caution styling for potentially risky actions
 * - default: Neutral styling for confirmations
 */
type AlertVariant = 'destructive' | 'warning' | 'default';

interface AlertDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title - should clearly state the action */
  title: string;
  /** Detailed description of what will happen */
  description: string;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Called when user confirms the action */
  onConfirm: () => void | Promise<void>;
  /** Called when user cancels - defaults to closing the dialog */
  onCancel?: () => void;
  /** Visual variant based on action severity */
  variant?: AlertVariant;
  /** Whether the confirm action is currently loading */
  loading?: boolean;
  /** Text shown while loading */
  loadingText?: string;
}

const variantConfig: Record<AlertVariant, { icon: typeof AlertTriangle; iconClass: string; bgClass: string }> = {
  destructive: {
    icon: AlertTriangle,
    iconClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
  },
  warning: {
    icon: AlertCircle,
    iconClass: 'text-warning',
    bgClass: 'bg-warning/10',
  },
  default: {
    icon: Info,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
};

/**
 * Confirmation dialog for destructive or sensitive actions.
 *
 * Implements UX best practices:
 * - Clear visual distinction for destructive actions (red styling)
 * - Explicit confirmation required (no auto-confirm)
 * - Cancel option prominently placed (left side, outline style)
 * - Loading state with disabled interaction during async operations
 * - Icon + title + description pattern for accessibility
 *
 * @example
 * ```tsx
 * <AlertDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Delete project?"
 *   description="This will permanently delete the project and all associated data. This action cannot be undone."
 *   variant="destructive"
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  loading = false,
  loadingText,
}: AlertDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Error handling is left to the caller
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full',
                config.bgClass
              )}
              aria-hidden="true"
            >
              <Icon className={cn('size-5', config.iconClass)} />
            </div>
            <DialogTitle
              className={cn(
                'text-lg',
                variant === 'destructive' && 'text-destructive'
              )}
            >
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-left pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            loading={loading}
            loadingText={loadingText}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage alert dialog state for destructive actions.
 *
 * @example
 * ```tsx
 * const confirmDelete = useConfirmDialog();
 *
 * // Trigger confirmation
 * <Button onClick={() => confirmDelete.prompt(item.id)}>Delete</Button>
 *
 * // Render dialog
 * <AlertDialog
 *   open={confirmDelete.isOpen}
 *   onOpenChange={confirmDelete.cancel}
 *   title="Delete item?"
 *   onConfirm={() => handleDelete(confirmDelete.data)}
 * />
 * ```
 */
export function useConfirmDialog<T = unknown>() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    data: T | null;
  }>({ isOpen: false, data: null });

  const prompt = (data: T) => setState({ isOpen: true, data });
  const cancel = () => setState({ isOpen: false, data: null });
  const confirm = () => setState({ isOpen: false, data: null });

  return {
    isOpen: state.isOpen,
    data: state.data,
    prompt,
    cancel,
    confirm,
  };
}

export { type AlertDialogProps as AlertDialogProps };
