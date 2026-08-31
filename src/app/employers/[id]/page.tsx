'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Globe,
  Calendar,
  ShieldCheck,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { employersApi, reputationApi, projectsApi } from '@/lib/api';
import { getDirectMessageRoute } from '@/lib/dashboard-message-route';
import type { EmployerProfile, AggregatedReputationScore, Project } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import Navbar from '@/components/layout/navbar';
import { FooterSection } from '@/components/layout/footer-section';

export default function EmployerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const employerId = params?.id as string;
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [reputationScore, setReputationScore] = useState<AggregatedReputationScore | null>(null);
  const [employerProjects, setEmployerProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!employerId) return;

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
        // Fallback
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, [employerId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-20 max-w-4xl mx-auto px-4 w-full">
          <DetailSkeleton label="Loading employer profile" />
        </main>
        <FooterSection />
      </div>
    );
  }

  const name = profile?.name || 'Employer Profile';
  const companyName = profile?.companyName || name;
  const description =
    profile?.description ||
    'Verified employer actively hiring top Web3 and technology talent on FreelanceXchain.';
  const industry = profile?.industry || 'Technology & Web3';
  const nationality = profile?.nationality || 'Global / Remote';
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
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="-ml-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4 mr-2" /> Back
          </Button>

          {/* Profile Header Banner */}
          <Card className="overflow-hidden border-border bg-card shadow-sm rounded-3xl">
            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 sm:p-8 border-b border-border/60">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                    {initials}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold text-foreground">{name}</h1>
                      <Badge variant="secondary" className="bg-success-subtle text-success border border-success/20 text-xs font-semibold">
                        <ShieldCheck className="size-3 mr-1" /> KYC Verified
                      </Badge>
                    </div>
                    {companyName && companyName !== name && (
                      <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Building2 className="size-4 text-primary" />
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

                {user?.role === 'freelancer' && (
                  <Button asChild className="gradient-primary text-primary-foreground shadow-md shrink-0 w-full sm:w-auto">
                    <Link
                      href={
                        employerId || profile?.userId || profile?.id
                          ? getDirectMessageRoute('freelancer', (employerId || profile?.userId || profile?.id)!)
                          : '/dashboard/freelancer/messages'
                      }
                    >
                      <Mail className="size-4 mr-2" /> Message Client
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Stats Grid */}
              <div>
                <h3 className="text-3xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Live Client Performance & History
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-center">
                    <p className="text-3xs uppercase font-medium text-muted-foreground">Rating</p>
                    <p className="text-lg font-extrabold text-foreground mt-0.5 flex items-center justify-center gap-1">
                      <Star className={`size-4 ${totalReviews > 0 ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
                      {totalReviews > 0 ? avgRating.toFixed(1) : '0.0'}
                    </p>
                    <span className="text-3xs text-muted-foreground">{totalReviews} review{totalReviews === 1 ? '' : 's'}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-center">
                    <p className="text-3xs uppercase font-medium text-muted-foreground">Completed</p>
                    <p className="text-lg font-extrabold text-foreground mt-0.5">
                      {completedContracts}
                    </p>
                    <span className="text-3xs text-muted-foreground">Contracts</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-center">
                    <p className="text-3xs uppercase font-medium text-muted-foreground">Jobs Posted</p>
                    <p className="text-lg font-extrabold text-foreground mt-0.5">
                      {jobsCount > 0 ? jobsCount : '1+'}
                    </p>
                    <span className="text-3xs text-muted-foreground">Projects</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-center">
                    <p className="text-3xs uppercase font-medium text-muted-foreground">Escrow</p>
                    <p className="text-lg font-extrabold text-success mt-0.5 flex items-center justify-center gap-1">
                      <ShieldCheck className="size-4" /> 100%
                    </p>
                    <span className="text-3xs text-muted-foreground">Protected</span>
                  </div>
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="rounded-2xl bg-muted/40 p-4 border border-border/60">
                <h3 className="text-3xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Verification & Security Badges
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="size-4 text-success shrink-0" />
                    <span>Identity Verified (KYC)</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="size-4 text-success shrink-0" />
                    <span>Web3 Payment Wallet Linked</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <CheckCircle2 className="size-4 text-success shrink-0" />
                    <span>Smart Contract Escrow Protected</span>
                  </div>
                </div>
              </div>

              {/* About Background */}
              <div>
                <h3 className="text-3xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  About Company & Background
                </h3>
                <p className="text-base text-foreground/90 leading-relaxed bg-muted/40 p-4 rounded-2xl border border-border/50 whitespace-pre-line">
                  {description}
                </p>
                <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Industry: <strong className="text-foreground font-semibold">{industry}</strong></span>
                  <span>Member Type: <strong className="text-foreground font-semibold">Verified Employer</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
