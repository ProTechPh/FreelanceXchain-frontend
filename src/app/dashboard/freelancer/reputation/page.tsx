'use client';

import { useEffect, useState } from 'react';
import { Award, BriefcaseBusiness, History, Loader2, MessageSquareOff, ShieldCheck, Star, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reputationApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { AggregatedReputationScore, ReputationBreakdown, ReputationHistoryEntry, ReputationLeaderboardEntry, ReputationMetadata, ReputationWorkHistoryEntry } from '@/types';

const starKeys = [
  [5, 'fiveStars'],
  [4, 'fourStars'],
  [3, 'threeStars'],
  [2, 'twoStars'],
  [1, 'oneStar'],
] as const;

export function ReputationOverview() {
  const userId = useAuthStore((state) => state.user?.id);
  const [score, setScore] = useState<AggregatedReputationScore | null>(null);
  const [breakdown, setBreakdown] = useState<ReputationBreakdown | null>(null);
  const [history, setHistory] = useState<ReputationHistoryEntry[]>([]);
  const [workHistory, setWorkHistory] = useState<ReputationWorkHistoryEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<ReputationLeaderboardEntry[]>([]);
  const [metadata, setMetadata] = useState<ReputationMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const load = async () => {
      const results = await Promise.allSettled([
        reputationApi.getScore(userId),
        reputationApi.getBreakdown(userId),
        reputationApi.getHistory(userId),
        reputationApi.getWorkHistory(userId),
        reputationApi.getLeaderboard({ limit: 5 }),
        reputationApi.getMetadata(userId),
      ]);
      if (!active) return;
      if (results[0].status === 'fulfilled') setScore(results[0].value.data);
      if (results[1].status === 'fulfilled') setBreakdown(results[1].value.data);
      if (results[2].status === 'fulfilled') setHistory(results[2].value.data);
      if (results[3].status === 'fulfilled') setWorkHistory(results[3].value.data);
      if (results[4].status === 'fulfilled') setLeaderboard(results[4].value.data);
      if (results[5].status === 'fulfilled') setMetadata(results[5].value.data);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [userId]);

  if (loading) return <div className="flex h-64 items-center justify-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const overall = score?.averageRating ?? 0;
  const totalRatings = score?.totalRatings ?? 0;
  const syncedRatings = metadata?.ratings.filter((rating) => /^0x[0-9a-f]{64}$/i.test(rating.transactionHash)).length ?? 0;
  const dimensions = [
    { label: 'Work quality', value: (score?.workQuality ?? 0).toFixed(1), icon: Star },
    { label: 'Communication', value: (score?.communication ?? 0).toFixed(1), icon: Users },
    { label: 'Professionalism', value: (score?.professionalism ?? 0).toFixed(1), icon: Award },
    { label: 'Would work again', value: `${score?.wouldWorkAgainPercentage ?? 0}%`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Reputation</h1><p className="text-muted-foreground">Backend-verified ratings, delivery signals, and completed work.</p></div>

      <Card className="relative overflow-hidden border-border bg-card"><div className="absolute inset-0 gradient-primary opacity-5" /><CardContent className="relative grid gap-8 p-6 md:grid-cols-[auto_1fr] md:items-center"><div className="text-center"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full gradient-primary"><span className="text-3xl font-bold text-white">{overall.toFixed(1)}</span></div><div className="mt-2 flex items-center justify-center gap-1">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-4 w-4 ${star <= Math.round(overall) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-500'}`} />)}</div><p className="mt-1 text-sm text-muted-foreground">{totalRatings} review{totalRatings === 1 ? '' : 's'}</p></div><div className="space-y-2">{starKeys.map(([stars, key]) => { const count = breakdown?.[key] ?? 0; return <div key={stars} className="flex items-center gap-3"><span className="w-4 text-sm">{stars}</span><Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /><div className="h-2 flex-1 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-yellow-500" style={{ width: totalRatings > 0 ? `${(count / totalRatings) * 100}%` : '0%' }} /></div><span className="w-8 text-sm text-muted-foreground">{count}</span></div>; })}</div></CardContent></Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dimensions.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Rating history</CardTitle></CardHeader><CardContent>{history.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No rating history yet.</p> : <ul className="space-y-3">{history.map((entry) => <li key={entry.month} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 text-sm"><span>{new Date(`${entry.month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })}</span><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${(entry.averageRating / 5) * 100}%` }} /></div><span>{entry.averageRating.toFixed(1)} ({entry.count})</span></li>)}</ul>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Delivery record</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4"><div className="rounded-lg border border-border p-4"><BriefcaseBusiness className="mb-3 h-5 w-5 text-primary" /><p className="text-2xl font-bold">{score?.completedContracts ?? 0}</p><p className="text-xs text-muted-foreground">Completed contracts</p></div><div className="rounded-lg border border-border p-4"><TrendingUp className="mb-3 h-5 w-5 text-green-500" /><p className="text-2xl font-bold">{score?.onTimeDeliveryRate ?? 0}%</p><p className="text-xs text-muted-foreground">On-time delivery</p></div><div className="col-span-2 flex items-center gap-2 rounded-lg bg-secondary/40 p-3 text-sm text-muted-foreground"><ShieldCheck className="h-5 w-5 text-primary" />{syncedRatings > 0 ? `${syncedRatings} rating${syncedRatings === 1 ? '' : 's'} include a valid blockchain transaction reference.` : 'No blockchain transaction references are available for these ratings.'}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Recent rating details</CardTitle></CardHeader><CardContent>{!breakdown || breakdown.recentRatings.length === 0 ? <div className="flex flex-col items-center gap-2 py-10 text-center"><MessageSquareOff className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">No reviews yet.</p></div> : <ul className="space-y-4">{breakdown.recentRatings.map((rating, index) => <li key={`${rating.projectTitle}-${rating.createdAt}-${index}`} className="rounded-lg border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{rating.projectTitle}</p><p className="text-xs text-muted-foreground">{rating.reviewerName} · {new Date(rating.createdAt).toLocaleDateString()}</p></div><span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />{rating.rating}</span></div>{rating.comment && <p className="mt-3 text-sm text-muted-foreground">{rating.comment}</p>}</li>)}</ul>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Completed work</CardTitle></CardHeader><CardContent>{workHistory.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No completed contracts yet.</p> : <ul className="space-y-3">{workHistory.map((item) => <li key={item.contractId} className="rounded-lg border border-border p-3"><div className="flex justify-between gap-3"><div><p className="font-medium">{item.projectTitle}</p><p className="text-xs text-muted-foreground">As {item.role} · {new Date(item.completedAt).toLocaleDateString()}</p></div>{item.rating && <span className="text-sm">{item.rating} / 5</span>}</div>{item.ratingComment && <p className="mt-2 text-sm text-muted-foreground">{item.ratingComment}</p>}</li>)}</ul>}</CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Community leaderboard</CardTitle></CardHeader><CardContent>{leaderboard.length === 0 ? <p className="text-sm text-muted-foreground">No users have enough ratings to rank yet.</p> : <ol className="grid gap-3 md:grid-cols-2">{leaderboard.map((entry, index) => <li key={entry.userId} className="flex items-center gap-3 rounded-lg border border-border p-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate font-medium">{entry.userName}</p><p className="text-xs text-muted-foreground">{entry.totalRatings} ratings</p></div><span className="font-semibold">{entry.averageRating.toFixed(1)}</span></li>)}</ol>}</CardContent></Card>
    </div>
  );
}

export default function FreelancerReputationPage() {
  return <ReputationOverview />;
}
