import { type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'confirmation' | 'danger' | 'success';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  footer?: ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
  className
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl mx-4',
  };

  const variantStyles = {
    default: 'border-gray-200 dark:border-white/10',
    confirmation: 'border-blue-500/30',
    danger: 'border-red-500/30',
    success: 'border-green-500/30',
  };

  const variantIcons = {
    default: null,
    confirmation: <Info className="w-6 h-6 text-blue-400" />,
    danger: <AlertTriangle className="w-6 h-6 text-red-400" />,
    success: <CheckCircle className="w-6 h-6 text-green-400" />,
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnBackdrop ? onClose : undefined}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className={clsx(
                'glass-card w-full pointer-events-auto relative my-8 border',
                sizeClasses[size],
                variantStyles[variant],
                className
              )}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-white/10">
                  {variantIcons[variant]}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex-1">{title}</h2>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Close button without title */}
              {!title && showCloseButton && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white z-10"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Content */}
              <div className={clsx('p-6', !title && showCloseButton && 'pt-12')}>
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

// Confirmation Modal Helper
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'confirmation' | 'danger';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'confirmation',
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      variant={variant}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{message}</p>
    </Modal>
  );
}
