'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Server,
  Database,
  Globe,
  HardDrive,
  Cpu,
  MemoryStick,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Wifi,
} from 'lucide-react';

const services = [
  {
    name: 'API Server',
    status: 'healthy',
    uptime: '99.99%',
    responseTime: '45ms',
    icon: Server,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    name: 'PostgreSQL Database',
    status: 'healthy',
    uptime: '99.99%',
    responseTime: '12ms',
    icon: Database,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    name: 'Blockchain Node',
    status: 'healthy',
    uptime: '99.95%',
    responseTime: '120ms',
    icon: Globe,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    name: 'File Storage (Appwrite)',
    status: 'healthy',
    uptime: '99.98%',
    responseTime: '85ms',
    icon: HardDrive,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    name: 'AI/LLM Service',
    status: 'warning',
    uptime: '98.50%',
    responseTime: '250ms',
    icon: Cpu,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    name: 'KYC Provider (Didit)',
    status: 'healthy',
    uptime: '99.90%',
    responseTime: '180ms',
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
];

const systemMetrics = [
  { label: 'CPU Usage', value: '23%', icon: Cpu, color: 'text-green-500' },
  { label: 'Memory Usage', value: '4.2 GB / 16 GB', icon: MemoryStick, color: 'text-green-500' },
  { label: 'Disk Usage', value: '45 GB / 100 GB', icon: HardDrive, color: 'text-green-500' },
  { label: 'Network I/O', value: '125 MB/s', icon: Wifi, color: 'text-green-500' },
];

const recentEvents = [
  {
    id: '1',
    event: 'Service restart: AI/LLM Service',
    timestamp: '2 hours ago',
    type: 'warning',
  },
  {
    id: '2',
    event: 'Database backup completed',
    timestamp: '6 hours ago',
    type: 'success',
  },
  {
    id: '3',
    event: 'SSL certificate renewed',
    timestamp: '1 day ago',
    type: 'success',
  },
  {
    id: '4',
    event: 'High memory usage detected',
    timestamp: '2 days ago',
    type: 'warning',
  },
  {
    id: '5',
    event: 'Blockchain node synced',
    timestamp: '3 days ago',
    type: 'success',
  },
];

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Health</h1>
          <p className="text-muted-foreground">Monitor platform infrastructure</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-500">All Systems Operational</h2>
              <p className="text-muted-foreground">All services are running normally</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div
                key={service.name}
                className="p-4 rounded-xl bg-secondary/50 border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${service.bg} flex items-center justify-center`}>
                      <service.icon className={`w-5 h-5 ${service.color}`} />
                    </div>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">Uptime: {service.uptime}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      service.status === 'healthy'
                        ? 'bg-green-500/10 text-green-500'
                        : service.status === 'warning'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-red-500/10 text-red-500'
                    }
                  >
                    {service.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Response: {service.responseTime}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* System Metrics */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemMetrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                  <span className="text-sm">{metric.label}</span>
                </div>
                <span className="font-medium">{metric.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    event.type === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm">{event.event}</p>
                  <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
