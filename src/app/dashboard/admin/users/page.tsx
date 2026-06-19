'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Eye,
  Ban,
  UserCheck,
} from 'lucide-react';

const users = [
  {
    id: '1',
    name: 'Alex Thompson',
    email: 'alex@example.com',
    role: 'freelancer',
    status: 'active',
    kyc: 'verified',
    joined: 'Jan 2024',
    projects: 12,
    rating: 4.8,
  },
  {
    id: '2',
    name: 'TechCorp Inc.',
    email: 'hr@techcorp.com',
    role: 'employer',
    status: 'active',
    kyc: 'verified',
    joined: 'Dec 2023',
    projects: 8,
    rating: 4.5,
  },
  {
    id: '3',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    role: 'freelancer',
    status: 'active',
    kyc: 'pending',
    joined: 'Feb 2024',
    projects: 18,
    rating: 4.9,
  },
  {
    id: '4',
    name: 'Suspicious User',
    email: 'spam@test.com',
    role: 'freelancer',
    status: 'suspended',
    kyc: 'failed',
    joined: 'Nov 2024',
    projects: 0,
    rating: 0,
  },
  {
    id: '5',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'freelancer',
    status: 'active',
    kyc: 'verified',
    joined: 'Mar 2024',
    projects: 8,
    rating: 4.7,
  },
  {
    id: '6',
    name: 'New Startup',
    email: 'contact@startup.io',
    role: 'employer',
    status: 'pending',
    kyc: 'pending',
    joined: 'Dec 2024',
    projects: 1,
    rating: 0,
  },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500',
  suspended: 'bg-red-500/10 text-red-500',
  pending: 'bg-yellow-500/10 text-yellow-500',
};

const kycColors: Record<string, string> = {
  verified: 'bg-green-500/10 text-green-500',
  pending: 'bg-yellow-500/10 text-yellow-500',
  failed: 'bg-red-500/10 text-red-500',
};

const roleColors: Record<string, string> = {
  freelancer: 'bg-primary/10 text-primary',
  employer: 'bg-cyan/10 text-cyan',
  admin: 'bg-purple-500/10 text-purple-500',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage platform users and accounts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">12,450</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-500">11,800</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-yellow-500">45</p>
            <p className="text-xs text-muted-foreground">Pending KYC</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-red-500">12</p>
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
          {['all', 'freelancer', 'employer'].map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(role)}
              className={roleFilter === role ? 'gradient-primary text-white' : ''}
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
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">KYC</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Projects</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={roleColors[user.role]}>{user.role}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={statusColors[user.status]}>{user.status}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={kycColors[user.kyc]}>{user.kyc}</Badge>
                    </td>
                    <td className="p-4">{user.projects}</td>
                    <td className="p-4 text-muted-foreground">{user.joined}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {user.status === 'active' ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-500">
                            <Ban className="w-4 h-4" />
                          </Button>
                        ) : user.status === 'suspended' ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500">
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
