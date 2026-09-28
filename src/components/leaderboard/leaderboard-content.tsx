'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, BriefcaseBusiness, Crown, Star, Trophy, UserRound } from 'lucide-react';

import { ListSkeleton } from '@/components/dashboard/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { reputationApi } from '@/lib/api/features';
import {
  getLeaderboardProfileRoute,
  sortLeaderboard,
  type LeaderboardRole,
  type LeaderboardSort,
} from '@/lib/leaderboard-view';
import type { ReputationLeaderboardEntry } from '@/types';

const roleOptions: Array<{ role: LeaderboardRole; label: string; icon: typeof UserRound }> = [
  { role: 'freelancer', label: 'Freelancers', icon: UserRound },
  { role: 'employer', label: 'Employers', icon: BriefcaseBusiness },
];

function PodiumCard({ entry, place }: { entry: ReputationLeaderboardEntry; place: 1 | 2 | 3 }) {
  const featured = place === 1;
  return (
    <Link
      href={getLeaderboardProfileRoute(entry.role, entry.userId)}
      className={`relative flex flex-col justify-between rounded-3xl bg-card p-6 text-center shadow-md transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        featured ? 'order-1 border-2 border-primary/40 md:order-2 md:scale-105' : place === 2 ? 'order-2 border border-border/80 md:order-1' : 'order-3 border border-border/80'
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-warning px-3 py-0.5 text-2xs font-bold text-warning-foreground shadow-md">
          <Crown className="size-3" aria-hidden="true" /> Top ranked
        </span>
      )}
      <div>
        <div className={`mx-auto mb-3 flex items-center justify-center rounded-full font-extrabold ${featured ? 'size-12 bg-warning-subtle text-lg text-warning' : 'size-10 bg-neutral-subtle text-sm text-neutral'}`}>
          #{place}
        </div>
        <h3 className="truncate px-2 text-base font-bold text-foreground">{entry.userName}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {entry.totalRatings} verified platform review{entry.totalRatings === 1 ? '' : 's'}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-center gap-1 border-t border-border/50 pt-4 text-sm font-bold text-foreground">
        <Star className="size-4 fill-warning text-warning" aria-hidden="true" />
        <span>{entry.averageRating.toFixed(1)} average</span>
      </div>
    </Link>
  );
}

export function LeaderboardContent() {
  const [leaderboard, setLeaderboard] = useState<ReputationLeaderboardEntry[]>([]);
  const [role, setRole] = useState<LeaderboardRole>('freelancer');
  const [sortBy, setSortBy] = useState<LeaderboardSort>('overall');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let active = true;

    reputationApi
      .getLeaderboard({ limit: 50, role })
      .then(({ data }) => {
        if (active) setLeaderboard(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) {
          setLeaderboard([]);
          setFailed(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [role, requestVersion]);

  const sortedLeaderboard = useMemo(
    () => sortLeaderboard(leaderboard, sortBy),
    [leaderboard, sortBy],
  );
  const roleLabel = role === 'freelancer' ? 'freelancers' : 'employers';

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="inline-flex rounded-xl border border-border bg-card p-1" aria-label="Leaderboard role">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const active = role === option.role;
            return (
              <button
                key={option.role}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (option.role === role) return;
                  setLoading(true);
                  setFailed(false);
                  setRole(option.role);
                }}
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon className="size-4" aria-hidden="true" /> {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs font-semibold text-muted-foreground">Sort by:</span>
          {([['overall', 'Best overall'], ['reviews', 'Most reviews']] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={sortBy === key}
              onClick={() => setSortBy(key)}
              className={`min-h-11 rounded-full px-4 text-xs font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${sortBy === key ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border/80 bg-card text-muted-foreground hover:text-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={8} label={`Loading ${roleLabel} leaderboard`} />
      ) : failed ? (
        <EmptyState
          icon={Trophy}
          title="Could not load the leaderboard"
          description="The rankings are temporarily unavailable. Try again in a moment."
          action={<Button variant="outline" onClick={() => {
            setLoading(true);
            setFailed(false);
            setRequestVersion((value) => value + 1);
          }}>Try again</Button>}
        />
      ) : (
        <>
          {sortedLeaderboard.length >= 3 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <PodiumCard entry={sortedLeaderboard[1]} place={2} />
              <PodiumCard entry={sortedLeaderboard[0]} place={1} />
              <PodiumCard entry={sortedLeaderboard[2]} place={3} />
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-md shadow-black/5 sm:p-8 lg:col-span-2" aria-labelledby="complete-rankings">
              <h2 id="complete-rankings" className="mb-4 text-lg font-bold text-foreground">
                {role === 'freelancer' ? 'Freelancer' : 'Employer'} rankings
              </h2>
              {sortedLeaderboard.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="No rankings available yet"
                  description={`Rankings appear after ${roleLabel} receive at least three verified platform reviews.`}
                />
              ) : (
                <ol className="space-y-2.5">
                  {sortedLeaderboard.map((entry, index) => (
                    <li key={entry.userId}>
                      <Link
                        href={getLeaderboardProfileRoute(entry.role, entry.userId)}
                        className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background p-4 outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex min-w-0 items-center gap-3.5">
                          <span className="w-7 text-center text-xs font-bold text-muted-foreground">#{index + 1}</span>
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">{index + 1}</div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">{entry.userName}</p>
                            <p className="text-2xs text-muted-foreground">{entry.totalRatings} verified platform reviews</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 text-sm font-bold text-foreground">
                          <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
                          <span>{entry.averageRating.toFixed(1)}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-bold text-foreground">How ranking works</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Rankings use verified reviews from completed contracts. A confidence adjustment rewards consistently strong feedback and prevents a few early ratings from dominating the list.
                </p>
              </div>
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <h3 className="mb-2 text-sm font-bold text-foreground">Platform records</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Ratings are recorded by FreelanceXchain after completed work. Individual profiles show when a rating also includes a confirmed blockchain transaction reference.
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
