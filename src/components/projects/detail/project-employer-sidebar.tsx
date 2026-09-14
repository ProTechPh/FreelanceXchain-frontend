'use client';

import { ShieldCheck, User } from 'lucide-react';
import type { Project } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAmount } from '@/lib/format';
import { formatDate, formatPostedDate } from './project-meta-helpers';

interface ProjectEmployerSidebarProps {
  project: Project;
  onOpenEmployerDialog: () => void;
}

export function ProjectEmployerSidebar({
  project,
  onOpenEmployerDialog,
}: ProjectEmployerSidebarProps) {
  const employerDisplayName = project.employer?.name || project.employer?.companyName || 'Employer';
  const employerInitials = employerDisplayName.split(' ').map((n) => n[0]).join('') || '?';

  return (
    <div className="space-y-6">
      {/* Project Stats */}
      <Card className="rounded-2xl border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Budget</span>
            <span className="font-bold text-primary text-lg">{formatAmount(project.budget)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Deadline</span>
            <span className="text-sm font-semibold text-foreground">{formatDate(project.deadline)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Proposals</span>
            <span className="text-sm font-semibold text-foreground">{project.proposalCount || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Posted</span>
            <span className="text-sm font-semibold text-foreground">{formatPostedDate(project.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Employer Info */}
      {project.employer && (
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground">About Employer</CardTitle>
              <Badge variant="secondary" className="bg-success-subtle text-success border border-success/20 text-3xs py-0.5">
                <ShieldCheck className="size-3 mr-1" /> Verified
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                {employerInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground truncate">{employerDisplayName}</p>
                <p className="text-xs text-muted-foreground truncate">{project.employer.companyName || 'Verified client'}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full rounded-xl border-border/80 hover:border-primary/50 text-xs font-semibold"
              onClick={onOpenEmployerDialog}
            >
              <User className="size-3.5 mr-1.5 text-primary" /> View Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trust Badge */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">Smart Contract Escrow</h4>
            <p className="text-3xs text-success font-medium flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-success animate-pulse" /> 100% Payment Protected
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-primary/15 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="font-bold text-primary text-2xs mt-0.5">1.</span>
            <p><strong className="text-foreground">Hire & Deposit:</strong> Employer locks milestone funds into on-chain escrow before work starts.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-primary text-2xs mt-0.5">2.</span>
            <p><strong className="text-foreground">Build Safely:</strong> Funds remain securely locked in the smart contract while in progress.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-primary text-2xs mt-0.5">3.</span>
            <p><strong className="text-foreground">Instant Payout:</strong> Once approved, the contract releases payment directly to your wallet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
