import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Briefcase, Wallet, ArrowLeft, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { useAuthStore } from '../../store';
import { Button, Input, Card } from '../../components/ui';
import { FaGoogle, FaGithub, FaLinkedin, FaMicrosoft } from 'react-icons/fa';
import api from '../../lib/api';
import type { UserRole } from '../../types';
import { TurnstileCaptcha } from '../../components/TurnstileCaptcha';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    walletAddress: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string>();

  const passwordRules = [
    { label: 'At least 8 characters',        met: formData.password.length >= 8 },
    { label: 'One uppercase letter',          met: /[A-Z]/.test(formData.password) },
    { label: 'One number',                    met: /[0-9]/.test(formData.password) },
    { label: 'One special character (!@#…)',  met: /[^A-Za-z0-9]/.test(formData.password) },
  ];
  const passwordValid = passwordRules.every((r) => r.met);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleOAuth = (provider: string) => {
    window.location.href = api.getOAuthUrl(provider);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!captchaToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }

    if (!passwordValid) {
      setError('Password does not meet all requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        selectedRole as 'freelancer' | 'employer',
        formData.name || undefined,
        formData.walletAddress || undefined,
        captchaToken
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse-glow" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 mb-6 shadow-lg shadow-primary-500/30">
            <Zap className="w-8 h-8 text-white fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-400">Join the decentralized workforce</p>
        </div>

        {step === 'role' ? (
          <div className="space-y-4 animate-fade-in-up">
            <Card
              hover
              variant="glass"
              className="cursor-pointer border-white/10 backdrop-blur-xl group"
              onClick={() => handleRoleSelect('freelancer')}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center group-hover:bg-primary-600 ring-1 ring-primary-500/20 group-hover:ring-primary-500 transition-all duration-300">
                  <User className="w-6 h-6 text-primary-400 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-300 transition-colors">Freelancer</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                    Find projects, showcase your skills, and earn crypto payments
                  </p>
                </div>
              </div>
            </Card>

            <Card
              hover
              variant="glass"
              className="cursor-pointer border-white/10 backdrop-blur-xl group"
              onClick={() => handleRoleSelect('employer')}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent-success/20 rounded-xl flex items-center justify-center group-hover:bg-accent-success ring-1 ring-accent-success/20 group-hover:ring-accent-success transition-all duration-300">
                  <Briefcase className="w-6 h-6 text-accent-success group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-accent-success/80 transition-colors">Employer</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                    Post projects, hire talent, and manage secure escrow payments
                  </p>
                </div>
              </div>
            </Card>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="px-2 bg-white dark:bg-dark-bg text-gray-600 dark:text-gray-500">Or sign up with</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: FaGoogle, color: 'text-red-500', name: 'Google' },
                { icon: FaGithub, color: 'text-gray-900 dark:text-white', name: 'GitHub' },
                { icon: FaLinkedin, color: 'text-blue-500', name: 'LinkedIn' },
                { icon: FaMicrosoft, color: 'text-blue-400', name: 'Microsoft' },
              ].map((provider) => (
                <button
                  key={provider.name}
                  onClick={() => handleOAuth(provider.name.toLowerCase())}
                  className="flex items-center justify-center p-3 bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-white/10 hover:scale-105 transition-all duration-200 group"
                  title={`Sign up with ${provider.name}`}
                >
                  <provider.icon className={`w-5 h-5 ${provider.color} group-hover:scale-110 transition-transform`} />
                </button>
              ))}
            </div>

            <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors hover:underline decoration-primary-500/30 underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <Card variant="glass" className="backdrop-blur-xl border-white/10" padding="lg">
            <button
              onClick={() => setStep('role')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 flex items-center gap-2 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Change role
            </button>

            <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-white/5 border border-white/5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedRole === 'freelancer'
                  ? 'bg-primary-600/20 ring-1 ring-primary-500/30'
                  : 'bg-accent-success/20 ring-1 ring-accent-success/30'
                }`}>
                {selectedRole === 'freelancer' ? (
                  <User className="w-6 h-6 text-primary-400" />
                ) : (
                  <Briefcase className="w-6 h-6 text-accent-success" />
                )}
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-bold capitalize text-lg">{selectedRole}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Account Type</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400 text-center">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-5">
                <Input
                  type="text"
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  leftIcon={<User className="w-5 h-5" />}
                />

                <Input
                  type="email"
                  label="Email Address"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  leftIcon={<Mail className="w-5 h-5" />}
                  required
                />

                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
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
                  {formData.password.length > 0 && (
                    <ul className="mt-2 space-y-1 px-1">
                      {passwordRules.map((rule) => (
                        <li key={rule.label} className={`flex items-center gap-2 text-xs transition-colors ${
                          rule.met ? 'text-green-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {rule.met
                            ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                          {rule.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    leftIcon={<Lock className="w-5 h-5" />}
                    required
                  />
                </div>

                <Input
                  type="text"
                  label="Wallet Address"
                  placeholder="0x..."
                  value={formData.walletAddress}
                  onChange={(e) => handleInputChange('walletAddress', e.target.value)}
                  leftIcon={<Wallet className="w-5 h-5" />}
                />
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-primary-400 hover:text-primary-300 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-400 hover:text-primary-300 hover:underline">
                  Privacy Policy
                </Link>
              </div>

              <TurnstileCaptcha
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => setCaptchaToken(token)}
                onError={() => {
                  setCaptchaToken(undefined);
                  setError('CAPTCHA verification failed. Please try again.');
                }}
                theme="auto"
              />

              <Button type="submit" variant="glow" fullWidth loading={isLoading} size="lg">
                Create Account
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
