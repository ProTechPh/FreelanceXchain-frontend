import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Briefcase, Wallet, Zap, ShieldCheck, AlertCircle, Smartphone } from 'lucide-react';
import { useAuthStore } from '../../store';
import { Button, Input, Card, Modal } from '../../components/ui';
import api from '../../lib/api';
import type { UserRole } from '../../types';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaData, setMfaData] = useState<{ mfaSessionId: string; factorId: string } | null>(null);
  const [tempAccessToken, setTempAccessToken] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      // Check for tokens in URL fragment (implicit flow)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      console.log('OAuth Callback - URL hash:', hash);
      console.log('OAuth Callback - Access token:', accessToken ? 'Present' : 'Missing');

      // Check for code in query params (PKCE flow)
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('OAuth Error:', error, errorDescription);
        setError(errorDescription || error);
        setIsLoading(false);
        return;
      }

      // Handle implicit flow (tokens in fragment)
      if (accessToken) {
        console.log('Using implicit flow with access token');
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/oauth/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken }),
          });
          
          const data = await response.json();
          
          console.log('OAuth callback response:', { 
            status: response.status, 
            statusText: response.statusText,
            data 
          });

          if (response.status === 202 && data.status === 'registration_required') {
            console.log('New user detected - showing role modal');
            // New user - needs to select role
            setTempAccessToken(data.accessToken || accessToken);
            setShowRoleModal(true);
            setIsLoading(false);
          } else if (response.ok && data.mfaRequired) {
            console.log('MFA required - showing MFA modal');
            // MFA required
            const nextMfaSessionId = data.mfaSessionId ?? data.accessToken;
            if (!nextMfaSessionId || !data.factorId) {
              setError('OAuth MFA response is missing required session data');
              setIsLoading(false);
              return;
            }
            setMfaData({ mfaSessionId: nextMfaSessionId, factorId: data.factorId });
            setShowMfaModal(true);
            setIsLoading(false);
          } else if (response.ok && data.user) {
            console.log('Existing user detected - logging in', data.user);
            console.log('OAuth response data:', data);
            console.log('Access token:', data.accessToken);
            console.log('Refresh token:', data.refreshToken);
            
            // Existing user - login complete
            api.setTokens(data.accessToken, data.refreshToken || refreshToken || '');
            // Fetch CSRF token after setting tokens - don't block login if it fails
            try {
              await api.fetchCsrfToken();
            } catch (csrfError) {
              console.warn('CSRF token fetch failed after login, but continuing:', csrfError);
            }
            setUser(data.user);
            navigate('/dashboard');
          } else if (response.ok) {
            console.log('Unexpected success response:', data);
            // Check if it's a successful response without user (might be registration required)
            if (data.status === 'registration_required' || data.message?.includes('register')) {
              console.log('Registration required detected in success response');
              setTempAccessToken(data.accessToken || accessToken);
              setShowRoleModal(true);
              setIsLoading(false);
            } else {
              console.error('Success response but no user data:', data);
              setError(data.error?.message || data.message || 'OAuth authentication failed');
              setIsLoading(false);
            }
          } else {
            console.error('OAuth failed:', response.status, data);
            setError(data.error?.message || data.message || 'OAuth authentication failed');
            setIsLoading(false);
          }
        } catch (err) {
          console.error('OAuth callback error:', err);
          setError(err instanceof Error ? err.message : 'Failed to complete OAuth');
          setIsLoading(false);
        }
        return;
      }

      // Handle PKCE flow (code in query)
      if (code) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000'}/api/auth/callback?code=${code}`);
          const data = await response.json();

          if (response.status === 202 && data.status === 'registration_required') {
            // New user - needs to select role
            setTempAccessToken(data.access_token);
            setShowRoleModal(true);
            setIsLoading(false);
          } else if (response.ok && data.user) {
            // Existing user - login complete
            api.setTokens(data.accessToken, data.refreshToken);
            // Fetch CSRF token after setting tokens - don't block login if it fails
            try {
              await api.fetchCsrfToken();
            } catch (csrfError) {
              console.warn('CSRF token fetch failed after login, but continuing:', csrfError);
            }
            setUser(data.user);
            navigate('/dashboard');
          } else {
            setError(data.error?.message || 'OAuth authentication failed');
            setIsLoading(false);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to complete OAuth');
          setIsLoading(false);
        }
        return;
      }

      setError('No authorization code or tokens received');
      setIsLoading(false);
    };

    handleCallback();
  }, [searchParams, navigate, setUser]);

  const handleRoleSubmit = async () => {
    if (!selectedRole || !tempAccessToken) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await api.registerOAuth(
        tempAccessToken,
        selectedRole as 'freelancer' | 'employer',
        walletAddress || undefined
      );
      setUser(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaData || mfaCode.length !== 6) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await api.verifyMFALogin(mfaData.mfaSessionId, mfaData.factorId, mfaCode);
      api.setTokens(result.accessToken, result.refreshToken);
      // Fetch CSRF token after setting tokens
      try {
        await api.fetchCsrfToken();
      } catch (csrfError) {
        console.warn('CSRF token fetch failed after MFA login, but continuing:', csrfError);
      }
      setUser(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
      setIsLoading(false);
    }
  };

  if (isLoading && !showRoleModal && !showMfaModal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 mb-6 shadow-lg shadow-primary-500/30 animate-pulse">
            <Zap className="w-8 h-8 text-white fill-current" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Completing authentication...</h2>
          <p className="text-gray-400">Please wait</p>
        </div>
      </div>
    );
  }

  if (error && !showRoleModal && !showMfaModal) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card variant="glass" className="max-w-md w-full backdrop-blur-xl border-white/10" padding="lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button onClick={() => navigate('/login')} variant="primary" fullWidth>
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (showMfaModal) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
        {/* Background decoration */}
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
            <form onSubmit={handleMfaSubmit} className="space-y-6">
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
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                leftIcon={<ShieldCheck className="w-5 h-5" />}
                helperText="The code refreshes every 30 seconds"
                autoFocus
                required
              />

              <Button
                type="submit"
                fullWidth
                loading={isLoading}
                disabled={mfaCode.length !== 6}
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

  return (
    <>

      {/* Role Selection Modal */}
      <Modal isOpen={showRoleModal} onClose={() => {}} size="md">
        <div className="p-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 mb-6 shadow-lg shadow-primary-500/30">
              <Zap className="w-8 h-8 text-white fill-current" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Complete Your Registration</h2>
            <p className="text-gray-400">Choose your account type to continue</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <Card
              hover
              variant="glass"
              className={`cursor-pointer border-white/10 backdrop-blur-xl group ${
                selectedRole === 'freelancer' ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setSelectedRole('freelancer')}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  selectedRole === 'freelancer'
                    ? 'bg-primary-600 ring-2 ring-primary-500'
                    : 'bg-primary-600/20 ring-1 ring-primary-500/20 group-hover:bg-primary-600'
                }`}>
                  <User className={`w-6 h-6 transition-colors ${
                    selectedRole === 'freelancer' ? 'text-white' : 'text-primary-400 group-hover:text-white'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
                    Freelancer
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 group-hover:text-gray-300 transition-colors">
                    Find projects, showcase your skills, and earn crypto payments
                  </p>
                </div>
              </div>
            </Card>

            <Card
              hover
              variant="glass"
              className={`cursor-pointer border-white/10 backdrop-blur-xl group ${
                selectedRole === 'employer' ? 'ring-2 ring-accent-success' : ''
              }`}
              onClick={() => setSelectedRole('employer')}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  selectedRole === 'employer'
                    ? 'bg-accent-success ring-2 ring-accent-success'
                    : 'bg-accent-success/20 ring-1 ring-accent-success/20 group-hover:bg-accent-success'
                }`}>
                  <Briefcase className={`w-6 h-6 transition-colors ${
                    selectedRole === 'employer' ? 'text-white' : 'text-accent-success group-hover:text-white'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-accent-success/80 transition-colors">
                    Employer
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 group-hover:text-gray-300 transition-colors">
                    Post projects, hire talent, and manage secure escrow payments
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mb-6">
            <Input
              type="text"
              label="Wallet Address (Optional)"
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              leftIcon={<Wallet className="w-5 h-5" />}
            />
          </div>

          <Button
            onClick={handleRoleSubmit}
            variant="glow"
            fullWidth
            size="lg"
            disabled={!selectedRole || isLoading}
            loading={isLoading}
          >
            Complete Registration
          </Button>
        </div>
      </Modal>
    </>
  );
}
