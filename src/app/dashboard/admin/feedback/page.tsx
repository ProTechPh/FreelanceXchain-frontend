'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Search } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { appRatingsApi } from '@/lib/api';
import { reportLoadFailure } from '@/lib/report-failure';
import { formatDate } from '@/lib/format';
import { APP_RATING_SOURCE_LABELS } from '@/lib/app-rating-prompt';
import type { AdminAppRating, AppRatingSummary, UserRole } from '@/types';

const roleColors: Record<string, string> = {
  freelancer: 'bg-primary/10 text-primary',
  employer: 'bg-cyan/10 text-cyan',
  admin: 'bg-info-subtle text-info',
};

const STAR_FILTERS = [5, 4, 3, 2, 1] as const;

const EMPTY_SUMMARY: AppRatingSummary = {
  total: 0,
  average: 0,
  histogram: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
  bySource: [],
  recentTotal: 0,
  positivePercentage: 0,
};

function sourceLabel(source: string): string {
  return APP_RATING_SOURCE_LABELS[source as keyof typeof APP_RATING_SOURCE_LABELS] ?? source;
}

export default function AppFeedbackPage() {
  const [ratings, setRatings] = useState<AdminAppRating[]>([]);
  const [summary, setSummary] = useState<AppRatingSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [starFilter, setStarFilter] = useState<'all' | number>('all');

  const load = useCallback(async () => {
    const [listResponse, summaryResponse] = await Promise.all([
      appRatingsApi.adminList(),
      appRatingsApi.adminSummary(),
    ]);
    setRatings(listResponse.data.ratings);
    setSummary(summaryResponse.data);
  }, []);

  // Reported here rather than inside the loader so the toast's Retry can
  // call it again; a self-reference inside the callback is not allowed.
  useEffect(() => {
    let active = true;
    function run() {
      load()
        .catch((error) => {
          if (active) reportLoadFailure(error, 'app feedback', run);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    run();
    return () => {
      active = false;
    };
  }, [load]);

  if (loading) {
    return <ListSkeleton rows={6} label="Loading app feedback" />;
  }

  const query = search.trim().toLowerCase();
  const filtered = ratings.filter((rating) => {
    if (starFilter !== 'all' && rating.rating !== starFilter) return false;
    if (!query) return true;
    return (
      rating.userName.toLowerCase().includes(query) ||
      rating.userEmail.toLowerCase().includes(query) ||
      (rating.comment ?? '').toLowerCase().includes(query)
    );
  });

  // The histogram describes the platform, so it is deliberately drawn from the
  // unfiltered summary rather than from whatever the current filter leaves.
  const histogramMax = Math.max(1, ...STAR_FILTERS.map((star) => summary.histogram[String(star)] ?? 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">App feedback</h1>
        <p className="text-muted-foreground">
          How freelancers and employers rate FreelanceXchain itself — separate from the reviews they
          leave for each other.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{summary.average || '—'}</p>
            <StarRating value={summary.average} readOnly size="sm" className="my-1" />
            <p className="text-xs text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-xs text-muted-foreground">Total responses</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-success">{summary.positivePercentage}%</p>
            <p className="text-xs text-muted-foreground">Rated 4 or 5</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{summary.recentTotal}</p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution and per-source split */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardContent className="space-y-2 p-4">
            <h2 className="text-sm font-semibold">Rating distribution</h2>
            {STAR_FILTERS.map((star) => {
              const count = summary.histogram[String(star)] ?? 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-sm text-muted-foreground">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-warning"
                      style={{ width: `${(count / histogramMax) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm tabular-nums">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="space-y-2 p-4">
            <h2 className="text-sm font-semibold">Where the rating was given</h2>
            {summary.bySource.length === 0 ? (
              <p className="text-sm text-muted-foreground">No responses yet.</p>
            ) : (
              summary.bySource.map((stat) => (
                <div key={stat.source} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{sourceLabel(stat.source)}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {stat.average} avg · {stat.total}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email or comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={starFilter === 'all' ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => setStarFilter('all')}
          >
            All
          </Button>
          {STAR_FILTERS.map((star) => (
            <Button
              key={star}
              variant={starFilter === star ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setStarFilter(star)}
            >
              {star}★
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <Card className="bg-card border-border hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Prompted by</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        size="sm"
                        icon={Star}
                        title="No feedback yet"
                        description="Ratings appear here as users submit them."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((rating) => (
                    <TableRow key={rating.id}>
                      <TableCell>
                        <div className="min-w-0 max-w-[12rem] lg:max-w-none">
                          <p className="truncate font-medium" title={rating.userName}>
                            {rating.userName}
                          </p>
                          <p className="truncate text-sm text-muted-foreground" title={rating.userEmail}>
                            {rating.userEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[rating.userRole as UserRole] ?? ''}>
                          {rating.userRole}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StarRating value={rating.rating} readOnly size="sm" />
                      </TableCell>
                      <TableCell className="max-w-[20rem]">
                        {rating.comment ? (
                          <p className="whitespace-pre-wrap break-words text-sm">{rating.comment}</p>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-muted text-muted-foreground">
                          {sourceLabel(rating.source)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(rating.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <EmptyState
            size="sm"
            icon={Star}
            title="No feedback yet"
            description="Ratings appear here as users submit them."
          />
        ) : (
          filtered.map((rating) => (
            <Card key={rating.id} className="bg-card border-border">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{rating.userName}</p>
                    <p className="truncate text-sm text-muted-foreground">{rating.userEmail}</p>
                  </div>
                  <Badge className={roleColors[rating.userRole as UserRole] ?? ''}>
                    {rating.userRole}
                  </Badge>
                </div>
                <StarRating value={rating.rating} readOnly size="sm" />
                {rating.comment && (
                  <p className="whitespace-pre-wrap break-words text-sm">{rating.comment}</p>
                )}
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{sourceLabel(rating.source)}</span>
                  <span>{formatDate(rating.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
