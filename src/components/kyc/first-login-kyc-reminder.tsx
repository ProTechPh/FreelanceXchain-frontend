'use client';

import { CircleCheck, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { UserRole } from '@/types';

const protectedActions = {
  freelancer: [
    'Submit and manage project proposals',
    'Complete milestones and receive escrow payments',
    'Use dispute and review actions',
  ],
  employer: [
    'Publish projects and manage proposals',
    'Fund contracts and approve milestone payments',
    'Use dispute and review actions',
  ],
} satisfies Record<'freelancer' | 'employer', string[]>;

interface FirstLoginKycReminderProps {
  open: boolean;
  role: Extract<UserRole, 'freelancer' | 'employer'>;
  onLater: () => void;
  onVerify: () => void;
}

export function FirstLoginKycReminder({
  open,
  role,
  onLater,
  onVerify,
}: FirstLoginKycReminderProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onLater(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pr-8">
          <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
          <DialogTitle className="text-xl font-bold leading-tight">
            Verify your identity to unlock all features
          </DialogTitle>
          <DialogDescription>
            Some actions stay unavailable until your KYC verification is approved. Verify now so the platform works as expected.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2" aria-label="Features that require identity verification">
          {protectedActions[role].map((action) => (
            <li key={action} className="flex items-start gap-2 text-sm text-foreground">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{action}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground">
          You can do this later from Verification in your account menu.
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onLater}>
            Do it later
          </Button>
          <Button type="button" variant="gradient" onClick={onVerify}>
            <ShieldCheck className="size-4" aria-hidden="true" />
            Verify identity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
