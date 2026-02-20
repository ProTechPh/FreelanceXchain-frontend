import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuthStore } from '../../store';
import { Button, Input, Card } from '../../components/ui';
import { FaGoogle, FaGithub, FaLinkedin, FaMicrosoft } from 'react-icons/fa';
import api from '../../lib/api';
import { TurnstileCaptcha } from '../../components/TurnstileCaptcha';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!captchaToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }

    try {
      const result = await login(email, password, captchaToken ?? undefined);
      const returnUrl = searchParams.get('returnUrl') || '/dashboard';

      if (result.mfaRequired) {
        navigate('/mfa/challenge', {
          state: { accessToken: result.accessToken, factorId: result.factorId, returnUrl },
        });
        return;
      }

      navigate(returnUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      // Turnstile tokens are single-use; force a new challenge for any retry.
      setCaptchaToken(null);
      setCaptchaResetKey((prev) => prev + 1);
    }
  };

  const handleOAuth = (provider: string) => {
    window.location.href = api.getOAuthUrl(provider);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 mb-6 shadow-lg shadow-primary-500/30">
            <Zap className="w-8 h-8 text-white fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to continue your journey</p>
        </div>

        <Card variant="glass" className="mb-6 backdrop-blur-xl border-white/10" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-fade-in-up">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <Input
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-5 h-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-primary-600 focus:ring-primary-500" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            <TurnstileCaptcha
              key={captchaResetKey}
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => {
                setCaptchaToken(token);
                setError('');
              }}
              onError={() => {
                setCaptchaToken(null);
                setError('CAPTCHA verification failed. Please try again.');
              }}
              onExpire={() => {
                setCaptchaToken(null);
              }}
              theme="auto"
            />

            <Button type="submit" variant="glow" fullWidth loading={isLoading} size="lg" disabled={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="px-2 bg-white dark:bg-transparent text-gray-600 dark:text-gray-500 backdrop-blur-xl">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: FaGoogle, color: 'text-red-500', name: 'Google' },
              { icon: FaGithub, color: 'text-gray-700 dark:text-white', name: 'GitHub' },
              { icon: FaLinkedin, color: 'text-blue-500', name: 'LinkedIn' },
              { icon: FaMicrosoft, color: 'text-blue-400', name: 'Microsoft' },
            ].map((provider) => (
              <button
                key={provider.name}
                onClick={() => handleOAuth(provider.name.toLowerCase())}
                className="flex items-center justify-center p-3 bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-white/10 hover:scale-105 transition-all duration-200 group"
                title={`Sign in with ${provider.name}`}
              >
                <provider.icon className={`w-5 h-5 ${provider.color} group-hover:scale-110 transition-transform`} />
              </button>
            ))}
          </div>
        </Card>

        <p className="text-center text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors hover:underline decoration-primary-500/30 underline-offset-4">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
