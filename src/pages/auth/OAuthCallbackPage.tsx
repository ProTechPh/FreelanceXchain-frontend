import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Briefcase, Wallet, Zap } from 'lucide-react';
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
  const [mfaData, setMfaData] = useState<{ accessToken: string; factorId: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
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
            setMfaData({ accessToken: data.accessToken, factorId: data.factorId });
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

  const handleMfaSubmit = async () => {
    if (!mfaData || mfaCode.length !== 6) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await api.verifyMFALogin(mfaData.accessToken, mfaData.factorId, mfaCode);
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
      setMfaCode('');
    }
  };

  if (isLoading && !showRoleModal) {
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

  if (error && !showRoleModal) {
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

  return (
    <>
      {/* MFA Verification Modal */}
      <Modal isOpen={showMfaModal} onClose={() => {}} size="sm">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 mb-4 shadow-lg shadow-primary-500/30">
              <span className="text-3xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h2>
            <p className="text-gray-400">Enter the 6-digit code from your authenticator app</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
          </div>

          <Button
            onClick={handleMfaSubmit}
            variant="glow"
            fullWidth
            size="lg"
            disabled={mfaCode.length !== 6 || isLoading}
            loading={isLoading}
          >
            Verify & Continue
          </Button>
        </div>
      </Modal>

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
