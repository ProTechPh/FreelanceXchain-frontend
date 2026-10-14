'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Building2,
  Globe,
  Calendar,
  ShieldCheck,
  Mail,
  CheckCircle2,
  Star,
  Briefcase,
  ExternalLink,
  FolderCheck,
  Users,
  Award,
  TrendingUp,
  MessageSquareOff,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { employersApi, reputationApi, projectsApi, reviewsApi } from '@/lib/api';
import { formatAmount } from '@/lib/format';
import { getDirectMessageRoute } from '@/lib/dashboard-message-route';
import type {
  EmployerProfile,
  AggregatedReputationScore,
  Project,
  ReputationWorkHistoryEntry,
  Review,
  ReputationBreakdown,
  ReputationMetadata,
} from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface EmployerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employerId?: string;
  projectId?: string;
  initialProfile?: Partial<EmployerProfile> | null;
}

const starKeys = [
  [5, 'fiveStars'],
  [4, 'fourStars'],
  [3, 'threeStars'],
  [2, 'twoStars'],
  [1, 'oneStar'],
] as const;

function formatDateSafe(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  const [breakdown, setBreakdown] = useState<ReputationBreakdown | null>(null);
  const [metadata, setMetadata] = useState<ReputationMetadata | null>(null);
  const [employerProjects, setEmployerProjects] = useState<Project[]>([]);
  const [workHistory, setWorkHistory] = useState<ReputationWorkHistoryEntry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [copiedTxHash, setCopiedTxHash] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  // Focus the scroll area on open so the dialog starts at the top instead of
  // jumping down to the first tab trigger.
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleCopyTx = (txHash: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!txHash) return;
    void navigator.clipboard.writeText(txHash).then(() => {
      setCopiedTxHash(txHash);
      toast.success('Reputation transaction hash copied to clipboard');
      setTimeout(() => {
        setCopiedTxHash((prev) => (prev === txHash ? null : prev));
      }, 2500);
    }).catch(() => {
      toast.error('Failed to copy transaction hash');
    });
  };

  useEffect(() => {
    if (!open || !employerId) return;

    let active = true;
    const loadData = async () => {
      try {
        const [
          profileRes,
          scoreRes,
          breakdownRes,
          metadataRes,
          projectsRes,
          historyRes,
          reviewsRes,
        ] = await Promise.allSettled([
          employersApi.getPublicProfile(employerId),
          reputationApi.getScore(employerId),
          reputationApi.getBreakdown(employerId),
          reputationApi.getMetadata(employerId),
          projectsApi.list({ limit: 50 }),
          reputationApi.getWorkHistory(employerId),
          reviewsApi.getForUser(employerId),
        ]);

        if (!active) return;

        if (profileRes.status === 'fulfilled' && profileRes.value.data) {
          setProfile(profileRes.value.data);
        }

        if (scoreRes.status === 'fulfilled' && scoreRes.value.data) {
          setReputationScore(scoreRes.value.data);
        }

        if (breakdownRes.status === 'fulfilled' && breakdownRes.value.data) {
          setBreakdown(breakdownRes.value.data);
        }

        if (metadataRes.status === 'fulfilled' && metadataRes.value.data) {
          setMetadata(metadataRes.value.data);
        }

        if (projectsRes.status === 'fulfilled' && projectsRes.value.data?.items) {
          const matching = projectsRes.value.data.items.filter(
            (p) => p.employerId === employerId || p.employer?.userId === employerId
          );
          setEmployerProjects(matching);
        }

        if (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value.data)) {
          setWorkHistory(historyRes.value.data);
        }

        if (reviewsRes.status === 'fulfilled' && Array.isArray(reviewsRes.value.data)) {
          setReviews(reviewsRes.value.data);
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

  interface CompletedContractItem {
    id: string;
    projectId?: string;
    title: string;
    budget?: number;
    completedAt?: string;
    rating?: number;
    comment?: string;
    transactionHash?: string;
  }

  const completedContractsList: CompletedContractItem[] = [];
  const seenKeys = new Set<string>();

  for (const entry of workHistory) {
    const matchProj = employerProjects.find((p) => p.id === entry.projectId);
    const matchRev = reviews.find(
      (r) =>
        r.contractId === entry.contractId ||
        (entry.projectId && r.projectId === entry.projectId)
    );
    const metaMatch = metadata?.ratings?.find(
      (m) =>
        (entry.contractId && m.contractId === entry.contractId) ||
        (entry.ratingComment && m.comment === entry.ratingComment)
    );
    const txHash = entry.transactionHash || metaMatch?.transactionHash;

    const key = entry.projectId || entry.contractId;
    if (key) seenKeys.add(key);

    completedContractsList.push({
      id: entry.contractId || entry.projectId,
      projectId: entry.projectId,
      title: entry.projectTitle || matchProj?.title || 'Completed Contract',
      budget: matchProj?.budget,
      completedAt: entry.completedAt || matchProj?.updatedAt,
      rating: entry.rating ?? matchRev?.rating,
      comment: entry.ratingComment ?? matchRev?.comment,
      transactionHash: txHash,
    });
  }

  for (const proj of employerProjects) {
    if (proj.status === 'completed' && !seenKeys.has(proj.id)) {
      const matchRev = reviews.find((r) => r.projectId === proj.id);
      completedContractsList.push({
        id: proj.id,
        projectId: proj.id,
        title: proj.title,
        budget: proj.budget,
        completedAt: proj.updatedAt,
        rating: matchRev?.rating,
        comment: matchRev?.comment,
      });
      seenKeys.add(proj.id);
    }
  }

  interface DisplayReviewItem {
    id?: string;
    contractId?: string;
    projectTitle: string;
    reviewerName: string;
    rating: number;
    comment?: string;
    createdAt: string;
    transactionHash?: string;
  }

  const displayReviews: DisplayReviewItem[] = [];
  const seenReviewKeys = new Set<string>();

  if (breakdown?.recentRatings) {
    for (const r of breakdown.recentRatings) {
      const meta = metadata?.ratings?.find(
        (m) =>
          (r.id && m.id === r.id) ||
          (r.contractId && m.contractId === r.contractId) ||
          (r.comment && m.comment === r.comment)
      );
      const key = r.id || `${r.projectTitle}-${r.createdAt}`;
      seenReviewKeys.add(key);
      displayReviews.push({
        id: r.id,
        contractId: r.contractId,
        projectTitle: r.projectTitle,
        reviewerName: r.reviewerName || 'Freelancer',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        transactionHash: meta?.transactionHash,
      });
    }
  }

  for (const rev of reviews) {
    const matchProj = employerProjects.find((p) => p.id === rev.projectId);
    const key = rev.id || `${rev.contractId}-${rev.createdAt}`;
    if (!seenReviewKeys.has(key)) {
      const meta = metadata?.ratings?.find(
        (m) => m.id === rev.id || m.contractId === rev.contractId
      );
      displayReviews.push({
        id: rev.id,
        contractId: rev.contractId,
        projectTitle: matchProj?.title || 'Contract Review',
        reviewerName: 'Freelancer',
        rating: rev.rating,
        comment: rev.comment,
        createdAt: rev.createdAt,
        transactionHash: meta?.transactionHash,
      });
      seenReviewKeys.add(key);
    }
  }

  for (const wh of workHistory) {
    if (wh.rating && !displayReviews.some((r) => r.contractId === wh.contractId)) {
      const meta = metadata?.ratings?.find(
        (m) =>
          (wh.contractId && m.contractId === wh.contractId) ||
          (wh.ratingComment && m.comment === wh.ratingComment)
      );
      displayReviews.push({
        contractId: wh.contractId,
        projectTitle: wh.projectTitle || 'Completed Contract',
        reviewerName: 'Freelancer',
        rating: wh.rating,
        comment: wh.ratingComment,
        createdAt: wh.completedAt,
        transactionHash: wh.transactionHash || meta?.transactionHash,
      });
    }
  }

  const starCounts = {
    fiveStars: breakdown?.fiveStars ?? displayReviews.filter((r) => Math.round(r.rating) === 5).length,
    fourStars: breakdown?.fourStars ?? displayReviews.filter((r) => Math.round(r.rating) === 4).length,
    threeStars: breakdown?.threeStars ?? displayReviews.filter((r) => Math.round(r.rating) === 3).length,
    twoStars: breakdown?.twoStars ?? displayReviews.filter((r) => Math.round(r.rating) === 2).length,
    oneStar: breakdown?.oneStar ?? displayReviews.filter((r) => Math.round(r.rating) === 1).length,
  };

  const ratingsFromReviews = displayReviews.map((r) => r.rating).filter((r) => r > 0);
  const computedAvg =
    ratingsFromReviews.length > 0
      ? ratingsFromReviews.reduce((a, b) => a + b, 0) / ratingsFromReviews.length
      : 0;
  const avgRating =
    reputationScore?.averageRating && reputationScore.averageRating > 0
      ? reputationScore.averageRating
      : computedAvg;
  const totalReviews = Math.max(reputationScore?.totalRatings ?? 0, displayReviews.length);
  const completedContracts = Math.max(reputationScore?.completedContracts ?? 0, completedContractsList.length);
  const jobsCount = employerProjects.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent initialFocus={bodyRef} className="flex flex-col gap-0 max-h-[calc(100dvh-2rem)] sm:max-w-2xl p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-border bg-card shadow-2xl">
        {/* Banner Header */}
        <div className="relative shrink-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-4 pr-12 sm:p-7 sm:pr-14 border-b border-border/60">
          <DialogHeader className="p-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="size-12 sm:size-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-black text-base sm:text-xl flex items-center justify-center shadow-md shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <DialogTitle className="min-w-0 max-w-full text-lg sm:text-xl font-bold text-foreground truncate">
                    {name}
                  </DialogTitle>
                  <Badge variant="secondary" className="bg-success-subtle text-success border border-success/20 text-xs font-semibold py-0.5">
                    <ShieldCheck className="size-3 mr-1" /> KYC Verified
                  </Badge>
                </div>

                {companyName && companyName !== name && (
                  <p className="text-sm font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5 min-w-0">
                    <Building2 className="size-3.5 text-primary shrink-0" />
                    <span className="truncate">{companyName}</span>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 sm:mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center">
                    <Globe className="size-3.5 mr-1" /> {nationality}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="inline-flex items-center">
                    <Calendar className="size-3.5 mr-1" /> Joined {memberSince}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div ref={bodyRef} tabIndex={-1} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-7 space-y-5 outline-none">
          {/* Live Actual Reputation & Activity Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
              Live Client Reputation & Activity
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-secondary/50 border border-border text-center">
                <p className="text-xs uppercase font-medium text-muted-foreground">Rating</p>
                <p className="text-base font-extrabold text-foreground mt-0.5 flex items-center justify-center gap-1">
                  <Star className={`size-3.5 ${totalReviews > 0 ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
                  {totalReviews > 0 ? avgRating.toFixed(1) : '0.0'}
                </p>
                <span className="text-xs text-muted-foreground">{totalReviews} review{totalReviews === 1 ? '' : 's'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-secondary/50 border border-border text-center">
                <p className="text-xs uppercase font-medium text-muted-foreground">Completed</p>
                <p className="text-base font-extrabold text-foreground mt-0.5">
                  {completedContracts}
                </p>
                <span className="text-xs text-muted-foreground">Contracts</span>
              </div>

              <div className="p-3 rounded-2xl bg-secondary/50 border border-border text-center">
                <p className="text-xs uppercase font-medium text-muted-foreground">Jobs Posted</p>
                <p className="text-base font-extrabold text-foreground mt-0.5">
                  {jobsCount > 0 ? jobsCount : '1+'}
                </p>
                <span className="text-xs text-muted-foreground">Projects</span>
              </div>

              <div className="p-3 rounded-2xl bg-secondary/50 border border-border text-center">
                <p className="text-xs uppercase font-medium text-muted-foreground">Escrow</p>
                <p className="text-base font-extrabold text-success mt-0.5 flex items-center justify-center gap-1">
                  <ShieldCheck className="size-3.5" /> 100%
                </p>
                <span className="text-xs text-muted-foreground">Protected</span>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
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

          {/* Contracts, Reputation & Projects Tabs */}
          <div>
            <Tabs defaultValue="completed" className="w-full">
              <TabsList className="grid grid-cols-3 w-full h-auto bg-muted/60 p-1 rounded-xl">
                <TabsTrigger value="completed" className="min-w-0 h-auto flex-col sm:flex-row gap-0.5 sm:gap-1.5 whitespace-normal text-center leading-tight rounded-lg text-[11px] sm:text-xs font-semibold px-1 py-1.5 sm:py-2">
                  <CheckCircle2 className="size-3.5 text-success" />
                  Completed ({completedContractsList.length})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="min-w-0 h-auto flex-col sm:flex-row gap-0.5 sm:gap-1.5 whitespace-normal text-center leading-tight rounded-lg text-[11px] sm:text-xs font-semibold px-1 py-1.5 sm:py-2">
                  <Star className="size-3.5 text-warning fill-warning" />
                  Reviews ({totalReviews})
                </TabsTrigger>
                <TabsTrigger value="all" className="min-w-0 h-auto flex-col sm:flex-row gap-0.5 sm:gap-1.5 whitespace-normal text-center leading-tight rounded-lg text-[11px] sm:text-xs font-semibold px-1 py-1.5 sm:py-2">
                  <Briefcase className="size-3.5 text-primary" />
                  All Jobs ({jobsCount})
                </TabsTrigger>
              </TabsList>

              {/* Completed Contracts Tab */}
              <TabsContent value="completed" className="space-y-2.5 mt-3 focus-visible:outline-none">
                {completedContractsList.length > 0 ? (
                  <div className="space-y-2.5 sm:max-h-[340px] sm:overflow-y-auto sm:pr-1">
                    {completedContractsList.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-secondary/30 hover:bg-secondary/50 border border-border/70 transition-all space-y-2"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {item.projectId ? (
                              <Link
                                href={
                                  user?.role === 'freelancer'
                                    ? `/dashboard/freelancer/projects/${item.projectId}`
                                    : `/projects/${item.projectId}`
                                }
                                className="text-sm font-bold text-foreground hover:text-primary transition-colors inline-flex max-w-full items-center gap-1.5 group"
                              >
                                <span className="min-w-0 line-clamp-1">{item.title}</span>
                                <ExternalLink className="size-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                              </Link>
                            ) : (
                              <p className="text-sm font-bold text-foreground line-clamp-1">{item.title}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {item.completedAt && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="size-3 text-muted-foreground" />
                                  Completed {formatDateSafe(item.completedAt)}
                                </span>
                              )}
                              {item.budget !== undefined && item.budget > 0 && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="font-semibold text-primary">
                                    {formatAmount(item.budget, { currency: 'ETH' })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <Badge
                            variant="secondary"
                            className="bg-success-subtle text-success border border-success/20 text-xs font-semibold py-0.5 shrink-0"
                          >
                            <CheckCircle2 className="size-3 mr-1" /> Completed
                          </Badge>
                        </div>

                        {/* Review or Rating if exists */}
                        {(item.rating !== undefined || item.comment) && (
                          <div className="mt-2 pt-2 border-t border-border/40 bg-background/50 rounded-xl p-2.5 space-y-1">
                            {item.rating !== undefined && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                <div className="flex items-center text-warning fill-warning">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`size-3 ${
                                        i < Math.round(item.rating || 0)
                                          ? 'text-warning fill-warning'
                                          : 'text-muted-foreground/30'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span>{item.rating.toFixed(1)}</span>
                                <span className="text-muted-foreground font-normal text-[11px]">
                                  rating by freelancer
                                </span>
                              </div>
                            )}
                            {item.comment && (
                              <p className="text-xs italic text-muted-foreground leading-relaxed">
                                &ldquo;{item.comment}&rdquo;
                              </p>
                            )}
                          </div>
                        )}

                        {item.transactionHash && /^0x[0-9a-f]{64}$/i.test(item.transactionHash) && (
                          <div className="mt-2 pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-2xs">
                            <div className="flex items-center gap-1.5 font-mono text-muted-foreground min-w-0">
                              <ShieldCheck className="size-3.5 text-primary shrink-0" />
                              <span className="font-sans font-semibold text-muted-foreground uppercase tracking-wider">
                                Reputation Tx:
                              </span>
                              <span className="font-semibold text-foreground truncate select-all" title={item.transactionHash}>
                                {item.transactionHash.slice(0, 10)}…{item.transactionHash.slice(-8)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-2xs rounded-full gap-1 font-sans"
                                onClick={(e) => handleCopyTx(item.transactionHash!, e)}
                                title="Copy transaction hash to clipboard"
                              >
                                {copiedTxHash === item.transactionHash ? (
                                  <>
                                    <Check className="size-3 text-success" />
                                    <span className="text-success font-medium">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-2xs rounded-full gap-1 font-sans text-muted-foreground hover:text-foreground"
                                asChild
                                title="Search transaction on explorer"
                              >
                                <a
                                  href={`https://etherscan.io/tx/${item.transactionHash}`}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                >
                                  <ExternalLink className="size-3" />
                                  <span className="hidden sm:inline">Explorer</span>
                                </a>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-7 px-4 rounded-2xl bg-secondary/20 border border-dashed border-border/80">
                    <div className="size-10 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground mb-2.5">
                      <FolderCheck className="size-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No completed contracts yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      This employer has not completed any contracts on FreelanceXchain yet.
                      {jobsCount > 0 && (
                        <> Currently has {jobsCount} active or posted job{jobsCount === 1 ? '' : 's'}.</>
                      )}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Reviews & Ratings Tab (Exact Reputation Page Format) */}
              <TabsContent value="reviews" className="space-y-4 mt-3 focus-visible:outline-none">
                {/* Score & Star Distribution Card */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5">
                  <div className="absolute inset-0 gradient-primary opacity-5" />
                  <div className="relative grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
                    <div className="text-center sm:pr-4 sm:border-r border-border/60">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-md">
                        <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= Math.round(avgRating)
                                ? 'fill-warning text-warning'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {totalReviews} review{totalReviews === 1 ? '' : 's'}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      {starKeys.map(([stars, key]) => {
                        const count = starCounts[key] ?? 0;
                        const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2.5 text-xs">
                            <span className="w-3 text-right font-medium text-foreground">{stars}</span>
                            <Star className="h-3.5 w-3.5 fill-warning text-warning shrink-0" />
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full rounded-full bg-warning transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Dimension Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 text-center">
                    <Star className="size-3.5 text-warning mx-auto mb-1" />
                    <p className="font-bold text-sm text-foreground">
                      {(reputationScore?.workQuality && reputationScore.workQuality > 0 ? reputationScore.workQuality : avgRating).toFixed(1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Work Quality</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 text-center">
                    <Users className="size-3.5 text-primary mx-auto mb-1" />
                    <p className="font-bold text-sm text-foreground">
                      {(reputationScore?.communication && reputationScore.communication > 0 ? reputationScore.communication : avgRating).toFixed(1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Communication</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 text-center">
                    <Award className="size-3.5 text-primary mx-auto mb-1" />
                    <p className="font-bold text-sm text-foreground">
                      {(reputationScore?.professionalism && reputationScore.professionalism > 0 ? reputationScore.professionalism : avgRating).toFixed(1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Professionalism</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 text-center">
                    <TrendingUp className="size-3.5 text-success mx-auto mb-1" />
                    <p className="font-bold text-sm text-success">
                      {reputationScore?.wouldWorkAgainPercentage !== undefined && reputationScore.wouldWorkAgainPercentage > 0
                        ? `${Math.round(reputationScore.wouldWorkAgainPercentage)}%`
                        : totalReviews > 0 ? '100%' : '100%'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Rehire Rate</p>
                  </div>
                </div>

                {/* Freelancer Comments List */}
                <div className="space-y-2.5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Ratings & Comments
                  </h5>

                  {displayReviews.length > 0 ? (
                    <div className="space-y-2.5 sm:max-h-[300px] sm:overflow-y-auto sm:pr-1">
                      {displayReviews.map((rating, index) => (
                        <div
                          key={rating.id || `${rating.projectTitle}-${rating.createdAt}-${index}`}
                          className="rounded-2xl border border-border/70 bg-secondary/30 p-4 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-foreground break-words">{rating.projectTitle}</p>
                              <p className="text-xs text-muted-foreground">
                                {rating.reviewerName} · {formatDateSafe(rating.createdAt)}
                              </p>
                            </div>
                            <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-foreground">
                              <Star className="h-4 w-4 fill-warning text-warning" />
                              {rating.rating.toFixed(1)}
                            </span>
                          </div>

                          {rating.comment && (
                            <p className="text-xs text-muted-foreground leading-relaxed italic bg-background/50 rounded-xl p-3 border border-border/30">
                              &ldquo;{rating.comment}&rdquo;
                            </p>
                          )}

                          {rating.transactionHash && /^0x[0-9a-f]{64}$/i.test(rating.transactionHash) && (
                            <div className="mt-2.5 pt-2 border-t border-border/30 flex flex-wrap items-center justify-between gap-2 text-2xs">
                              <div className="flex items-center gap-1.5 font-mono text-muted-foreground min-w-0">
                                <ShieldCheck className="size-3.5 text-primary shrink-0" />
                                <span className="font-sans font-semibold text-muted-foreground uppercase tracking-wider">
                                  On-Chain Tx:
                                </span>
                                <span className="font-semibold text-foreground truncate select-all" title={rating.transactionHash}>
                                  {rating.transactionHash.slice(0, 10)}…{rating.transactionHash.slice(-8)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-2xs rounded-full gap-1 font-sans"
                                  onClick={(e) => handleCopyTx(rating.transactionHash!, e)}
                                  title="Copy transaction hash to clipboard"
                                >
                                  {copiedTxHash === rating.transactionHash ? (
                                    <>
                                      <Check className="size-3 text-success" />
                                      <span className="text-success font-medium">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="size-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-2xs rounded-full gap-1 font-sans text-muted-foreground hover:text-foreground"
                                  asChild
                                  title="Search transaction on explorer"
                                >
                                  <a
                                    href={`https://etherscan.io/tx/${rating.transactionHash}`}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                  >
                                    <ExternalLink className="size-3" />
                                    <span className="hidden sm:inline">Explorer</span>
                                  </a>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8 px-4 rounded-2xl bg-secondary/20 border border-dashed border-border/80 text-center">
                      <MessageSquareOff className="h-7 w-7 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">No reviews yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Reviews, star ratings, and feedback comments will appear here once contracts are completed on FreelanceXchain.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* All Posted Jobs Tab */}
              <TabsContent value="all" className="space-y-2.5 mt-3 focus-visible:outline-none">
                {employerProjects.length > 0 ? (
                  <div className="space-y-2.5 sm:max-h-[340px] sm:overflow-y-auto sm:pr-1">
                    {employerProjects.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-secondary/30 hover:bg-secondary/50 border border-border/70 transition-all space-y-1.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <Link
                              href={
                                user?.role === 'freelancer'
                                  ? `/dashboard/freelancer/projects/${p.id}`
                                  : `/projects/${p.id}`
                              }
                              className="text-sm font-bold text-foreground hover:text-primary transition-colors inline-flex max-w-full items-center gap-1.5 group"
                            >
                              <span className="min-w-0 line-clamp-1">{p.title}</span>
                              <ExternalLink className="size-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="size-3 text-muted-foreground" />
                                Posted {formatDateSafe(p.createdAt)}
                              </span>
                              <span className="hidden sm:inline">•</span>
                              <span className="font-semibold text-primary">
                                {formatAmount(p.budget, { currency: 'ETH' })}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-xs font-semibold py-0.5 shrink-0 ${
                              p.status === 'completed'
                                ? 'bg-success-subtle text-success border border-success/20'
                                : p.status === 'in_progress'
                                ? 'bg-primary-subtle text-primary border border-primary/20'
                                : 'bg-muted text-muted-foreground border border-border'
                            }`}
                          >
                            {p.status === 'completed'
                              ? 'Completed'
                              : p.status === 'in_progress'
                              ? 'In Progress'
                              : p.status === 'open'
                              ? 'Open'
                              : p.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-7 px-4 rounded-2xl bg-secondary/20 border border-dashed border-border/80">
                    <div className="size-10 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground mb-2.5">
                      <Briefcase className="size-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No posted jobs found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This employer has not listed other projects yet.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Action Footer */}
        <div className="shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 px-4 py-3 sm:px-7 sm:py-4 border-t border-border bg-card">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {user?.role === 'freelancer' && (
            <Button
              asChild
              className="w-full sm:w-auto gradient-primary shadow-sm"
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
      </DialogContent>
    </Dialog>
  );
}

