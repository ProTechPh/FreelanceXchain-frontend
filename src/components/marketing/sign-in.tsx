import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';

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


// --- TYPE DEFINITIONS ---

export interface Testimonial {
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  homeHref?: string;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  /**
   * Sign-in is in flight. Signing in can take a couple of seconds against a
   * cold backend, and without this the button gave no feedback at all — so the
   * natural reaction was to click it again.
   */
  loading?: boolean;
  onGoogleSignIn?: () => void;
  onGithubSignIn?: () => void;
  onResetPassword?: () => void;
  onResendConfirmation?: () => void;
  onCreateAccount?: () => void;
  onPasswordlessSignIn?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-info-border focus-within:bg-info-subtle">
    {children}
  </div>
);

  const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <figure className={`animate-testimonial ${delay} flex w-64 items-start gap-3 rounded-xl border border-border bg-card/70 p-5 backdrop-blur-xl`}>
    {/* Initials rather than a stock photo: no third-party image request, and no
        implication that a specific pictured person said this. */}
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-lg gradient-primary text-sm font-bold text-primary-foreground"
    >
      {testimonial.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
    </span>
    <div className="text-sm leading-snug">
      <figcaption className="font-medium text-foreground">{testimonial.name}</figcaption>
      <p className="text-xs text-muted-foreground">{testimonial.handle}</p>
      <blockquote className="mt-1 text-foreground/80">{testimonial.text}</blockquote>
    </div>
  </figure>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  homeHref,
  heroImageSrc,
  testimonials = [],
  onSignIn,
  loading = false,
  onGoogleSignIn,
  onGithubSignIn,
  onResetPassword,
  onResendConfirmation,
  onCreateAccount,
  onPasswordlessSignIn,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            {homeHref && (
              <Link
                href={homeHref}
                className="animate-element inline-flex w-fit items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to home
              </Link>
            )}
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label htmlFor="login-email" className="text-sm font-medium text-muted-foreground">Email Address</label>
                <GlassInputWrapper>
                  <input id="login-email" name="email" type="email" placeholder="Enter your email address" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" required />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label htmlFor="login-password" className="text-sm font-medium text-muted-foreground">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                  <span className="text-foreground/90">Keep me signed in</span>
                </label>
                <button type="button" onClick={onResetPassword} className="text-info transition-colors hover:underline">Reset password</button>
              </div>

              <Button
                type="submit"
                loading={loading}
                loadingText="Signing in…"
                className="animate-element animate-delay-600 h-14 w-full rounded-2xl text-base"
              >
                Sign in
              </Button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">Or continue with</span>
            </div>

            <div className="animate-element animate-delay-800 grid grid-cols-2 gap-3">
              <button type="button" onClick={onGoogleSignIn} disabled={loading} className="flex items-center justify-center gap-3 border border-border rounded-2xl py-4 transition-colors hover:bg-secondary disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground">
                  <GoogleIcon />
                  Google
              </button>
              <button type="button" onClick={onGithubSignIn} disabled={loading} className="flex items-center justify-center gap-3 border border-border rounded-2xl py-4 transition-colors hover:bg-secondary disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground">
                  <GithubIcon />
                  GitHub
              </button>
            </div>

            <button type="button" onClick={onPasswordlessSignIn} disabled={loading} className="w-full rounded-2xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground">
              Sign in with email code or magic link
            </button>

            <button type="button" onClick={onResendConfirmation} className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline">
              Didn&apos;t receive your account confirmation email?
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              New to our platform? <button type="button" onClick={onCreateAccount} className="text-info transition-colors hover:underline">Create Account</button>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
