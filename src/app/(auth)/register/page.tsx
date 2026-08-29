'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { SignUpPage } from '@/components/marketing/sign-up';
import type { UserRole } from '@/types';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { GuestGuard } from '@/components/auth/guest-guard';

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleOAuth = (provider: 'google' | 'github') => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    window.location.href = `${apiUrl}/auth/oauth/${provider}`;
  };

  const handleSubmit = async (data: { email: string; password: string; role: UserRole }) => {
    try {
      await register(data.email, data.password, data.role);
      toast.success('Account created successfully!');
      router.replace(`/dashboard/${data.role}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Registration failed. Please try again.'));
    }
  };

  return (
    <GuestGuard>
      <SignUpPage
        onSubmit={handleSubmit}
        onGoogleSignIn={() => handleOAuth('google')}
        onGithubSignIn={() => handleOAuth('github')}
        onSignIn={() => router.push('/login')}
        isLoading={isLoading}
      />
    </GuestGuard>
  );
}

