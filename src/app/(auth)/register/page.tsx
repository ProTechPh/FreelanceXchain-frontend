'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { SignUpPage } from '@/components/ui/sign-up';
import type { UserRole } from '@/types';

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleOAuth = (provider: 'google' | 'github') => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    window.location.href = `${apiUrl}/auth/oauth/${provider}`;
  };

  const handleSubmit = async (data: { name: string; email: string; password: string; role: UserRole }) => {
    try {
      await register(data.email, data.password, data.name, data.role);
      toast.success('Account created successfully!');
      router.push(`/dashboard/${data.role}`);
    } catch {
      toast.error('Registration failed. Please try again.');
    }
  };

  return (
    <SignUpPage
      heroImageSrc="https://images.unsplash.com/photo-1551434678-e076c223a692?w=2160&q=80"
      onSubmit={handleSubmit}
      onGoogleSignIn={() => handleOAuth('google')}
      onGithubSignIn={() => handleOAuth('github')}
      onSignIn={() => router.push('/login')}
      isLoading={isLoading}
    />
  );
}
