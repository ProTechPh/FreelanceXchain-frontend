'use client';

import Link from 'next/link';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRoleSwitch } from '@/hooks/use-role-switch';
import { getRoleLabel, type ParticipantRole } from '@/lib/role-switch';

/**
 * Shown when a participant opens a page from their other role, for example a
 * freelancer contract link while acting as an employer. Switching keeps them
 * on the page they asked for.
 */
export function RoleSwitchPrompt({
  currentRole,
  targetRole,
}: {
  currentRole: ParticipantRole;
  targetRole: ParticipantRole;
}) {
  const { switchTo, switching } = useRoleSwitch();
  const targetLabel = getRoleLabel(targetRole).toLowerCase();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-subtle text-primary">
            <ArrowLeftRight className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-foreground">This page is on your {targetLabel} side</h1>
            <p className="text-sm text-muted-foreground">
              You&apos;re acting as {currentRole === 'employer' ? 'an' : 'a'} {getRoleLabel(currentRole).toLowerCase()}.
              Switch to {targetLabel} to open it.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              onClick={() => void switchTo(targetRole, { stay: true })}
              loading={switching === targetRole}
              loadingText="Switching…"
            >
              Switch to {targetLabel}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/${currentRole}`}>Back to {getRoleLabel(currentRole).toLowerCase()} dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
