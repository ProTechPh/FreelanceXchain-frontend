import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FreelanceXchainLogo } from '@/components/ui/freelancexchain-logo';

// --- HELPER COMPONENTS (ICONS) ---

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

const CheckIcon = () => (
    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const features = [
  '100% Smart Contract Escrow',
  'Zero Platform Fees for Freelancers',
  'Portable On-Chain Reputation',
];

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  homeHref?: string;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  onGoogleSignIn?: () => void;
  onGithubSignIn?: () => void;
  onResetPassword?: () => void;
  onResendConfirmation?: () => void;
  onCreateAccount?: () => void;
  onPasswordlessSignIn?: () => void;
  oauthError?: string | null;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-extrabold text-foreground tracking-tight">Welcome back</span>,
  description = "Access your account and continue your journey with us",
  homeHref,
  onSignIn,
  loading = false,
  onGoogleSignIn,
  onGithubSignIn,
  onResetPassword,
  onResendConfirmation,
  onCreateAccount,
  onPasswordlessSignIn,
  oauthError,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row min-h-dvh w-full bg-background">
      {/* Left side - Branding (hidden on mobile, visible on lg+) */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-chart-2" />
        
        {/* Decorative shapes */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-success/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-success/15 blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 text-primary-foreground w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <FreelanceXchainLogo iconSize={36} className="text-primary-foreground [&_span]:text-primary-foreground" />
          </Link>
          
          {/* Content */}
          <div className="max-w-lg">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs font-bold mb-6 border border-primary-foreground/20 backdrop-blur-sm">
              <Sparkles className="size-3.5" fill="currentColor" />
              <span>Decentralized Freelance Economy</span>
            </div>
            
            {/* Heading */}
            <p className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-5 text-primary-foreground">
              Welcome back to FreelanceXchain
            </p>
            
            {/* Description */}
            <p className="text-lg leading-relaxed mb-10 text-primary-foreground/90">
              Smart contract escrow, AI proposal matching, and portable on-chain reputation — all in one platform.
            </p>
            
            {/* Feature list */}
            <div className="flex flex-col gap-4">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
                    <CheckIcon />
                  </div>
                  <span className="text-primary-foreground font-semibold text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <p className="text-primary-foreground/60 text-sm">
            © 2026 FreelanceXchain. All rights reserved.
          </p>
        </div>
      </div>

      {/* Mobile features banner (visible on mobile, hidden on lg+) */}
      <div className="lg:hidden bg-gradient-to-br from-primary via-primary to-chart-2 p-5 text-primary-foreground">
        <Link href="/" className="flex items-center gap-2.5 mb-4">
          <FreelanceXchainLogo iconSize={28} className="text-primary-foreground [&_span]:text-primary-foreground" />
        </Link>
        <div className="flex flex-col gap-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-foreground/15 flex items-center justify-center shrink-0">
                <CheckIcon />
              </div>
              <span className="text-primary-foreground font-semibold text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Form */}
      <section className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-5 sm:gap-6">
            {/* Back link */}
            {homeHref && (
              <Link
                href={homeHref}
                className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                Back to home
              </Link>
            )}

            {/* OAuth Error Message */}
            {oauthError && (
              <Alert
                tone="destructive"
                title="We couldn't sign you in"
                description={oauthError}
                className="rounded-2xl"
              />
            )}

            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-2 text-muted-foreground text-sm">{description}</p>
            </div>

            {/* Form */}
            <form className="space-y-4 sm:space-y-5" onSubmit={onSignIn}>
              <div>
                <label htmlFor="login-email" className="text-sm font-bold text-foreground mb-1.5 sm:mb-2 block">Email Address</label>
                <input 
                  id="login-email" 
                  name="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  className="w-full px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border/80 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60" 
                  required 
                />
              </div>

              <div>
                <label htmlFor="login-password" className="text-sm font-bold text-foreground mb-1.5 sm:mb-2 block">Password</label>
                <div className="relative">
                  <input 
                    id="login-password" 
                    name="password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Enter your password" 
                    className="w-full px-4 py-3 sm:py-3.5 pr-12 rounded-xl sm:rounded-2xl border border-border/80 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    aria-label={showPassword ? 'Hide password' : 'Show password'} 
                    className="absolute inset-y-0 right-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                    ) : (
                      <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me + Reset password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="rounded border-border accent-primary" />
                  <span className="text-muted-foreground">Keep me signed in</span>
                </label>
                <button type="button" onClick={onResetPassword} className="text-primary font-bold hover:underline">
                  Reset password
                </button>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                loading={loading}
                loadingText="Signing in…"
                className="h-12 sm:h-13 w-full rounded-xl sm:rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-hover shadow-md shadow-primary/20 transition-all duration-200 active:scale-[0.98]"
              >
                Sign in
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <span className="w-full border-t border-border"></span>
              <span className="px-3 text-xs font-medium text-muted-foreground bg-background absolute uppercase tracking-wider">Or continue with</span>
            </div>

            {/* Social login buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={onGoogleSignIn} 
                disabled={loading} 
                className="flex items-center justify-center gap-2.5 border border-border/80 rounded-xl sm:rounded-2xl py-3 sm:py-3.5 transition-all duration-200 hover:bg-muted/50 hover:border-border-strong active:scale-[0.98] disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground font-semibold text-sm text-foreground"
              >
                <GoogleIcon />
                Google
              </button>
              <button 
                type="button" 
                onClick={onGithubSignIn} 
                disabled={loading} 
                className="flex items-center justify-center gap-2.5 border border-border/80 rounded-xl sm:rounded-2xl py-3 sm:py-3.5 transition-all duration-200 hover:bg-muted/50 hover:border-border-strong active:scale-[0.98] disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground font-semibold text-sm text-foreground"
              >
                <GithubIcon />
                GitHub
              </button>
            </div>

            {/* Magic link */}
            <button 
              type="button" 
              onClick={onPasswordlessSignIn} 
              disabled={loading} 
              className="w-full rounded-xl sm:rounded-2xl border border-border/80 py-3 sm:py-3.5 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground active:scale-[0.98] disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground"
            >
              Sign in with email code or magic link
            </button>

            {/* Resend confirmation */}
            <button 
              type="button" 
              onClick={onResendConfirmation} 
              className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              Didn&apos;t receive your account confirmation email?
            </button>

            {/* Create account link */}
            <p className="text-center text-sm text-muted-foreground">
              New to our platform?{' '}
              <button type="button" onClick={onCreateAccount} className="text-primary font-bold hover:underline">
                Create Account
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
