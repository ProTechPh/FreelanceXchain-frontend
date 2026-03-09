import { ShieldAlert, ArrowRight, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

interface MfaRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MfaRequiredModal({ isOpen, onClose }: MfaRequiredModalProps) {
  const navigate = useNavigate();

  const handleEnableMfa = () => {
    onClose();
    navigate('/settings', { state: { scrollToMfa: true } });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="MFA Required"
      size="md"
    >
      <div className="space-y-5">
        {/* Alert banner */}
        <div className="flex gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-400">
              Multi-Factor Authentication Required
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Admin and arbitrator accounts require MFA to be enabled before accessing
              sensitive administrative features. This helps protect the platform and
              user data from unauthorized access.
            </p>
          </div>
        </div>

        {/* What you need to do */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            What you need to do:
          </h4>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
            <li>Go to your Security Settings</li>
            <li>Enable MFA using an authenticator app</li>
            <li>Scan the QR code and enter verification code</li>
            <li>Return to access admin features</li>
          </ol>
        </div>

        {/* Supported apps */}
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-dark-bg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Supported apps:</strong> Google Authenticator, Authy, Microsoft Authenticator, 1Password, and other TOTP-compatible apps.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEnableMfa}
          >
            <Settings className="w-4 h-4 mr-1" />
            Go to Security Settings
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
