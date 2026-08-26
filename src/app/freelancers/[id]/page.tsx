'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { freelancersApi } from '@/lib/api';
import { FavoriteButton } from '@/components/marketplace/favorite-button';
import { useAuthStore } from '@/stores/authStore';
import type { FreelancerProfile } from '@/types';
import { getMarketplaceReturnPath } from '@/lib/marketplace-return';
import { toast } from 'sonner';
import { MapPin, ShieldCheck, Send, ArrowLeft, DollarSign, CircleCheck, Clock, CircleMinus } from 'lucide-react';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import Navbar from '@/components/layout/navbar';
import { FooterSection } from '@/components/layout/footer-section';

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
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchFreelancer = async () => {
      try {
        const res = await freelancersApi.getPublicProfile(params?.id as string);
        setFreelancer(res.data);
      } catch {
        toast.error('Failed to load freelancer profile');
      } finally {
        setLoading(false);
      }
    };
    if (params?.id) {
      fetchFreelancer();
    }
  }, [params?.id]);

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

  if (!freelancer) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-20 flex items-center justify-center">
          <div className="text-center rounded-3xl bg-card border border-border/80 p-12 shadow-md shadow-black/5 max-w-md mx-auto">
            <p className="text-3xl mb-4">👤</p>
            <h2 className="text-2xl font-bold text-foreground mb-2">Freelancer not found</h2>
            <p className="text-muted-foreground mb-6">This profile doesn&apos;t exist or has been removed.</p>
            <Link href="/freelancers">
              <Button className="rounded-full gradient-primary text-primary-foreground shadow-md">
                Browse Freelancers
              </Button>
            </Link>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  const initials = (freelancer.name ?? 'U').split(' ').map(n => n[0]).join('');
  const marketplaceBackPath = getMarketplaceReturnPath(searchParams?.get('returnTo') ?? null, '/freelancers');
  const availability = availabilityConfig[freelancer.availability] || availabilityConfig.available;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-28 pb-20">
        {/* Hero Header */}
        <div className="relative border-b border-border/80 bg-card/50 backdrop-blur-xl">
          <div className="absolute inset-0 gradient-primary opacity-5" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {/* Back Button */}
            <Link 
              href={marketplaceBackPath}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to freelancers
            </Link>

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
                    <span className="font-bold text-primary">${freelancer.hourlyRate}/hr</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
                <FavoriteButton targetType="freelancer" targetId={freelancer.userId} />
                {user?.role === 'employer' && (
                  <Button asChild className="rounded-full gradient-primary text-primary-foreground shadow-md">
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
                    <span className="text-sm text-muted-foreground">Hourly Rate</span>
                    <span className="font-bold text-primary">${freelancer.hourlyRate}/hr</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Availability</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${availability.colors}`}>
                      {availability.icon}
                      {availability.label}
                    </span>
                  </div>
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
                  <Button asChild className="w-full rounded-full gradient-primary text-primary-foreground shadow-md">
                    <Link href={`/dashboard/employer/messages?recipientId=${freelancer.userId}`}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
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
