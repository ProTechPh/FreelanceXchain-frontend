'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, FileText, Search } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { getBusinessTypeLabel } from '@/lib/profile-form';
import { reportLoadFailure } from '@/lib/report-failure';
import { useDebounce } from '@/hooks/use-debounce';
import type { AdminBusinessProfileList, AdminBusinessProfileStatus, AdminBusinessProfileSummary } from '@/types';
import { AdminPermissionGate } from '@/components/admin/AdminPermissionGate';
import { EmployerBusinessDialog } from '@/components/admin/EmployerBusinessDialog';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUS_FILTERS: { key: AdminBusinessProfileStatus; label: string; count: keyof AdminBusinessProfileList['counts'] }[] = [
  { key: 'all', label: 'All', count: 'all' },
  { key: 'with_documents', label: 'With documents', count: 'withDocuments' },
  { key: 'complete', label: 'Complete', count: 'complete' },
  { key: 'incomplete', label: 'Incomplete', count: 'incomplete' },
];

function StatusBadge({ item }: { item: AdminBusinessProfileSummary }) {
  if (item.complete) {
    return <Badge className="bg-success-subtle text-success">Complete</Badge>;
  }
  const missing = item.missingFieldCount + item.missingDocumentCount;
  return (
    <Badge className="bg-warning-subtle text-warning">
      {missing} missing
    </Badge>
  );
}

function DocumentsSummary({ item }: { item: AdminBusinessProfileSummary }) {
  return (
    <span className="text-sm text-foreground">
      {item.submittedRequiredCount} of {item.requiredDocumentCount} required
      <span className="text-muted-foreground"> · {item.documentCount} on file</span>
    </span>
  );
}

function OwnerCell({ item }: { item: AdminBusinessProfileSummary }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-foreground">{item.name || 'Unknown user'}</p>
      {item.email && <p className="truncate text-xs text-muted-foreground">{item.email}</p>}
      {item.activeRole === 'freelancer' && (
        <Badge variant="outline" className="mt-1">
          Acting as freelancer
        </Badge>
      )}
    </div>
  );
}

export default function AdminBusinessDocumentsPage() {
  const [data, setData] = useState<AdminBusinessProfileList | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AdminBusinessProfileStatus>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [viewing, setViewing] = useState<AdminBusinessProfileSummary | null>(null);

  const load = useCallback(
    () =>
      adminApi.listEmployerBusinessProfiles({
        status,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }),
    [status, debouncedSearch],
  );

  useEffect(() => {
    let active = true;
    function run() {
      load()
        .then(({ data: response }) => {
          if (active) setData(response);
        })
        .catch((error) => {
          if (active) reportLoadFailure(error, 'business documents', run);
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

  const items = data?.items ?? [];

  return (
    <AdminPermissionGate permission="users:view" title="Business documents">
      <div className="min-w-0 space-y-6 overflow-x-hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Business documents</h1>
          <p className="text-muted-foreground">
            Read-only. Documents are kept on file and are not checked against BIR, DTI or SEC records.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search by company, name or email"
              placeholder="Search by company, name or email…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.key}
                size="sm"
                variant={status === filter.key ? 'gradient' : 'outline'}
                aria-pressed={status === filter.key}
                onClick={() => setStatus(filter.key)}
              >
                {filter.label}
                {data && <span className="ml-1 tabular-nums opacity-80">{data.counts[filter.count]}</span>}
              </Button>
            ))}
          </div>
        </div>

        {loading && !data ? (
          <ListSkeleton rows={5} label="Loading business documents" />
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={FileText}
                title={debouncedSearch || status !== 'all' ? 'No matching employers' : 'No business profiles yet'}
                description={
                  debouncedSearch || status !== 'all'
                    ? 'Try a different search or filter.'
                    : 'Employers appear here once they start adding business information.'
                }
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Last updated</TableHead>
                        <TableHead className="text-right">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.userId}>
                          <TableCell>
                            <p className="font-medium text-foreground">{item.companyName || 'Unnamed company'}</p>
                            <p className="text-xs text-muted-foreground">
                              {getBusinessTypeLabel(item.businessType) ?? 'Business type not set'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <OwnerCell item={item} />
                          </TableCell>
                          <TableCell>
                            <DocumentsSummary item={item} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge item={item} />
                          </TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                            {formatDate(item.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewing(item)}
                              aria-label={`View business documents for ${item.companyName || item.name || 'employer'}`}
                            >
                              <Eye className="size-3.5" aria-hidden="true" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile */}
            <ul className="space-y-3 md:hidden">
              {items.map((item) => (
                <li key={item.userId}>
                  <Card>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{item.companyName || 'Unnamed company'}</p>
                          <p className="text-xs text-muted-foreground">
                            {getBusinessTypeLabel(item.businessType) ?? 'Business type not set'}
                          </p>
                        </div>
                        <StatusBadge item={item} />
                      </div>
                      <OwnerCell item={item} />
                      <div className="flex items-center justify-between gap-3">
                        <DocumentsSummary item={item} />
                        <Button variant="outline" size="sm" onClick={() => setViewing(item)}>
                          <Eye className="size-3.5" aria-hidden="true" />
                          View
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Updated {formatDate(item.updatedAt)}</p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}

        <EmployerBusinessDialog
          open={viewing !== null}
          onOpenChange={(open) => {
            if (!open) setViewing(null);
          }}
          user={viewing ? { id: viewing.userId, name: viewing.name, email: viewing.email } : null}
        />
      </div>
    </AdminPermissionGate>
  );
}
