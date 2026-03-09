import { useState } from 'react';
import { ShieldOff, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../contexts/ToastContext';
import type { MfaFactor } from '../types';

interface MfaDisableModalProps {
  isOpen: boolean;
  onClose: () => void;
  factor: MfaFactor | null;
  onDisable: (factorId: string, totpCode: string) => Promise<void>;
}

export function MfaDisableModal({ isOpen, onClose, factor, onDisable }: MfaDisableModalProps) {
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDisable = async () => {
    if (!factor || code.length !== 6) return;
    setIsLoading(true);
    try {
      await onDisable(factor.id, code);
      showToast({
        type: 'success',
        title: 'MFA Disabled',
        message: 'MFA has been turned off',
      });
      handleClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to Disable MFA',
        message: err.message ?? 'Please check your code and try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setIsLoading(false);
    onClose();
  };

  const enrolledDate = factor?.created_at
    ? new Date(factor.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Disable MFA"
      size="md"
    >
      <div className="space-y-5">
        {/* Warning banner */}
        <div className="flex gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-400">This will reduce your account security</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Disabling MFA means your account will only be protected by your password.
              {enrolledDate && (
                <span className="block mt-1 text-xs text-gray-500">
                  Enrolled on {enrolledDate}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Confirm with TOTP code */}
        <div className="space-y-2">
          <Input
            label="Confirm with your authenticator code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            leftIcon={<ShieldOff className="w-5 h-5" />}
            helperText="Enter the 6-digit code from your authenticator app to confirm"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDisable}
            loading={isLoading}
            disabled={code.length !== 6}
          >
            Disable MFA
          </Button>
        </div>
      </div>
    </Modal>
  );
}
