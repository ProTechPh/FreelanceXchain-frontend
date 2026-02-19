import { useState, useEffect } from 'react';
import { ShieldCheck, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../contexts/ToastContext';
import type { MfaEnrollResponse } from '../types';

interface MfaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: () => Promise<MfaEnrollResponse>;
  onVerify: (factorId: string, code: string) => Promise<void>;
}

type Step = 'scan' | 'verify';

export function MfaSetupModal({ isOpen, onClose, onEnroll, onVerify }: MfaSetupModalProps) {
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('scan');
  const [enrollData, setEnrollData] = useState<MfaEnrollResponse | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const [loadingEnroll, setLoadingEnroll] = useState(false);

  const handleOpen = async () => {
    setLoadingEnroll(true);
    try {
      const data = await onEnroll();
      setEnrollData(data);
      
      // Generate QR code image from the otpauth URL
      const qrDataUrl = await QRCode.toDataURL(data.qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Enrollment Failed', message: err.message ?? 'Could not start MFA enrollment' });
      onClose();
    } finally {
      setLoadingEnroll(false);
    }
  };

  // Trigger enrollment load whenever the modal opens
  useEffect(() => {
    if (isOpen && !enrollData && !loadingEnroll && step === 'scan') {
      handleOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCopySecret = () => {
    if (enrollData?.secret) {
      navigator.clipboard.writeText(enrollData.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  };

  const handleVerify = async () => {
    if (!enrollData || code.length !== 6) return;
    setIsLoading(true);
    try {
      await onVerify(enrollData.factorId, code);
      showToast({
        type: 'success',
        title: 'MFA Enabled',
        message: 'MFA has been successfully activated',
      });
      handleClose();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Invalid Code', message: err.message ?? 'The code you entered is incorrect' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('scan');
    setEnrollData(null);
    setQrCodeDataUrl('');
    setCode('');
    setIsLoading(false);
    setLoadingEnroll(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Set Up MFA"
      size="md"
    >
      <div className="space-y-5">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 'scan' ? 'text-primary-500' : 'text-green-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'scan' ? 'bg-primary-500 text-white' : 'bg-green-500 text-white'}`}>
              {step === 'verify' ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            Scan QR Code
          </div>
          <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
          <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 'verify' ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'verify' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-dark-border text-gray-500'}`}>
              2
            </div>
            Verify Code
          </div>
        </div>

        {step === 'scan' && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Scan the QR code below with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
            </p>

            {loadingEnroll ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : enrollData ? (
              <>
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl border border-gray-200 dark:border-dark-border shadow-sm">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="MFA QR Code"
                        className="w-48 h-48"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Can't scan? Enter this secret manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-gray-800 dark:text-gray-200 break-all">
                      {enrollData.secret}
                    </code>
                    <button
                      onClick={handleCopySecret}
                      className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {secretCopied ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                  <Button onClick={() => setStep('verify')}>
                    Next — Enter Code
                  </Button>
                </div>
              </>
            ) : null}
          </>
        )}

        {step === 'verify' && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Open your authenticator app and enter the 6-digit code shown for this account.
            </p>

            <Input
              label="Verification Code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              leftIcon={<ShieldCheck className="w-5 h-5" />}
              helperText="Enter the 6-digit code from your authenticator app"
              autoFocus
            />

            {code.length > 0 && code.length < 6 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-500">
                <AlertCircle className="w-3.5 h-3.5" />
                Code must be 6 digits
              </div>
            )}

            <div className="flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep('scan')}>
                ← Back
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button
                  onClick={handleVerify}
                  loading={isLoading}
                  disabled={code.length !== 6}
                >
                  Verify &amp; Enable
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
