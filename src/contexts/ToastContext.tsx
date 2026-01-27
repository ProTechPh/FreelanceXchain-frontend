import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast } from '../components/ui/Toast';
import api from '../lib/api';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  position?: ToastPosition;
  showProgress?: boolean;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  position?: ToastPosition;
  showProgress?: boolean;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = options.id || `toast-${Date.now()}-${Math.random()}`;
    const duration = options.duration ?? 5000;
    const type = options.type || 'info';

    const newToast: ToastItem = {
      ...options,
      id,
      type,
      position: options.position || 'top-right',
      showProgress: options.showProgress ?? true,
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, []);

  // Register toast callback with API client for auth failures
  useEffect(() => {
    api.setToastCallback((toast) => {
      showToast({
        type: toast.type,
        title: toast.title,
        message: toast.message,
      });
    });
  }, [showToast]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, title?: string) => {
    showToast({ type: 'success', message, title });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast({ type: 'error', message, title });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    showToast({ type: 'warning', message, title });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast({ type: 'info', message, title });
  }, [showToast]);

  // Group toasts by position
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const pos = toast.position || 'top-right';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(toast);
    return acc;
  }, {} as Record<ToastPosition, ToastItem[]>);

  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast, success, error, warning, info }}>
      {children}
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={`fixed z-[9999] flex flex-col gap-2 ${positionClasses[position as ToastPosition]} max-w-md w-full pointer-events-none`}
        >
          <AnimatePresence mode="popLayout">
            {positionToasts.map((toast) => (
              <Toast
                key={toast.id}
                id={toast.id}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                duration={toast.duration}
                action={toast.action}
                showProgress={toast.showProgress}
                onClose={() => hideToast(toast.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ))}
    </ToastContext.Provider>
  );
}
