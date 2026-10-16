'use client';

import { CircleCheck, ShieldAlert } from 'lucide-react';
import { PlanBadge } from '@/components/billing/plan-badge';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useRoleSwitch } from '@/hooks/use-role-switch';
import { getRoleLabel, isParticipantRole, type ParticipantRole } from '@/lib/role-switch';

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

const SWITCHABLE_ROLES: ParticipantRole[] = ['freelancer', 'employer'];

/**
 * Freelancer | Employer toggle: the highlighted side is the one the user is
 * acting as; clicking the other side switches to it.
 */
function RoleToggle({ role }: { role: ParticipantRole }) {
  const { switchTo, switching } = useRoleSwitch();
  return (
    <div role="group" aria-label="Acting as" className="mx-2 mb-1 flex rounded-md bg-muted p-0.5">
      {SWITCHABLE_ROLES.map((option) => {
        const active = option === role;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (!active) void switchTo(option);
            }}
            disabled={switching !== null && !active}
            className={cn(
              'min-h-7 flex-1 rounded-sm px-2 text-2xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground disabled:text-muted-foreground',
            )}
          >
            {switching === option ? 'Switching…' : getRoleLabel(option)}
          </button>
        );
      })}
    </div>
  );
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
          title={isAdmin ? `${user.name ?? 'Admin'} · Administrator` : `${user.name ?? 'Account'}${verified ? ' · Identity verified' : ' · Identity not verified'}`}
        >
          {initials(user.name)}
          <span className="sr-only">
            {user.name} — {isAdmin ? 'Administrator' : (verified ? 'Identity verified' : 'Identity not verified — complete verification to unlock all features')}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div>
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
              // The check is the verified signal; the second line no longer repeats it.
              <span className="inline-flex shrink-0" title="Identity verified">
                <CircleCheck className="size-3 text-success" aria-hidden="true" />
                <span className="sr-only">Identity verified</span>
              </span>
            ) : (
              <ShieldAlert className="size-3 shrink-0 text-warning" aria-hidden="true" />
            )}
            {/* Renders nothing for Free users and admins, and nothing until the
                session resolves — see PlanBadge. */}
            <PlanBadge className="shrink-0" />
          </div>
          <p className="truncate text-2xs text-muted-foreground">
            {isAdmin ? (
              <span className="font-medium text-primary">Administrator</span>
            ) : (
              <>
                {address ? (
                  <span className="font-mono text-foreground">{address}</span>
                ) : (
                  <Link
                    href={`/dashboard/${user.role || 'freelancer'}/settings`}
                    className="text-primary hover:underline"
                  >
                    No wallet
                  </Link>
                )}
                {!verified && (
                  <>
                    {' · '}
                    <Link
                      href={`/dashboard/${user.role || 'freelancer'}/verification`}
                      className="font-sans text-warning hover:underline"
                    >
                      Verify identity
                    </Link>
                  </>
                )}
              </>
            )}
          </p>
        </div>
      </div>
      {isParticipantRole(user.role) && <RoleToggle role={user.role} />}
    </div>
  );
}
