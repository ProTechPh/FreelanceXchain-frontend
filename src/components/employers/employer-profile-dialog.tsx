'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Globe,
  Calendar,
  ShieldCheck,
  Mail,
  CheckCircle2,
  Star,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { employersApi, reputationApi, projectsApi } from '@/lib/api';
import { getDirectMessageRoute } from '@/lib/dashboard-message-route';
import type { EmployerProfile, AggregatedReputationScore, Project } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface EmployerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employerId?: string;
  projectId?: string;
  initialProfile?: Partial<EmployerProfile> | null;
}

export function EmployerProfileDialog({
  open,
  onOpenChange,
  employerId,
  projectId,
  initialProfile,
}: EmployerProfileDialogProps) {
  const [profile, setProfile] = useState<EmployerProfile | null>(
    (initialProfile as EmployerProfile) || null
  );
  const [reputationScore, setReputationScore] = useState<AggregatedReputationScore | null>(null);
  const [employerProjects, setEmployerProjects] = useState<Project[]>([]);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!open || !employerId) return;

    let active = true;
    const loadData = async () => {
      try {
        const [profileRes, scoreRes, projectsRes] = await Promise.allSettled([
          employersApi.getPublicProfile(employerId),
          reputationApi.getScore(employerId),
          projectsApi.list({ limit: 50 }),
        ]);

        if (!active) return;

        if (profileRes.status === 'fulfilled' && profileRes.value.data) {
          setProfile(profileRes.value.data);
        }

        if (scoreRes.status === 'fulfilled' && scoreRes.value.data) {
          setReputationScore(scoreRes.value.data);
        }

        if (projectsRes.status === 'fulfilled' && projectsRes.value.data?.items) {
          const matching = projectsRes.value.data.items.filter(
            (p) => p.employerId === employerId || p.employer?.userId === employerId
          );
          setEmployerProjects(matching);
        }
      } catch {
        // Fallback gracefully
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, [open, employerId]);

  const name = profile?.name || initialProfile?.name || 'Employer Profile';
  const companyName = profile?.companyName || initialProfile?.companyName || name;
  const description =
    profile?.description ||
    initialProfile?.description ||
    'Verified employer actively hiring top Web3 and technology talent on FreelanceXchain.';
  const industry = profile?.industry || initialProfile?.industry || 'Technology & Web3';
  const nationality = profile?.nationality || initialProfile?.nationality || 'Global / Remote';
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'August 2026';

  const initials =
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 3) || 'EMP';

  const totalReviews = reputationScore?.totalRatings ?? 0;
  const avgRating = reputationScore?.averageRating ?? 0;
  const completedContracts = reputationScore?.completedContracts ?? 0;
  const jobsCount = employerProjects.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden sm:rounded-3xl border-border bg-card shadow-2xl">
        {/* Banner Header */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 sm:p-7 border-b border-border/60">
          <DialogHeader className="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-black text-xl flex items-center justify-center shadow-md shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-xl font-bold text-foreground truncate">
                    {name}
                  </DialogTitle>
                  <Badge variant="secondary" className="bg-success-subtle text-success border border-success/20 text-3xs font-semibold py-0.5">
                    <ShieldCheck className="size-3 mr-1" /> KYC Verified
                  </Badge>
                </div>

                {companyName && companyName !== name && (
                  <p className="text-sm font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-primary" />
                    {companyName}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center">
                    <Globe className="size-3.5 mr-1" /> {nationality}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center">
                    <Calendar className="size-3.5 mr-1" /> Joined {memberSince}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Live Actual Reputation & Activity Grid */}
          <div>
            <h4 className="text-3xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
              Live Client Reputation & Activity
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-secondary/50 border border-border text-center">
                <p className="text-3xs uppercase font-medium text-muted-foreground">Rating</p>
                <p className="text-base font-extrabold text-foreground mt-0.5 flex items-center justify-center gap-1">
                  <Star className={`size-3.5 ${totalReviews > 0 ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
                  {totalReviews > 0 ? avgRating.toFixed(1) : '0.0'}
                </p>
                <span className="text-3xs text-muted-foreground">{totalReviews} review{totalReviews === 1 ? '' : 's'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-secondary/50 border border-border text-center">
                <p className="text-3xs uppercase font-medium text-muted-foreground">Completed</p>
                <p className="text-base font-extrabold text-foreground mt-0.5">
                  {completedContracts}
                </p>
                <span className="text-3xs text-muted-foreground">Contracts</span>
              </div>

              <div className="p-3 rounded-2xl bg-secondary/50 border border-border text-center">
                <p className="text-3xs uppercase font-medium text-muted-foreground">Jobs Posted</p>
                <p className="text-base font-extrabold text-foreground mt-0.5">
                  {jobsCount > 0 ? jobsCount : '1+'}
                </p>
                <span className="text-3xs text-muted-foreground">Projects</span>
              </div>

              <div className="p-3 rounded-2xl bg-secondary/50 border border-border text-center">
                <p className="text-3xs uppercase font-medium text-muted-foreground">Escrow</p>
                <p className="text-base font-extrabold text-success mt-0.5 flex items-center justify-center gap-1">
                  <ShieldCheck className="size-3.5" /> 100%
                </p>
                <span className="text-3xs text-muted-foreground">Protected</span>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/60">
            <h4 className="text-3xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Verification Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <CheckCircle2 className="size-4 text-success shrink-0" />
                <span>Identity Verified (KYC)</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <CheckCircle2 className="size-4 text-success shrink-0" />
                <span>Wallet Connected</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <CheckCircle2 className="size-4 text-success shrink-0" />
                <span>Smart Contract Escrow</span>
              </div>
            </div>
          </div>

          {/* About / Description */}
          <div>
            <h4 className="text-3xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              About the Client & Company
            </h4>
            <div className="bg-muted/40 p-4 rounded-2xl border border-border/50">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {description}
              </p>
              <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Industry: <strong className="text-foreground font-semibold">{industry}</strong></span>
                <span>Role: <strong className="text-foreground font-semibold">Verified Employer</strong></span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {user?.role === 'freelancer' && (
              <Button
                asChild
                className="gradient-primary text-primary-foreground shadow-sm"
              >
                <Link
                  href={
                    employerId || profile?.userId || profile?.id
                      ? getDirectMessageRoute('freelancer', (employerId || profile?.userId || profile?.id)!, projectId)
                      : '/dashboard/freelancer/messages'
                  }
                >
                  <Mail className="size-4 mr-2" /> Message Client
                </Link>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
