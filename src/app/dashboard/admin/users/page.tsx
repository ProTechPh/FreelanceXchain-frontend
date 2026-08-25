'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api';
import type { AdminUser, UserRole } from '@/types';
import { toast } from 'sonner';
import { Search, Ban, UserCheck, ShieldCheck, Loader2 } from 'lucide-react';

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
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await adminApi.getUsers();
      setUsers(data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleSuspend = async (user: AdminUser) => {
    const reason = window.prompt(`Reason for suspending ${user.name || user.email}:`);
    if (!reason) return;
    setPendingActionId(user.id);
    try {
      await adminApi.suspendUser(user.id, reason);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: false } : u)));
      toast.success('User suspended');
    } catch {
      toast.error('Failed to suspend user');
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
    } catch {
      toast.error('Failed to unsuspend user');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleVerify = async (user: AdminUser) => {
    const reason = window.prompt(`Reason for manually verifying ${user.name || user.email}:`);
    const trimmedReason = reason?.trim();

    if (!trimmedReason) return;
    if (trimmedReason.length < 10) {
      toast.error('Verification reason must be at least 10 characters');
      return;
    }

    setPendingActionId(user.id);
    try {
      await adminApi.verifyUser(user.id, trimmedReason);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, kycVerified: true } : u)));
      toast.success(`${user.name || user.email} manually verified`);
    } catch {
      toast.error('Failed to verify user');
    } finally {
      setPendingActionId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase();
    const matchesSearch = !term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeCount = users.filter((u) => u.isActive).length;
  const suspendedCount = users.filter((u) => !u.isActive).length;
  const freelancerCount = users.filter((u) => u.role === 'freelancer').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">User management</h1>
        <p className="text-muted-foreground">Manage platform users and accounts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'freelancer', 'employer'] as const).map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(role)}
            >
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{user.name || 'Unnamed'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={roleColors[user.role]}>{user.role}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={statusColors[user.isActive ? 'active' : 'suspended']}>
                        {user.isActive ? 'active' : 'suspended'}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          title={user.kycVerified ? 'KYC verified' : 'Manually verify KYC'}
                          aria-label={user.kycVerified ? 'KYC verified' : `Manually verify KYC for ${user.name || user.email}`}
                          disabled={pendingActionId === user.id || user.kycVerified}
                          onClick={() => handleVerify(user)}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </Button>
                        {user.isActive ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-warning"
                            title="Suspend"
                            disabled={pendingActionId === user.id}
                            onClick={() => handleSuspend(user)}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-success"
                            title="Unsuspend"
                            disabled={pendingActionId === user.id}
                            onClick={() => handleUnsuspend(user)}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No users match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
