'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminApi } from '@/lib/api';
import type { AdminUser, UserRole } from '@/types';
import { toast } from 'sonner';
import { reportLoadFailure } from '@/lib/report-failure';
import { Users, Search, Ban, UserCheck, ShieldCheck, CheckCircle2, XCircle, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/format';

const statusColors: Record<string, string> = {
  active: 'bg-success-subtle text-success',
  suspended: 'bg-destructive-subtle text-destructive',
};

const roleColors: Record<UserRole, string> = {
  freelancer: 'bg-primary/10 text-primary',
  employer: 'bg-cyan/10 text-cyan',
  admin: 'bg-info-subtle text-info',
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [kycFilter, setKycFilter] = useState<'all' | 'approved' | 'pending' | 'unverified'>('all');
  const [emailFilter, setEmailFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  // Dialog states replacing window.prompt
  const [userToSuspend, setUserToSuspend] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [userToVerify, setUserToVerify] = useState<AdminUser | null>(null);
  const [verifyReason, setVerifyReason] = useState('');
  const [userToUnsuspend, setUserToUnsuspend] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    const { data } = await adminApi.getUsers();
    setUsers(data.users);
  }, []);

  // Reported here rather than inside the loader so the toast's Retry can
  // call it again; a self-reference inside the callback is not allowed.
  useEffect(() => {
    let active = true;
    function run() {
      load()
        .catch((error) => {
          if (active) reportLoadFailure(error, 'users', run);
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

  const confirmSuspend = async () => {
    if (!userToSuspend) return;
    const reason = suspendReason.trim();
    if (!reason) {
      toast.warning('A suspension reason is required — it will be recorded with the action.');
      return;
    }
    setPendingActionId(userToSuspend.id);
    try {
      await adminApi.suspendUser(userToSuspend.id, reason);
      setUsers((prev) => prev.map((u) => (u.id === userToSuspend.id ? { ...u, isActive: false } : u)));
      toast.success('User suspended');
      setUserToSuspend(null);
      setSuspendReason('');
    } catch {
      toast.error('Couldn\'t suspend this user. Try again.');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleUnsuspend = async (user: AdminUser) => {
    setPendingActionId(user.id);
    try {
      await adminApi.unsuspendUser(user.id);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: true } : u)));
      toast.success('User unsuspended');
      setUserToUnsuspend(null);
    } catch {
      toast.error('Couldn\'t unsuspend this user. Try again.');
    } finally {
      setPendingActionId(null);
    }
  };

  const confirmVerify = async () => {
    if (!userToVerify) return;
    const trimmedReason = verifyReason.trim();

    if (!trimmedReason) {
      toast.warning('A verification reason is required — it will be stored with the manual approval.');
      return;
    }
    if (trimmedReason.length < 10) {
      toast.warning('Verification reason must be at least 10 characters so there\'s a meaningful audit trail.');
      return;
    }

    setPendingActionId(userToVerify.id);
    try {
      await adminApi.verifyUser(userToVerify.id, trimmedReason);
      setUsers((prev) => prev.map((u) => (u.id === userToVerify.id ? { ...u, kycVerified: true } : u)));
      toast.success(`${userToVerify.name || userToVerify.email} manually verified`);
      setUserToVerify(null);
      setVerifyReason('');
    } catch {
      toast.error('Couldn\'t verify this user. Try again.');
    } finally {
      setPendingActionId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase();
    const matchesSearch = !term || (user.name && user.name.toLowerCase().includes(term)) || (user.email && user.email.toLowerCase().includes(term));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const isKycApproved = user.kycVerified || user.kycStatus === 'approved';
    const isKycPending = user.kycStatus === 'pending' || user.kycStatus === 'in_progress';
    const matchesKyc =
      kycFilter === 'all' ||
      (kycFilter === 'approved' && isKycApproved) ||
      (kycFilter === 'pending' && isKycPending) ||
      (kycFilter === 'unverified' && !isKycApproved && !isKycPending);
    const matchesEmail =
      emailFilter === 'all' ||
      (emailFilter === 'verified' && Boolean(user.emailVerified)) ||
      (emailFilter === 'unverified' && !user.emailVerified);
    return matchesSearch && matchesRole && matchesKyc && matchesEmail;
  });

  if (loading) {
    return (
      <ListSkeleton rows={6} label="Loading users" />
    );
  }

  const activeCount = users.filter((u) => u.isActive).length;
  const suspendedCount = users.filter((u) => !u.isActive).length;
  const freelancerCount = users.filter((u) => u.role === 'freelancer').length;
  const kycApprovedCount = users.filter((u) => u.kycVerified || u.kycStatus === 'approved').length;
  const emailVerifiedCount = users.filter((u) => u.emailVerified).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">User management</h1>
        <p className="text-muted-foreground">Manage platform users and accounts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-success">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-500">{kycApprovedCount}</p>
            <p className="text-xs text-muted-foreground">KYC Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-cyan">{emailVerifiedCount}</p>
            <p className="text-xs text-muted-foreground">Email Verified</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{freelancerCount}</p>
            <p className="text-xs text-muted-foreground">Freelancers</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-destructive">{suspendedCount}</p>
            <p className="text-xs text-muted-foreground">Suspended</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'freelancer', 'employer'] as const).map((role) => (
              <Button
                key={role}
                variant={roleFilter === role ? 'gradient' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter(role)}
              >
                {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">KYC:</span>
            {([
              { key: 'all', label: 'All' },
              { key: 'approved', label: 'Approved' },
              { key: 'pending', label: 'Pending' },
              { key: 'unverified', label: 'Not Approved' },
            ] as const).map(({ key, label }) => (
              <Button
                key={key}
                variant={kycFilter === key ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setKycFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">Email:</span>
            {([
              { key: 'all', label: 'All' },
              { key: 'verified', label: 'Verified' },
              { key: 'unverified', label: 'Unverified' },
            ] as const).map(({ key, label }) => (
              <Button
                key={key}
                variant={emailFilter === key ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setEmailFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table — Desktop */}
      <Card className="bg-card border-border hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const isKycApproved = user.kycVerified || user.kycStatus === 'approved';
                    const isKycPending = user.kycStatus === 'pending' || user.kycStatus === 'in_progress';
                    const isKycRejected = user.kycStatus === 'rejected';

                    return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="min-w-0 max-w-[12rem] sm:max-w-none">
                          <p className="truncate font-medium" title={user.name || 'Unnamed'}>{user.name || 'Unnamed'}</p>
                          <p className="truncate text-sm text-muted-foreground" title={user.email}>{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[user.isActive ? 'active' : 'suspended']}>
                          {user.isActive ? 'active' : 'suspended'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.emailVerified ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs inline-flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs inline-flex items-center gap-1 font-medium">
                            <XCircle className="w-3.5 h-3.5 text-amber-500" />
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isKycApproved ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs inline-flex items-center gap-1 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Approved
                          </Badge>
                        ) : isKycPending ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs inline-flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Pending
                          </Badge>
                        ) : isKycRejected ? (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs inline-flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                            Rejected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs inline-flex items-center gap-1 font-medium">
                            <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
                            Not Approved
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-4 text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary touch-manipulation"
                            title={isKycApproved ? 'KYC verified' : 'Manually verify KYC'}
                            aria-label={isKycApproved ? 'KYC verified' : `Manually verify KYC for ${user.name || user.email}`}
                            disabled={pendingActionId === user.id || isKycApproved}
                            onClick={() => {
                              setUserToVerify(user);
                              setVerifyReason('');
                            }}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                          {user.isActive ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-warning touch-manipulation"
                              title="Suspend user"
                              aria-label={`Suspend ${user.name || user.email}`}
                              disabled={pendingActionId === user.id}
                              onClick={() => {
                                setUserToSuspend(user);
                                setSuspendReason('');
                              }}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-success touch-manipulation"
                              title="Unsuspend user"
                              aria-label={`Unsuspend ${user.name || user.email}`}
                              disabled={pendingActionId === user.id}
                              onClick={() => setUserToUnsuspend(user)}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10">
                        <EmptyState
                          size="sm"
                          icon={Users}
                          title="No users match your filters"
                          description="Try clearing the search or selecting a different role or verification filter."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </div>
        </CardContent>
      </Card>

      {/* Users Cards — Mobile */}
      <div className="space-y-3 md:hidden">
        {filteredUsers.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-10">
              <EmptyState
                size="sm"
                icon={Users}
                title="No users match your filters"
                description="Try clearing the search or selecting a different role or verification filter."
              />
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const isKycApproved = user.kycVerified || user.kycStatus === 'approved';
            const isKycPending = user.kycStatus === 'pending' || user.kycStatus === 'in_progress';
            const isKycRejected = user.kycStatus === 'rejected';

            return (
            <Card key={user.id} className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate" title={user.name || 'Unnamed'}>{user.name || 'Unnamed'}</p>
                    <p className="text-sm text-muted-foreground truncate" title={user.email}>{user.email}</p>
                  </div>
                  <Badge className={statusColors[user.isActive ? 'active' : 'suspended']}>
                    {user.isActive ? 'active' : 'suspended'}
                  </Badge>
                </div>

                {/* Email and KYC status tags */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Email:</span>
                    {user.emailVerified ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px] py-0 px-1.5 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[11px] py-0 px-1.5 flex items-center gap-1 font-medium">
                        <XCircle className="w-3 h-3 text-amber-500" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">KYC:</span>
                    {isKycApproved ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px] py-0 px-1.5 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Approved
                      </Badge>
                    ) : isKycPending ? (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[11px] py-0 px-1.5 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-amber-500" />
                        Pending
                      </Badge>
                    ) : isKycRejected ? (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[11px] py-0 px-1.5 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3 text-destructive" />
                        Rejected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[11px] py-0 px-1.5 flex items-center gap-1 font-medium">
                        <ShieldAlert className="w-3 h-3 text-muted-foreground" />
                        Not Approved
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Badge className={roleColors[user.role]}>{user.role}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-primary touch-manipulation"
                      aria-label={isKycApproved ? 'KYC verified' : `Manually verify KYC for ${user.name || user.email}`}
                      disabled={pendingActionId === user.id || isKycApproved}
                      onClick={() => {
                        setUserToVerify(user);
                        setVerifyReason('');
                      }}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </Button>
                    {user.isActive ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-warning touch-manipulation"
                        aria-label={`Suspend ${user.name || user.email}`}
                        disabled={pendingActionId === user.id}
                        onClick={() => {
                          setUserToSuspend(user);
                          setSuspendReason('');
                        }}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-success touch-manipulation"
                        aria-label={`Unsuspend ${user.name || user.email}`}
                        disabled={pendingActionId === user.id}
                        onClick={() => setUserToUnsuspend(user)}
                      >
                        <UserCheck className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>

      {/* Suspend User Modal */}
      <Dialog
        open={userToSuspend !== null}
        onOpenChange={(open) => {
          if (!open && !pendingActionId) setUserToSuspend(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Suspend User</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend <strong className="text-foreground">{userToSuspend?.name || userToSuspend?.email}</strong>? They will immediately lose access to their account until unsuspended.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="suspend-reason">Reason for suspension</Label>
            <Textarea
              id="suspend-reason"
              placeholder="e.g. Terms of Service violation, suspicious escrow activity, or chargeback request."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
              disabled={Boolean(pendingActionId)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToSuspend(null)}
              disabled={Boolean(pendingActionId)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={Boolean(pendingActionId)}
              loadingText="Suspending…"
              disabled={!suspendReason.trim() || Boolean(pendingActionId)}
              onClick={confirmSuspend}
            >
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manually Verify KYC Modal */}
      <Dialog
        open={userToVerify !== null}
        onOpenChange={(open) => {
          if (!open && !pendingActionId) setUserToVerify(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Manually Verify KYC</DialogTitle>
            <DialogDescription>
              Grant manual verification status for <strong className="text-foreground">{userToVerify?.name || userToVerify?.email}</strong>. A detailed reason is required for the compliance audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="verify-reason">Verification reason</Label>
              <span className={`text-xs ${verifyReason.trim().length >= 10 ? 'text-success' : 'text-muted-foreground'}`}>
                {verifyReason.trim().length}/10 characters min
              </span>
            </div>
            <Textarea
              id="verify-reason"
              placeholder="e.g. Verified official national identity document and bank statement during video onboarding interview."
              value={verifyReason}
              onChange={(e) => setVerifyReason(e.target.value)}
              rows={3}
              disabled={Boolean(pendingActionId)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToVerify(null)}
              disabled={Boolean(pendingActionId)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              loading={Boolean(pendingActionId)}
              loadingText="Verifying…"
              disabled={verifyReason.trim().length < 10 || Boolean(pendingActionId)}
              onClick={confirmVerify}
            >
              Verify User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend User Confirmation Modal */}
      <Dialog
        open={userToUnsuspend !== null}
        onOpenChange={(open) => {
          if (!open && !pendingActionId) setUserToUnsuspend(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-success">Unsuspend User</DialogTitle>
            <DialogDescription>
              Are you sure you want to unsuspend <strong className="text-foreground">{userToUnsuspend?.name || userToUnsuspend?.email}</strong>? They will immediately regain full access to their account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToUnsuspend(null)}
              disabled={Boolean(pendingActionId)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              loading={Boolean(pendingActionId)}
              loadingText="Unsuspending…"
              onClick={() => {
                if (userToUnsuspend) handleUnsuspend(userToUnsuspend);
              }}
            >
              Unsuspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

