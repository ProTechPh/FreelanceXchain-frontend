import { useState } from 'react';
import { ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useMfa } from '../hooks';
import { MfaSetupModal } from './MfaSetupModal';
import { MfaDisableModal } from './MfaDisableModal';

export function MfaStatusCard() {
  const { isEnabled, isLoading, isActing, verifiedFactor, enroll, verifyEnrollment, disable } = useMfa();
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-gray-500 dark:text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading MFA status…</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between py-2">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 p-2 rounded-lg ${isEnabled ? 'bg-green-500/10' : 'bg-gray-100 dark:bg-dark-bg'}`}>
            {isEnabled ? (
              <ShieldCheck className="w-5 h-5 text-green-500" />
            ) : (
              <ShieldOff className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                MFA
              </p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  isEnabled
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
                }`}
              >
                {isEnabled ? (
                  <ShieldCheck className="w-3 h-3" />
                ) : (
                  <ShieldOff className="w-3 h-3" />
                )}
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isEnabled
                ? verifiedFactor?.created_at
                  ? `Active since ${new Date(verifiedFactor.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
                  : 'Authenticator app is linked to your account'
                : 'Add an extra layer of security using an authenticator app'}
            </p>
          </div>
        </div>

        <Button
          variant={isEnabled ? 'outline' : 'primary'}
          size="sm"
          loading={isActing}
          onClick={() => (isEnabled ? setShowDisable(true) : setShowSetup(true))}
        >
          {isEnabled ? 'Disable' : 'Enable MFA'}
        </Button>
      </div>

      <MfaSetupModal
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        onEnroll={enroll}
        onVerify={verifyEnrollment}
      />

      <MfaDisableModal
        isOpen={showDisable}
        onClose={() => setShowDisable(false)}
        factor={verifiedFactor}
        onDisable={disable}
      />
    </>
  );
}
