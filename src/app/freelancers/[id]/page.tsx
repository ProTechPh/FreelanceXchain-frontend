'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { freelancersApi, reputationApi } from '@/lib/api';
import { FavoriteButton } from '@/components/marketplace/favorite-button';
import { useAuthStore } from '@/stores/authStore';
import type {
  FreelancerProfile,
  AggregatedReputationScore,
  ReputationBreakdown,
  ReputationWorkHistoryEntry,
} from '@/types';
import { getMarketplaceReturnPath } from '@/lib/marketplace-return';
import { reportFailure } from '@/lib/report-failure';
import { formatAmount } from '@/lib/format';
import { getApiErrorMessage } from '@/lib/auth-contract';
import {
  MapPin,
  ShieldCheck,
  Send,
  ArrowLeft,
  DollarSign,
  CircleCheck,
  Clock,
  CircleMinus,
  Star,
  BriefcaseBusiness,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import Navbar from '@/components/layout/navbar';
import { FooterSection } from '@/components/layout/footer-section';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const availabilityConfig: Record<string, { colors: string; icon: React.ReactNode; label: string }> = {
  available: {
    colors: 'bg-success/10 text-success border border-success/20',
    icon: <CircleCheck className="w-4 h-4" />,
    label: 'Available',
  },
  busy: {
    colors: 'bg-warning/10 text-warning border border-warning/20',
    icon: <Clock className="w-4 h-4" />,
    label: 'Busy',
  },
  unavailable: {
    colors: 'bg-neutral/10 text-neutral border border-neutral/20',
    icon: <CircleMinus className="w-4 h-4" />,
    label: 'Unavailable',
  },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Present';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function FreelancerProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
  const [reputationScore, setReputationScore] = useState<AggregatedReputationScore | null>(null);
  const [reputationBreakdown, setReputationBreakdown] = useState<ReputationBreakdown | null>(null);
  const [workHistory, setWorkHistory] = useState<ReputationWorkHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    let active = true;
    const fetchFreelancer = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const id = params?.id as string;
        const res = await freelancersApi.getPublicProfile(id);
        if (!active) return;
        setFreelancer(res.data);

        const targetUserId = res.data?.userId || id;
        const [scoreRes, breakdownRes, historyRes] = await Promise.allSettled([
          reputationApi.getScore(targetUserId),
          reputationApi.getBreakdown(targetUserId),
          reputationApi.getWorkHistory(targetUserId),
        ]);

        if (!active) return;
        if (scoreRes.status === 'fulfilled' && scoreRes.value?.data) {
          setReputationScore(scoreRes.value.data);
        }
        if (breakdownRes.status === 'fulfilled' && breakdownRes.value?.data) {
          setReputationBreakdown(breakdownRes.value.data);
        }
        if (historyRes.status === 'fulfilled' && historyRes.value?.data) {
          setWorkHistory(historyRes.value.data);
        }
      } catch (error: unknown) {
        if (!active) return;
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status !== 404) {
          setFetchError(getApiErrorMessage(error, 'Unable to load profile. Please check your connection.'));
        }
        reportFailure(error, 'load this profile');
      } finally {
        if (active) setLoading(false);
      }
    };
    if (params?.id) {
      void fetchFreelancer();
    }
    return () => {
      active = false;
    };
  }, [params?.id, retryCount]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-20">
          <DetailSkeleton label="Loading profile" />
        </main>
        <FooterSection />
      </div>
    );
  }

  if (fetchError && !freelancer) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-20 flex items-center justify-center">
          <div className="text-center rounded-3xl bg-card border border-border/80 p-8 sm:p-12 shadow-md shadow-black/5 max-w-md mx-auto space-y-4">
            <p className="text-3xl">⚠️</p>
            <h2 className="text-xl font-bold text-foreground">Failed to load profile</h2>
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <div className="flex flex-col gap-2 pt-2">
              <Button className="rounded-full gradient-primary" onClick={() => setRetryCount((c) => c + 1)}>
                Try Again
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/freelancers">Browse Freelancers</Link>
              </Button>
            </div>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-20 flex items-center justify-center">
          <div className="text-center rounded-3xl bg-card border border-border/80 p-12 shadow-md shadow-black/5 max-w-md mx-auto">
            <p className="text-3xl mb-4">👤</p>
            <h2 className="text-2xl font-bold text-foreground mb-2">Freelancer not found</h2>
            <p className="text-muted-foreground mb-6">This profile doesn&apos;t exist or has been removed.</p>
            <Button asChild className="rounded-full gradient-primary shadow-md">
              <Link href="/freelancers">
                Browse Freelancers
              </Link>
            </Button>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  const initials = (freelancer.name ?? 'U').split(' ').map(n => n[0]).join('');
  const marketplaceBackPath = getMarketplaceReturnPath(searchParams?.get('returnTo') ?? null, '/freelancers');
  const availability = availabilityConfig[freelancer.availability] || availabilityConfig.available;
  const totalReviews = reputationScore?.totalRatings ?? 0;
  const avgRating = reputationScore?.averageRating ?? 0;
  const completedContractsCount = reputationScore?.completedContracts ?? workHistory.length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-28 pb-20">
        {/* Hero Header */}
        <div className="relative border-b border-border/80 bg-card/50 backdrop-blur-xl">
          <div className="absolute inset-0 gradient-primary opacity-5" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {/* Breadcrumbs & Back Navigation */}
            <div className="space-y-3 mb-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/freelancers">Freelancers</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{freelancer.name || 'Freelancer'}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <Link 
                href={marketplaceBackPath}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to freelancers
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                {initials}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {freelancer.name || 'Verified Freelancer'}
                  </h1>
                  <ShieldCheck className="w-5 h-5 text-success shrink-0" />
                  {totalReviews > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-warning/15 text-warning border border-warning/30">
                      <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                      {avgRating.toFixed(1)}
                      <span className="font-normal text-muted-foreground">({totalReviews} review{totalReviews === 1 ? '' : 's'})</span>
                    </span>
                  )}
                </div>
                
                <p className="text-base text-muted-foreground leading-relaxed mb-5 max-w-2xl">
                  {freelancer.bio || 'No bio provided'}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${availability.colors}`}>
                    {availability.icon}
                    {availability.label}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {freelancer.nationality || 'Remote'}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-bold text-primary">{formatAmount(freelancer.hourlyRate)}/hr</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
                <FavoriteButton targetType="freelancer" targetId={freelancer.userId} />
                {user?.role === 'employer' && (
                  <Button asChild className="rounded-full gradient-primary shadow-md">
                    <Link href={`/dashboard/employer/messages?recipientId=${freelancer.userId}`}>
                      <Send className="w-4 h-4 mr-2" />
                      Contact
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5">
                <h2 className="text-lg font-bold text-foreground mb-4">About Me</h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {freelancer.bio || 'No bio provided'}
                </p>
              </div>

              {/* Skills */}
              <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5">
                <h2 className="text-lg font-bold text-foreground mb-4">Skills & Expertise</h2>
                <div className="flex flex-wrap gap-2">
                  {freelancer.skills?.map((skill) => (
                    <span
                      key={skill.name}
                      className="px-3 py-1.5 rounded-full bg-background border border-border/80 text-sm font-medium text-foreground/80 hover:border-primary/50 transition-colors"
                    >
                      {skill.name}
                    </span>
                  ))}
                  {(!freelancer.skills || freelancer.skills.length === 0) && (
                    <p className="text-sm text-muted-foreground">No skills listed</p>
                  )}
                </div>
              </div>

              {/* Accomplished Projects (Work History on Platform) */}
              <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <BriefcaseBusiness className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-foreground">Accomplished Projects</h2>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {completedContractsCount} completed
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-5">
                  Verified projects completed and settled through FreelanceXchain smart contract escrow.
                </p>

                {workHistory.length > 0 ? (
                  <div className="space-y-4">
                    {workHistory.map((item) => (
                      <div
                        key={item.contractId}
                        className="p-5 rounded-2xl bg-background/60 border border-border/60 hover:border-primary/40 transition-colors space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="text-base font-bold text-foreground">{item.projectTitle}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1 text-success font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                              </span>
                              <span>•</span>
                              <span>{formatDate(item.completedAt)}</span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-primary">
                                <ShieldCheck className="w-3.5 h-3.5" /> Escrow Settled
                              </span>
                            </div>
                          </div>
                          {item.rating !== undefined && (
                            <div className="flex items-center gap-1 self-start sm:self-center px-2.5 py-1 rounded-full bg-warning/10 border border-warning/20 text-warning text-xs font-bold">
                              <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                              <span>{item.rating}.0 / 5.0</span>
                            </div>
                          )}
                        </div>
                        {item.ratingComment && (
                          <div className="p-3 rounded-xl bg-card border border-border/40 text-sm text-foreground/90 italic">
                            &ldquo;{item.ratingComment}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-background/40 border border-dashed border-border text-center">
                    <BriefcaseBusiness className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-foreground">No platform contracts completed yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed contracts and on-chain verified deliveries will appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* Client Reviews & Ratings */}
              <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <Star className="w-5 h-5 text-warning fill-warning" />
                    <h2 className="text-lg font-bold text-foreground">Client Reviews & Reputation</h2>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-warning/10 text-warning border border-warning/20">
                    {totalReviews} review{totalReviews === 1 ? '' : 's'}
                  </span>
                </div>

                {totalReviews > 0 ? (
                  <div className="space-y-6">
                    {/* Overall Score & Dimensions */}
                    <div className="p-5 rounded-2xl bg-background/60 border border-border/60 grid sm:grid-cols-2 gap-6 items-center">
                      <div className="text-center sm:text-left flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl gradient-primary text-primary-foreground font-black text-3xl flex items-center justify-center shadow-md shrink-0">
                          {avgRating.toFixed(1)}
                        </div>
                        <div>
                          <div className="flex items-center justify-center sm:justify-start gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${
                                  s <= Math.round(avgRating) ? 'fill-warning text-warning' : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm font-semibold text-foreground mt-1.5">
                            Based on {totalReviews} verified client review{totalReviews === 1 ? '' : 's'}
                          </p>
                          {reputationScore?.wouldWorkAgainPercentage !== undefined && (
                            <p className="text-xs text-success flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                              <TrendingUp className="w-3.5 h-3.5" />
                              {reputationScore.wouldWorkAgainPercentage}% would hire again
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Breakdown bars */}
                      <div className="space-y-1.5 text-xs">
                        {[
                          { stars: 5, count: reputationBreakdown?.fiveStars ?? 0 },
                          { stars: 4, count: reputationBreakdown?.fourStars ?? 0 },
                          { stars: 3, count: reputationBreakdown?.threeStars ?? 0 },
                          { stars: 2, count: reputationBreakdown?.twoStars ?? 0 },
                          { stars: 1, count: reputationBreakdown?.oneStar ?? 0 },
                        ].map(({ stars, count }) => (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="w-4 text-right font-medium">{stars}</span>
                            <Star className="w-3.5 h-3.5 fill-warning text-warning shrink-0" />
                            <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full bg-warning rounded-full transition-all"
                                style={{ width: totalReviews > 0 ? `${(count / totalReviews) * 100}%` : '0%' }}
                              />
                            </div>
                            <span className="w-6 text-muted-foreground text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review Cards */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Recent Client Feedback
                      </h3>
                      {reputationBreakdown?.recentRatings && reputationBreakdown.recentRatings.length > 0 ? (
                        reputationBreakdown.recentRatings.map((rev, idx) => (
                          <div
                            key={`${rev.reviewerName}-${rev.projectTitle}-${idx}`}
                            className="p-5 rounded-2xl bg-background/40 border border-border/50 hover:border-border transition-colors space-y-2.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-foreground">{rev.reviewerName}</span>
                                  <span className="text-3xs px-2 py-0.5 rounded-full bg-secondary font-medium text-muted-foreground">
                                    Client
                                  </span>
                                </div>
                                <p className="text-xs text-primary font-medium mt-0.5">
                                  Project: {rev.projectTitle}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-center">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3.5 h-3.5 ${
                                        s <= rev.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(rev.createdAt)}
                                </span>
                              </div>
                            </div>
                            {rev.comment && (
                              <p className="text-sm text-foreground/90 leading-relaxed pt-1">
                                {rev.comment}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground py-4 text-center">No review comments yet.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-background/40 border border-dashed border-border text-center">
                    <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-foreground">No client reviews yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reviews and ratings will be posted here after completed contracts.
                    </p>
                  </div>
                )}
              </div>

              {/* Experience */}
              <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5">
                <h2 className="text-lg font-bold text-foreground mb-4">Work Experience</h2>
                <div className="space-y-4">
                  {freelancer.experience?.map((exp) => (
                    <div key={exp.id} className="p-5 rounded-2xl bg-background/50 border border-border/50 hover:border-border transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-foreground">{exp.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{exp.company}</p>
                          {exp.description && (
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!freelancer.experience || freelancer.experience.length === 0) && (
                    <p className="text-sm text-muted-foreground">No experience listed</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="rounded-3xl bg-card border border-border/80 p-6 shadow-md shadow-black/5">
                <h3 className="text-sm font-bold text-foreground mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Client Rating</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Star className={`w-4 h-4 ${totalReviews > 0 ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
                      {totalReviews > 0 ? `${avgRating.toFixed(1)} (${totalReviews})` : 'No reviews'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Accomplished</span>
                    <span className="font-bold text-foreground">
                      {completedContractsCount} {completedContractsCount === 1 ? 'project' : 'projects'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hourly Rate</span>
                    <span className="font-bold text-primary">{formatAmount(freelancer.hourlyRate)}/hr</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Availability</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${availability.colors}`}>
                      {availability.icon}
                      {availability.label}
                    </span>
                  </div>
                  {reputationScore?.wouldWorkAgainPercentage !== undefined && reputationScore.wouldWorkAgainPercentage > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rehire Rate</span>
                      <span className="font-bold text-success">
                        {reputationScore.wouldWorkAgainPercentage}%
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatDate(freelancer.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Skills */}
              <div className="rounded-3xl bg-card border border-border/80 p-6 shadow-md shadow-black/5">
                <h3 className="text-sm font-bold text-foreground mb-4">Top Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {freelancer.skills?.slice(0, 5).map((skill) => (
                    <span
                      key={skill.name}
                      className="px-2.5 py-1 rounded-full bg-background border border-border/80 text-xs font-medium text-foreground/80"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-3xl bg-card border border-border/80 p-6 shadow-md shadow-black/5">
                <h3 className="text-sm font-bold text-foreground mb-4">Quick Actions</h3>
                {user?.role === 'employer' ? (
                  <Button asChild className="w-full rounded-full gradient-primary shadow-md">
                    <Link href={`/dashboard/employer/messages?recipientId=${freelancer.userId}`}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Link>
                  </Button>
                ) : !user ? (
                  <Button asChild className="w-full rounded-full gradient-primary shadow-md">
                    <Link href={`/login?returnTo=${encodeURIComponent(`/freelancers/${params?.id}`)}`}>
                      <Send className="w-4 h-4 mr-2" />
                      Sign in to Contact
                    </Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Sign in as an employer to contact this freelancer.
                  </p>
                )}
              </div>

              {/* Trust Badge */}
              <div className="rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5 text-center">
                <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-bold text-foreground text-sm">Verified Freelancer</h4>
                <p className="text-xs text-muted-foreground mt-1">Identity verified through KYC</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
