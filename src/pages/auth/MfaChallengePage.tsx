import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Smartphone } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import { useAuthStore } from '../../store';

interface LocationState {
  mfaSessionId?: string;
  factorId?: string;
  returnUrl?: string;
}

export function MfaChallengePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { loginWithMfa, isLoading } = useAuthStore();

  const state = (location.state as LocationState) ?? {};
  const { mfaSessionId, factorId, returnUrl = '/dashboard' } = state;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  // If we arrived here without the required MFA state, go back to login
  if (!mfaSessionId || !factorId) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setError('');

    try {
      await loginWithMfa(mfaSessionId, factorId, code);
      showToast({
        type: 'success',
        title: 'Verified',
        message: 'MFA verification successful',
      });
      navigate(returnUrl, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background decoration — matches other auth pages */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse-glow" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse-glow"
        style={{ animationDelay: '1s' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 mb-6 shadow-lg shadow-primary-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            MFA Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <Card variant="glass" className="backdrop-blur-xl border-white/10" padding="lg">
          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-fade-in-up">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

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
              helperText="The code refreshes every 30 seconds"
              autoFocus
              required
            />

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              disabled={code.length !== 6}
            >
              Verify
            </Button>
          </form>
        </Card>

        {/* Hint */}
        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-500 dark:text-gray-400">
          <Smartphone className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Using an authenticator app?</p>
            <p>
              Open Google Authenticator, Authy, or 1Password and find the code for
              your FreelanceXchain account. It refreshes every 30 seconds.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Having trouble?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-primary-500 hover:underline font-medium"
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
}
