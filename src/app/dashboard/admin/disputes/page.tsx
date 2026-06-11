'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MessageSquare,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';

const disputes = [
  {
    id: '1',
    project: 'Smart Contract Audit',
    freelancer: 'Alex Thompson',
    employer: 'DeFi Protocol',
    reason: 'Incomplete audit report',
    status: 'open',
    priority: 'high',
    amount: '$2,800',
    created: '2 hours ago',
    evidence: 3,
  },
  {
    id: '2',
    project: 'Mobile App Development',
    freelancer: 'Sarah Chen',
    employer: 'StartupXYZ',
    reason: 'Missed deadline by 2 weeks',
    status: 'under_review',
    priority: 'medium',
    amount: '$5,500',
    created: '1 day ago',
    evidence: 5,
  },
  {
    id: '3',
    project: 'UI/UX Design',
    freelancer: 'Mike Johnson',
    employer: 'TechVentures',
    reason: 'Design does not match requirements',
    status: 'open',
    priority: 'medium',
    amount: '$3,200',
    created: '2 days ago',
    evidence: 2,
  },
  {
    id: '4',
    project: 'Backend Development',
    freelancer: 'Elena Rodriguez',
    employer: 'CryptoCorp',
    reason: 'API documentation missing',
    status: 'resolved',
    priority: 'low',
    amount: '$4,000',
    created: '5 days ago',
    evidence: 4,
  },
];

const statusColors: Record<string, string> = {
  open: 'bg-red-500/10 text-red-500',
  under_review: 'bg-yellow-500/10 text-yellow-500',
  resolved: 'bg-green-500/10 text-green-500',
  escalated: 'bg-purple-500/10 text-purple-500',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/10 text-red-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  low: 'bg-green-500/10 text-green-500',
};

export default function DisputesPage() {
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispute Management</h1>
          <p className="text-muted-foreground">Resolve conflicts between freelancers and employers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-muted-foreground">Open Disputes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground">Under Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">42</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">$24,500</p>
                <p className="text-xs text-muted-foreground">In Dispute</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {disputes.map((dispute) => (
          <Card key={dispute.id} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{dispute.project}</h3>
                    <Badge className={priorityColors[dispute.priority]}>
                      {dispute.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {dispute.freelancer} vs {dispute.employer}
                  </p>
                </div>
                <Badge className={statusColors[dispute.status]}>
                  {dispute.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border mb-4">
                <p className="text-sm">
                  <span className="font-medium">Reason: </span>
                  {dispute.reason}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="font-medium text-primary">{dispute.amount}</span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {dispute.evidence} evidence items
                </span>
                <span>{dispute.created}</span>
              </div>

              {dispute.status === 'open' && (
                <div className="space-y-3">
                  <Textarea placeholder="Admin resolution notes..." rows={2} />
                  <div className="flex gap-3">
                    <Button className="gradient-primary text-white" size="sm">
                      <CheckCircle className="w-4 h-4 mr-2" /> Resolve in Favor of Freelancer
                    </Button>
                    <Button variant="outline" size="sm" className="text-green-500 border-green-500/50">
                      <CheckCircle className="w-4 h-4 mr-2" /> Resolve in Favor of Employer
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" /> Request More Info
                    </Button>
                  </div>
                </div>
              )}

              {dispute.status === 'resolved' && (
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <p className="text-sm text-green-500 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Dispute resolved - Refund issued to employer
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
