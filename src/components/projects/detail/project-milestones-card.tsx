'use client';

import type { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatAmount, formatDate } from '@/lib/format';
import { useEthPhpRate } from '@/hooks/use-eth-php-rate';

interface ProjectMilestonesCardProps {
  milestones: NonNullable<Project['milestones']>;
  isOwner?: boolean;
  isHired?: boolean;
}

export function ProjectMilestonesCard({ milestones, isOwner = false, isHired = false }: ProjectMilestonesCardProps) {
  const { formatEthToPhp } = useEthPhpRate();

  // If viewing user is neither the employer nor the hired freelancer,
  // milestones are protected under NDA & flexible negotiation
  const isAuthorized = isOwner || isHired;

  if (!isAuthorized) {
    return (
      <Card className="rounded-2xl border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm">
                🔒
              </span>
              Milestones & Deliverables Protected
            </CardTitle>
            <span className="text-2xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              NDA & Proposal Negotiation
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 rounded-xl bg-background/80 border border-border/60 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
              <span>🛡️ Confidential Project Deliverables</span>
            </p>
            <p className="leading-relaxed">
              To safeguard employer proprietary specifications and enable flexible proposal negotiation, exact deliverable milestones are not exposed publicly.
            </p>
            <p className="leading-relaxed">
              Freelancers are encouraged to propose their own milestone breakdown, timeline, and delivery structure in their proposal submission. Specific milestones will be formally locked in Smart Contract Escrow once an offer is accepted and NDA terms are active.
            </p>
          </div>
          <div className="flex items-center justify-between text-2xs text-muted-foreground px-1 pt-1">
            <span>✓ Milestone flexibility allowed</span>
            <span>✓ 100% Escrow protected upon hire</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!milestones || milestones.length === 0) {
    return (
      <Card className="rounded-2xl border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Agreed Deliverables & Payout Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground text-sm">Flexible & Discussion-Based Terms</p>
            <p className="leading-relaxed">
              This project does not require fixed pre-set milestones. Specific deliverables, deadlines, and payouts are agreed upon directly between the employer and each freelancer. Payouts are protected in escrow and released upon approval of finished work.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-foreground">Milestones</CardTitle>
          {isOwner && (
            <span className="text-xs text-muted-foreground font-medium">
              Employer Guidelines (Visible to you)
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {milestones.map((milestone, i) => (
            <div
              key={milestone.id}
              className="p-4 rounded-xl bg-secondary/20 border border-border/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{milestone.title}</h4>
                    {milestone.description && (
                      <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                    )}
                    {milestone.dueDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {formatDate(milestone.dueDate)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={milestone.status} domain="milestone" size="sm" />
                  <div className="text-right">
                    <p className="font-bold text-sm text-primary">{formatEthToPhp(milestone.amount)}</p>
                    <p className="text-2xs text-muted-foreground">{formatAmount(milestone.amount, { currency: 'ETH' })}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
