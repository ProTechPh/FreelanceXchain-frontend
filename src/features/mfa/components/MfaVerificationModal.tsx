import { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { AlertCircle } from 'lucide-react';

interface MfaVerificationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onVerify: (code: string) => Promise<void>;
  error?: string | null;
  isLoading?: boolean;
  /** Whether to allow closing the modal (default: false for login flows) */
  allowClose?: boolean;
}

export function MfaVerificationModal({
  isOpen,
  onClose,
  onVerify,
  error,
  isLoading = false,
  allowClose = false,
}: MfaVerificationModalProps) {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset code when modal opens
  useEffect(() => {
    if (isOpen) {
      setCode('');
      // Focus the input after a short delay to ensure modal is rendered
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset code when error occurs
  useEffect(() => {
    if (error) {
      setCode('');
      inputRef.current?.focus();
    }
  }, [error]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  const handleSubmit = async () => {
    if (code.length !== 6 || isLoading) return;
    await onVerify(code);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6 && !isLoading) {
      handleSubmit();
    }
  };

  const handleClose = () => {
    if (allowClose && onClose) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 mb-4 shadow-lg shadow-primary-500/30">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4 animate-fade-in-up">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Code input */}
        <div className="mb-6">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono 
              bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 
              rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
              text-gray-900 dark:text-white placeholder-gray-400
              transition-all duration-200"
            autoComplete="one-time-code"
            autoFocus
          />
          <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
            The code refreshes every 30 seconds
          </p>
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          variant="glow"
          fullWidth
          size="lg"
          disabled={code.length !== 6 || isLoading}
          loading={isLoading}
        >
          Verify & Continue
        </Button>

        {/* Back link for closeable modals */}
        {allowClose && onClose && (
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Having trouble?{' '}
            <button
              type="button"
              onClick={onClose}
              className="text-primary-500 hover:underline font-medium"
            >
              Go back
            </button>
          </p>
        )}
      </div>
    </Modal>
  );
}
