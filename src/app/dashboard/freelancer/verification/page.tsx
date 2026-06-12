'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { kycApi } from '@/lib/api';
import type { KycVerification } from '@/types';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Loader2,
  Globe,
  FileText,
  User,
  Calendar,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  approved: { label: 'Approved', color: 'bg-green-500/10 text-green-500', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-500', icon: XCircle },
  completed: { label: 'Under Review', color: 'bg-blue-500/10 text-blue-500', icon: Clock },
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-500', icon: Loader2 },
  expired: { label: 'Expired', color: 'bg-gray-500/10 text-gray-500', icon: AlertTriangle },
};

export default function VerificationPage() {
  const [verification, setVerification] = useState<KycVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await kycApi.getStatus();
      setVerification(res.data);
      setError(null);
    } catch {
      setVerification(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleInitiate = async () => {
    setInitiating(true);
    setError(null);
    try {
      const res = await kycApi.initiate();
      const data = res.data;
      setVerification(data);
      if (data.didit_session_url) {
        window.open(data.didit_session_url, '_blank');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr.response?.data?.error?.message ?? 'Failed to start verification');
    } finally {
      setInitiating(false);
    }
  };

  const handleRefresh = async () => {
    if (!verification) return;
    setRefreshing(true);
    try {
      const res = await kycApi.refresh(verification.id);
      setVerification(res.data);
    } catch {
      // silently fail
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const config = verification ? statusConfig[verification.status] ?? statusConfig.pending : null;
  const StatusIcon = config?.icon ?? Shield;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Identity Verification</h1>
          <p className="text-muted-foreground">Complete KYC verification to access all platform features</p>
        </div>
      </div>

      {error && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <p className="text-sm text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Status Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!verification ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Not Verified Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Complete identity verification to unlock project proposals, contracts, and payments.
                  The process takes about 2 minutes.
                </p>
              </div>
              <Button
                onClick={handleInitiate}
                disabled={initiating}
                className="gradient-primary text-white"
              >
                {initiating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" /> Start Verification
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={config?.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {config?.label}
                  </Badge>
                  {verification.expires_at && verification.status === 'approved' && (
                    <span className="text-xs text-muted-foreground">
                      Expires {new Date(verification.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {verification.didit_session_url && (verification.status === 'pending' || verification.status === 'in_progress') && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      className="gradient-primary text-white"
                      onClick={() => window.open(verification.didit_session_url!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" /> Continue Verification
                    </Button>
                  </div>
                )}
                {(verification.status === 'rejected' || verification.status === 'expired') && (
                  <Button
                    onClick={handleInitiate}
                    disabled={initiating}
                    className="gradient-primary text-white"
                  >
                    {initiating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" /> Retry Verification
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Verification Details */}
              {verification.status === 'approved' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" /> Name
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {[verification.first_name, verification.last_name].filter(Boolean).join(' ') || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Nationality
                    </p>
                    <p className="text-sm font-medium mt-1">{verification.nationality || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Document
                    </p>
                    <p className="text-sm font-medium mt-1">{verification.document_type || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Verified On
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {verification.completed_at ? new Date(verification.completed_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {/* Check Results */}
              {(verification.document_verified !== null || verification.liveness_passed !== null || verification.face_matched !== null) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Verification Checks</h4>
                  <div className="flex gap-4">
                    <CheckItem label="Document" passed={verification.document_verified} />
                    <CheckItem label="Liveness" passed={verification.liveness_passed} />
                    <CheckItem label="Face Match" passed={verification.face_matched} />
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {verification.admin_notes && (
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground">Admin Notes</p>
                  <p className="text-sm mt-1">{verification.admin_notes}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CheckItem({ label, passed }: { label: string; passed: boolean | null }) {
  if (passed === null) return null;
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  );
}
