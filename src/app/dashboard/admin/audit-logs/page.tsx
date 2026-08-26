'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuditLogSearchInfinite, useAdminActivitySummary } from '@/hooks/use-audit-logs';
import {
  AUDIT_SEARCH_PAGE_SIZE,
  appendCursorPage,
  buildAuditSearchParams,
  hasActiveAuditFilters,
  type AuditLogStatus,
} from '@/lib/audit-log-search';
import { resolveRange } from '@/lib/analytics-range';
import { formatDateTime } from '@/lib/format';
import { getApiErrorMessage } from '@/lib/auth-contract';
import type { AuditLogEntry } from '@/types';
import { ClipboardList, Search, User } from 'lucide-react';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';

const statusColors: Record<AuditLogEntry['status'], string> = {
  success: 'bg-success-subtle text-success',
  pending: 'bg-warning-subtle text-warning',
  failure: 'bg-destructive-subtle text-destructive',
};

const RANGE_PRESETS = [
  { label: 'Last 7 days', preset: '7d' as const },
  { label: 'Last 30 days', preset: '30d' as const },
  { label: 'Last 90 days', preset: '90d' as const },
];

const STATUS_FILTERS: Array<{ label: string; value: AuditLogStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Success', value: 'success' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failure' },
];

export default function AuditLogsPage() {
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [status, setStatus] = useState<AuditLogStatus | 'all'>('all');
  const [rangePreset, setRangePreset] = useState<'7d' | '30d' | '90d'>('7d');

  // A stable `now` per range selection: recomputing it on every render would change
  // the query params on each keystroke and defeat the cache entirely.
  const range = useMemo(() => resolveRange(rangePreset, new Date()), [rangePreset]);

  // Filtering happens on the server now. The page previously fetched up to 200 rows
  // and filtered them in the browser, which silently hid anything past that cap.
  const params = useMemo(
    () =>
      buildAuditSearchParams({
        action,
        actor,
        resourceType,
        status: status === 'all' ? undefined : status,
        startDate: range.startDate,
        endDate: range.endDate,
        limit: AUDIT_SEARCH_PAGE_SIZE,
      }),
    [action, actor, resourceType, status, range],
  );

  const {
    data,
    isPending,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAuditLogSearchInfinite(params);

  const logs = useMemo(
    () => (data?.pages ?? []).reduce<AuditLogEntry[]>((acc, page) => appendCursorPage(acc, page), []),
    [data],
  );

  const total = data?.pages?.[0]?.total ?? 0;
  const successCount = logs.filter((l) => l.status === 'success').length;
  const pendingCount = logs.filter((l) => l.status === 'pending').length;
  const failureCount = logs.filter((l) => l.status === 'failure').length;

  const filtersActive = hasActiveAuditFilters({ action, actor, resourceType, status: status === 'all' ? undefined : status });

  const activity = useAdminActivitySummary(range.startDate ?? '', range.endDate ?? '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Audit logs</h1>
          <p className="text-muted-foreground">
            Track platform activity — {RANGE_PRESETS.find((p) => p.preset === rangePreset)?.label.toLowerCase()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((preset) => (
            <Button
              key={preset.preset}
              variant={rangePreset === preset.preset ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setRangePreset(preset.preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats — counts describe the rows loaded so far, `total` the whole match */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">
              {logs.length}
              {total > logs.length && <span className="text-base text-muted-foreground"> / {total}</span>}
            </p>
            <p className="text-xs text-muted-foreground">Events Loaded</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-success">{successCount}</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-destructive">{failureCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin activity summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Admin activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            {activity.data
              ? `${activity.data.totalActions} actions by ${activity.data.activeAdmins} admin${activity.data.activeAdmins === 1 ? '' : 's'} in this range.`
              : 'Per-admin, per-day action counts for the selected range.'}
          </p>
        </CardHeader>
        <CardContent>
          {activity.isPending ? (
            <ListSkeleton rows={2} label="Loading admin activity" />
          ) : activity.isError ? (
            <EmptyState
              size="sm"
              icon={ClipboardList}
              title="Activity summary unavailable"
              description={getApiErrorMessage(activity.error, 'The summary could not be loaded. Try again shortly.')}
            />
          ) : (activity.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              size="sm"
              icon={ClipboardList}
              title="No admin activity in this range"
              description="Widen the date range to see earlier administrative actions."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.data?.items.map((row) => (
                    <TableRow key={`${row.actor_id}-${row.date}`}>
                      <TableCell className="font-mono text-sm" title={row.actor_id}>
                        {row.actor_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.date}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {Object.entries(row.actions)
                          .map(([name, count]) => `${name} (${count})`)
                          .join(', ')}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters — all applied server-side */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            aria-label="Filter by action"
            placeholder="Action, e.g. user.suspend"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="pl-10"
          />
        </div>
        <Input
          aria-label="Filter by actor id"
          placeholder="Actor id"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
        />
        <Input
          aria-label="Filter by resource type"
          placeholder="Resource type, e.g. contract"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Status</span>
        {STATUS_FILTERS.map((option) => (
          <Button
            key={option.value}
            variant={status === option.value ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => setStatus(option.value)}
          >
            {option.label}
          </Button>
        ))}
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAction('');
              setActor('');
              setResourceType('');
              setStatus('all');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Logs */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isPending ? (
            <ListSkeleton rows={6} label="Loading audit logs" className="p-4" />
          ) : isError ? (
            <div className="p-4">
              <EmptyState
                size="sm"
                icon={ClipboardList}
                title="Audit logs unavailable"
                description={getApiErrorMessage(error, 'The audit log could not be loaded. Try again shortly.')}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <code className="text-sm bg-secondary px-2 py-1 rounded">{log.action}</code>
                      {log.error_message && (
                        <p className="text-xs text-destructive mt-1 max-w-xs truncate">{log.error_message}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-mono" title={log.actor_id ?? log.user_id ?? undefined}>
                          {(log.actor_id ?? log.user_id ?? 'system').slice(0, 8)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 text-sm text-muted-foreground">
                      {log.resource_type}
                      {log.resource_id && <span className="font-mono text-xs"> #{log.resource_id.slice(0, 8)}</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[log.status]}>{log.status}</Badge>
                    </TableCell>
                    <TableCell className="p-4 text-sm font-mono text-muted-foreground">{log.ip_address ?? '-'}</TableCell>
                    <TableCell className="p-4 text-sm text-muted-foreground">{formatDateTime(log.created_at)}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10">
                      <EmptyState
                        size="sm"
                        icon={ClipboardList}
                        title="No audit entries match your filters"
                        description="Try widening the date range or clearing the action filter."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
