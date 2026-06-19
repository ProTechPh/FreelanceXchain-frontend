import React, { useState } from 'react';
import { Eye, EyeOff, User, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

const GithubIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
);

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

interface SignUpPageProps {
  heroImageSrc?: string;
  onSubmit?: (data: { name: string; email: string; password: string; role: UserRole }) => void;
  onGoogleSignIn?: () => void;
  onGithubSignIn?: () => void;
  onSignIn?: () => void;
  isLoading?: boolean;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  heroImageSrc,
  onSubmit,
  onGoogleSignIn,
  onGithubSignIn,
  onSignIn,
  isLoading = false,
}) => {
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [role, setRole] = useState<UserRole>('freelancer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('details');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.({ name, email, password, role });
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      {/* Left column: sign-up form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            {step === 'role' ? (
              <>
                <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
                  <span className="font-light text-foreground tracking-tighter">Create an</span> account
                </h1>
                <p className="animate-element animate-delay-200 text-muted-foreground">Choose how you want to use FreelanceXchain</p>

                <div className="animate-element animate-delay-300 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRoleSelect('freelancer')}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm hover:border-violet-400/70 hover:bg-violet-500/10 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                      <User className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">I&apos;m a Freelancer</p>
                      <p className="text-xs text-muted-foreground mt-1">Find work and get paid securely</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleSelect('employer')}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm hover:border-cyan-400/70 hover:bg-cyan-500/10 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                      <Briefcase className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">I&apos;m an Employer</p>
                      <p className="text-xs text-muted-foreground mt-1">Hire talent for your projects</p>
                    </div>
                  </button>
                </div>

                <div className="animate-element animate-delay-400 relative flex items-center justify-center">
                  <span className="w-full border-t border-border"></span>
                  <span className="px-4 text-sm text-muted-foreground bg-background absolute">Or continue with</span>
                </div>

                <div className="animate-element animate-delay-500 grid grid-cols-2 gap-3">
                  <button onClick={onGoogleSignIn} className="flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors">
                      <GoogleIcon />
                      Google
                  </button>
                  <button onClick={onGithubSignIn} className="flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors">
                      <GithubIcon />
                      GitHub
                  </button>
                </div>

                <p className="animate-element animate-delay-600 text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); onSignIn?.(); }} className="text-violet-400 hover:underline transition-colors">Sign in</a>
                </p>
              </>
            ) : (
              <>
                <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
                  <span className="font-light text-foreground tracking-tighter">{role === 'freelancer' ? 'Freelancer' : 'Employer'}</span> account
                </h1>
                <p className="animate-element animate-delay-200 text-muted-foreground">Complete your registration</p>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="animate-element animate-delay-300">
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <GlassInputWrapper>
                      <input name="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" required />
                    </GlassInputWrapper>
                  </div>

                  <div className="animate-element animate-delay-400">
                    <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                    <GlassInputWrapper>
                      <input name="email" type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" required />
                    </GlassInputWrapper>
                  </div>

                  <div className="animate-element animate-delay-500">
                    <label className="text-sm font-medium text-muted-foreground">Password</label>
                    <GlassInputWrapper>
                      <div className="relative">
                        <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                          {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                        </button>
                      </div>
                    </GlassInputWrapper>
                  </div>

                  <div className="animate-element animate-delay-600">
                    <label className="text-sm font-medium text-muted-foreground">Confirm Password</label>
                    <GlassInputWrapper>
                      <input name="confirmPassword" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" required />
                    </GlassInputWrapper>
                  </div>

                  <div className="animate-element animate-delay-700 flex items-start gap-3">
                    <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 rounded border-border" />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to the{' '}
                      <a href="/terms" className="text-violet-400 hover:underline">Terms of Service</a>
                      {' '}and{' '}
                      <a href="/privacy" className="text-violet-400 hover:underline">Privacy Policy</a>
                    </label>
                  </div>

                  <button type="submit" disabled={isLoading} className="animate-element animate-delay-800 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="animate-element animate-delay-900 w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Back to role selection
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Right column: hero image */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
        </section>
      )}
    </div>
  );
};
