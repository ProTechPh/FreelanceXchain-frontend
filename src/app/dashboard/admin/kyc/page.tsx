'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  User,
  Globe,
  AlertTriangle,
} from 'lucide-react';

const kycRequests = [
  {
    id: '1',
    user: 'Alex Thompson',
    avatar: 'AT',
    email: 'alex@example.com',
    country: 'United States',
    documentType: 'Passport',
    status: 'pending',
    submitted: '2 hours ago',
    checks: {
      idVerification: true,
      liveness: true,
      faceMatch: true,
      ipAnalysis: true,
    },
  },
  {
    id: '2',
    user: 'Sarah Chen',
    avatar: 'SC',
    email: 'sarah@example.com',
    country: 'Canada',
    documentType: 'Drivers License',
    status: 'pending',
    submitted: '5 hours ago',
    checks: {
      idVerification: true,
      liveness: true,
      faceMatch: false,
      ipAnalysis: true,
    },
  },
  {
    id: '3',
    user: 'Suspicious Account',
    avatar: 'SA',
    email: 'suspicious@test.com',
    country: 'Unknown',
    documentType: 'ID Card',
    status: 'flagged',
    submitted: '1 day ago',
    checks: {
      idVerification: false,
      liveness: false,
      faceMatch: false,
      ipAnalysis: false,
    },
  },
  {
    id: '4',
    user: 'Mike Johnson',
    avatar: 'MJ',
    email: 'mike@example.com',
    country: 'United Kingdom',
    documentType: 'Passport',
    status: 'approved',
    submitted: '3 days ago',
    checks: {
      idVerification: true,
      liveness: true,
      faceMatch: true,
      ipAnalysis: true,
    },
  },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  approved: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
  flagged: 'bg-orange-500/10 text-orange-500',
};

export default function KycReviewPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KYC Review</h1>
          <p className="text-muted-foreground">Review identity verification requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">Flagged</p>
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
                <p className="text-2xl font-bold">1,245</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC Requests */}
      <div className="space-y-4">
        {kycRequests.map((request) => (
          <Card key={request.id} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg">
                    {request.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{request.user}</h3>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                  </div>
                </div>
                <Badge className={statusColors[request.status]}>{request.status}</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {request.country}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">Document</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {request.documentType}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="text-sm font-medium">{request.submitted}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">Checks</p>
                  <div className="flex gap-1">
                    {Object.entries(request.checks).map(([key, passed]) => (
                      <div
                        key={key}
                        className={`w-4 h-4 rounded-full ${passed ? 'bg-green-500' : 'bg-red-500'}`}
                        title={`${key}: ${passed ? 'Passed' : 'Failed'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" /> View Documents
                </Button>
                {request.status === 'pending' && (
                  <>
                    <Button size="sm" className="gradient-primary text-white">
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 border-red-500/50">
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </>
                )}
                {request.status === 'flagged' && (
                  <Button variant="outline" size="sm" className="text-orange-500 border-orange-500/50">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Investigate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
