'use client';

import { CircleCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

function initials(name: string | undefined): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function shortAddress(address: string | undefined): string | null {
  if (!address) return null;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Identity and trust state at the foot of the sidebar, following the workspace
 * mock on the landing page.
 *
 * On a platform that holds escrow, "who am I signed in as, is my identity
 * verified, and which wallet will get paid" is standing context, not something
 * to go hunting for in a menu — so it is always on screen rather than only
 * inside the avatar dropdown.
 */
export function SidebarUserCard({ collapsed = false }: { collapsed?: boolean }) {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const verified = user.kycStatus === 'approved' || user.kycStatus === 'completed';
  const address = shortAddress(user.walletAddress);

  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-3">
        <span
          className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
          title={isAdmin ? `${user.name ?? 'Admin'} · Administrator` : `${user.name ?? 'Account'}${verified ? ' · KYC verified' : ' · Verification pending'}`}
        >
          {initials(user.name)}
          <span className="sr-only">
            {user.name} — {isAdmin ? 'Administrator' : (verified ? 'KYC verified' : 'verification pending')}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
      >
        {initials(user.name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-xs font-bold text-foreground">{user.name ?? 'Account'}</p>
          {isAdmin ? (
            <CircleCheck className="size-3 shrink-0 text-primary" aria-hidden="true" />
          ) : verified ? (
            <CircleCheck className="size-3 shrink-0 text-success" aria-hidden="true" />
          ) : (
            <ShieldAlert className="size-3 shrink-0 text-warning" aria-hidden="true" />
          )}
        </div>
        <p className="truncate text-2xs text-muted-foreground">
          {isAdmin ? (
            <span className="font-medium text-primary">Administrator</span>
          ) : (
            <>
              {address ? (
                <span className="font-mono text-foreground">{address} · </span>
              ) : (
                <Link
                  href={`/dashboard/${user.role || 'freelancer'}/settings`}
                  className="text-primary hover:underline"
                >
                  No wallet ·{' '}
                </Link>
              )}
              <span className={cn('font-sans', verified ? 'text-success' : 'text-warning')}>
                {verified ? 'KYC verified' : 'Verification pending'}
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
