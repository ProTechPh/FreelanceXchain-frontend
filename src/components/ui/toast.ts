import { toast as sonnerToast, type ExternalToast } from 'sonner';

/**
 * Extended toast options with undo support.
 */
interface UndoToastOptions extends ExternalToast {
  /** Duration in milliseconds before the action becomes irreversible. */
  duration?: number;
  /** Creative action requiring undo. Does not auto-dismiss until undone or duration expires. */
  undoAction?: {
    /** Label for the undo button. */
    label?: string;
    /** Callback fired when user clicks undo. */
    onClick: () => void | Promise<void>;
  };
}

/**
 * Enhanced toast utilities with undo support for reversible actions.
 *
 * Use these helpers when an action can be reversed within a short window.
 * For destructive actions that cannot be undone, use the standard toast
 * methods with confirmation dialogs instead.
 *
 * @example
 * ```tsx
 * // Archive with undo
 * toast.success('Project archived', { undoAction: { onClick: handleUndo } });
 *
 * // Dismiss with undo
 * toast.info('Notification dismissed', { undoAction: { onClick: () => setDismissed(false) } });
 * ```
 */
export const toast = {
  success: (message: string, options?: UndoToastOptions) => {
    const { undoAction, ...rest } = options ?? {};
    return sonnerToast.success(message, {
      ...rest,
      duration: rest.duration ?? (undoAction ? 8000 : 5000),
      action: undoAction
        ? {
            label: undoAction.label ?? 'Undo',
            onClick: undoAction.onClick,
          }
        : undefined,
    });
  },

  error: (message: string, options?: ExternalToast) => {
    return sonnerToast.error(message, {
      duration: 5000,
      ...options,
    });
  },

  info: (message: string, options?: UndoToastOptions) => {
    const { undoAction, ...rest } = options ?? {};
    return sonnerToast.info(message, {
      ...rest,
      duration: rest.duration ?? (undoAction ? 8000 : 4000),
      action: undoAction
        ? {
            label: undoAction.label ?? 'Undo',
            onClick: undoAction.onClick,
          }
        : undefined,
    });
  },

  warning: (message: string, options?: UndoToastOptions) => {
    const { undoAction, ...rest } = options ?? {};
    return sonnerToast.warning(message, {
      ...rest,
      duration: rest.duration ?? (undoAction ? 8000 : 5000),
      action: undoAction
        ? {
            label: undoAction.label ?? 'Undo',
            onClick: undoAction.onClick,
          }
        : undefined,
    });
  },

  /** Show a toast with an explicit undo action. Alias for toast.success with undo. */
  undo: (
    message: string,
    undoCallback: () => void | Promise<void>,
    options?: Omit<ExternalToast, 'action'>
  ) => {
    return sonnerToast.success(message, {
      duration: 8000,
      ...options,
      action: {
        label: 'Undo',
        onClick: undoCallback,
      },
    });
  },

  /** Promise-based toast that resolves to success or error. */
  promise: sonnerToast.promise,

  /** Dismiss a specific toast or all toasts. */
  dismiss: sonnerToast.dismiss,

  /** Custom toast with full control. */
  custom: sonnerToast.custom,

  /** Loading state toast. */
  loading: sonnerToast.loading,

  /** Get toast by ID. */
  get: sonnerToast.get,
};

export { Toaster } from './sonner';