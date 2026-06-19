'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  FolderOpen,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

const metrics = [
  {
    title: 'Monthly Revenue',
    value: '$48,500',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    title: 'New Users',
    value: '2,450',
    change: '+18.2%',
    trend: 'up',
    icon: Users,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    title: 'Active Projects',
    value: '1,280',
    change: '+8.7%',
    trend: 'up',
    icon: FolderOpen,
    color: 'text-cyan',
    bg: 'bg-cyan/10',
  },
  {
    title: 'Platform Activity',
    value: '45,200',
    change: '-2.1%',
    trend: 'down',
    icon: Activity,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
];

const revenueData = [
  { month: 'Jul', revenue: 32000 },
  { month: 'Aug', revenue: 35000 },
  { month: 'Sep', revenue: 38000 },
  { month: 'Oct', revenue: 42000 },
  { month: 'Nov', revenue: 45000 },
  { month: 'Dec', revenue: 48500 },
];

const topFreelancers = [
  { name: 'Sarah Chen', earnings: '$12,500', projects: 18, rating: 4.9 },
  { name: 'Alex Thompson', earnings: '$10,200', projects: 12, rating: 4.8 },
  { name: 'Elena Rodriguez', earnings: '$9,800', projects: 14, rating: 4.8 },
  { name: 'Mike Johnson', earnings: '$8,500', projects: 8, rating: 4.7 },
  { name: 'David Kim', earnings: '$7,200', projects: 16, rating: 4.6 },
];

const topCategories = [
  { name: 'Web Development', projects: 450, percentage: 35 },
  { name: 'Blockchain', projects: 320, percentage: 25 },
  { name: 'Mobile Development', projects: 250, percentage: 20 },
  { name: 'Design', projects: 180, percentage: 14 },
  { name: 'Other', projects: 80, percentage: 6 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Platform performance and insights</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">Last 7 days</Button>
          <Button variant="outline" size="sm" className="gradient-primary text-white">Last 30 days</Button>
          <Button variant="outline" size="sm">Last 90 days</Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold mt-1">{metric.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg ${metric.bg} flex items-center justify-center`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Revenue Trend</span>
              <Badge className="bg-green-500/10 text-green-500">
                <TrendingUp className="w-3 h-3 mr-1" /> +12.5%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2">
              {revenueData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full gradient-primary rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${(data.revenue / 50000) * 200}px` }}
                  />
                  <span className="text-xs text-muted-foreground">{data.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCategories.map((category) => (
              <div key={category.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{category.name}</span>
                  <span className="text-muted-foreground">{category.projects} projects</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Freelancers */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Top Freelancers by Earnings</span>
            <Button variant="ghost" size="sm">
              View Leaderboard <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">#</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Freelancer</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Earnings</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Projects</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rating</th>
                </tr>
              </thead>
              <tbody>
                {topFreelancers.map((freelancer, i) => (
                  <tr key={freelancer.name} className="border-b border-border">
                    <td className="p-3">
                      <span className="font-medium text-muted-foreground">#{i + 1}</span>
                    </td>
                    <td className="p-3 font-medium">{freelancer.name}</td>
                    <td className="p-3 text-primary font-semibold">{freelancer.earnings}</td>
                    <td className="p-3">{freelancer.projects}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-yellow-500" /> {freelancer.rating}
                      </span>
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
