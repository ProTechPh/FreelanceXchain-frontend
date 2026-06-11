'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Download,
  Clock,
  User,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Settings,
} from 'lucide-react';

const auditLogs = [
  {
    id: '1',
    action: 'user.login',
    user: 'Alex Thompson',
    details: 'Successful login from 192.168.1.1',
    timestamp: '5 min ago',
    ip: '192.168.1.1',
    type: 'auth',
    status: 'success',
  },
  {
    id: '2',
    action: 'user.register',
    user: 'New User',
    details: 'New freelancer account created',
    timestamp: '15 min ago',
    ip: '10.0.0.1',
    type: 'auth',
    status: 'success',
  },
  {
    id: '3',
    action: 'project.create',
    user: 'TechCorp Inc.',
    details: 'New project posted: Web3 Social Media',
    timestamp: '30 min ago',
    ip: '172.16.0.1',
    type: 'project',
    status: 'success',
  },
  {
    id: '4',
    action: 'payment.release',
    user: 'System',
    details: 'Escrow payment released: $3,200',
    timestamp: '1 hour ago',
    ip: '-',
    type: 'payment',
    status: 'success',
  },
  {
    id: '5',
    action: 'user.suspend',
    user: 'Admin',
    details: 'User Suspicious Account suspended for violation',
    timestamp: '2 hours ago',
    ip: '192.168.1.100',
    type: 'admin',
    status: 'warning',
  },
  {
    id: '6',
    action: 'kyc.verify',
    user: 'Sarah Chen',
    details: 'KYC verification completed successfully',
    timestamp: '3 hours ago',
    ip: '10.0.0.5',
    type: 'kyc',
    status: 'success',
  },
  {
    id: '7',
    action: 'dispute.create',
    user: 'DeFi Protocol',
    details: 'Dispute opened for Smart Contract Audit',
    timestamp: '4 hours ago',
    ip: '172.16.0.5',
    type: 'dispute',
    status: 'warning',
  },
  {
    id: '8',
    action: 'system.backup',
    user: 'System',
    details: 'Database backup completed successfully',
    timestamp: '6 hours ago',
    ip: '-',
    type: 'system',
    status: 'success',
  },
];

const typeColors: Record<string, string> = {
  auth: 'bg-blue-500/10 text-blue-500',
  project: 'bg-cyan/10 text-cyan',
  payment: 'bg-green-500/10 text-green-500',
  admin: 'bg-purple-500/10 text-purple-500',
  kyc: 'bg-yellow-500/10 text-yellow-500',
  dispute: 'bg-orange-500/10 text-orange-500',
  system: 'bg-gray-500/10 text-gray-500',
};

const statusColors: Record<string, string> = {
  success: 'bg-green-500/10 text-green-500',
  warning: 'bg-yellow-500/10 text-yellow-500',
  error: 'bg-red-500/10 text-red-500',
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Track all platform activities</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" /> Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">45,200</p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-500">44,800</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-yellow-500">350</p>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-red-500">50</p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'auth', 'project', 'payment', 'admin', 'kyc', 'dispute', 'system'].map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type)}
              className={typeFilter === type ? 'gradient-primary text-white' : ''}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Logs */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Action</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Details</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">IP</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="p-4">
                      <code className="text-sm bg-secondary px-2 py-1 rounded">{log.action}</code>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{log.user}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="p-4">
                      <Badge className={typeColors[log.type]}>{log.type}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={statusColors[log.status]}>{log.status}</Badge>
                    </td>
                    <td className="p-4 text-sm font-mono text-muted-foreground">{log.ip}</td>
                    <td className="p-4 text-sm text-muted-foreground">{log.timestamp}</td>
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
