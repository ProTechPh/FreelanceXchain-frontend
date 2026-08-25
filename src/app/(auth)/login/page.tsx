'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { SignInPage, Testimonial } from '@/components/marketing/sign-in';
import { getApiErrorMessage } from '@/lib/auth-contract';

// Illustrative product copy, not attributed customer quotes.
const testimonials: Testimonial[] = [
  {
    name: 'Freelancers',
    handle: 'Get paid on delivery',
    text: 'Funds are locked in escrow before you start, and released to your wallet the moment a milestone is approved.',
  },
  {
    name: 'Employers',
    handle: 'Fund with confidence',
    text: 'Release payment per milestone, not up front. Every participant is KYC-verified before a contract can be funded.',
  },
  {
    name: 'Both sides',
    handle: 'One shared record',
    text: 'Contracts, milestones and disputes read the same way for everyone on them, on-chain and auditable.',
  },
];

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleOAuth = (provider: 'google' | 'github') => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    window.location.href = `${apiUrl}/auth/oauth/${provider}`;
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSigningIn) return;

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setIsSigningIn(true);
    try {
      const result = await login(email, password);

      if (result.mfaRequired) {
        router.push('/mfa/verify');
        return;
      }

      toast.success('Welcome back!');
      const user = useAuthStore.getState().user;
      router.push(`/dashboard/${user?.role || 'freelancer'}`);
      // Deliberately not clearing the flag on success: the route change takes a
      // moment, and releasing the button first would flash it back to "Sign in"
      // and invite a second submit against an already-authenticated session.
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to sign in. Please try again.'), { duration: 5000 });
      setIsSigningIn(false);
    }
  };

  return (
    <SignInPage
      homeHref="/"
      heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
      testimonials={testimonials}
      onSignIn={handleSignIn}
      loading={isSigningIn}
      onGoogleSignIn={() => handleOAuth('google')}
      onGithubSignIn={() => handleOAuth('github')}
      onResetPassword={() => router.push('/forgot-password')}
      onResendConfirmation={() => router.push('/resend-confirmation')}
      onCreateAccount={() => router.push('/register')}
      onPasswordlessSignIn={() => router.push('/passwordless')}
    />
  );
}
