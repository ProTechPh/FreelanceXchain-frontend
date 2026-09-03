'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { kycApi } from '@/lib/api';
import { classifyKycStatusError } from '@/lib/kyc-status-error';
import { getKycRetryAvailability } from '@/lib/kyc-retry';
import { getApiErrorMessage } from '@/lib/auth-contract';
import type { KycVerification, UserRole } from '@/types';
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Loader2, Globe, FileText, User, Calendar } from 'lucide-react';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import { KycVerificationModal } from '@/components/kyc/kyc-verification-modal';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  approved: { label: 'Approved', color: 'bg-success-subtle text-success', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-destructive-subtle text-destructive', icon: XCircle },
  completed: { label: 'Under Review', color: 'bg-info-subtle text-info', icon: Clock },
  pending: { label: 'Pending', color: 'bg-warning-subtle text-warning', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-info-subtle text-info', icon: Loader2 },
  expired: { label: 'Expired', color: 'bg-neutral-subtle text-neutral', icon: AlertTriangle },
};

type ParticipantRole = Extract<UserRole, 'freelancer' | 'employer'>;

export function VerificationCenter({ role }: { role: ParticipantRole }) {
  const [verification, setVerification] = useState<KycVerification | null>(null);
  const [history, setHistory] = useState<KycVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSessionUrl, setModalSessionUrl] = useState<string | null>(null);

  const handleOpenModal = (url: string | null) => {
    if (!url) return;
    setModalSessionUrl(url);
    setIsModalOpen(true);
  };

  const handleVerificationCompleted = async () => {
    setIsModalOpen(false);
    if (verification?.id) {
      try {
        const res = await kycApi.refresh(verification.id);
        setVerification(res.data);
        setHistory((current) => current.map((item) => item.id === res.data.id ? res.data : item));
      } catch {
        await fetchStatus();
      }
    } else {
      await fetchStatus();
    }
  };

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await kycApi.getStatus();
      setVerification(res.data);
      setStatusError(null);
      setError(null);
    } catch (statusRequestError: unknown) {
      setVerification(null);
      setStatusError(
        classifyKycStatusError(statusRequestError) === 'not-found'
          ? null
          : 'We could not load your verification status. Please try again.'
      );
    }
    try {
      const { data } = await kycApi.getHistory();
      setHistory(data);
    } catch {
      // Current status remains usable when historical attempts are unavailable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatus();
  }, [fetchStatus]);

  const handleInitiate = async () => {
    setInitiating(true);
    setError(null);
    try {
      const res = await kycApi.initiate();
      const data = res.data;
      setVerification(data);
      setHistory((current) => [data, ...current.filter((item) => item.id !== data.id)]);
      if (data.didit_session_url) {
        handleOpenModal(data.didit_session_url);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to start verification'));
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
      setHistory((current) => current.map((item) => item.id === res.data.id ? res.data : item));
    } catch (refreshError) {
      setError(getApiErrorMessage(refreshError, 'Unable to refresh verification status.'));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <DetailSkeleton label="Loading verification" />
    );
  }

  const config = verification ? statusConfig[verification.status] ?? statusConfig.pending : null;
  const StatusIcon = config?.icon ?? Shield;
  const retryAvailability = verification ? getKycRetryAvailability(verification) : null;
  const roleDescription = role === 'employer'
    ? 'Complete KYC verification to hire freelancers and post projects'
    : 'Complete KYC verification to access all platform features';
  const unlockDescription = role === 'employer'
    ? 'Complete identity verification to hire freelancers and manage contracts.'
    : 'Complete identity verification to unlock project proposals, contracts, and payments.';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Identity verification</h1>
          <p className="text-muted-foreground">{roleDescription}</p>
        </div>
      </div>

      {error && (
        <Card className="bg-destructive-subtle border-destructive-border">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
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
          {statusError ? (
            <div role="alert" className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive-subtle flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Unable to Load Verification Status</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">{statusError}</p>
              </div>
              <Button onClick={fetchStatus} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            </div>
          ) : !verification ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Not Verified Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {unlockDescription}
                  The process takes about 2 minutes.
                </p>
              </div>
              <Button
                onClick={handleInitiate}
                loading={initiating}
                loadingText="Starting…"
                variant="gradient"
              >
                <Shield className="size-4" aria-hidden="true" /> Start verification
              </Button>
            </div>
          ) : (
            <>
              {/* Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2">
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
                      variant="gradient"
                      onClick={() => handleOpenModal(verification.didit_session_url)}
                    >
                      <Shield className="w-4 h-4 mr-2" /> Continue verification
                    </Button>
                  </div>
                )}
                {(verification.status === 'rejected' || verification.status === 'expired') && (
                  <Button
                    onClick={handleInitiate}
                    loading={initiating} loadingText="Starting…" disabled={retryAvailability?.canRetry === false}
                    variant="gradient"
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    {retryAvailability?.canRetry === false ? `Retry in ${retryAvailability.hoursRemaining}h` : 'Retry verification'}
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

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Verification history</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No previous verification attempts.</p> : <ol className="space-y-3">{history.map((attempt) => {
            const attemptConfig = statusConfig[attempt.status] ?? statusConfig.pending;
            const AttemptIcon = attemptConfig.icon;
            return <li key={`${attempt.id}-${attempt.updated_at}`} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Badge className={attemptConfig.color}><AttemptIcon className="mr-1 h-3 w-3" />{attemptConfig.label}</Badge>{verification?.id === attempt.id && <Badge variant="outline">Current</Badge>}</div><p className="mt-2 text-xs text-muted-foreground">Started {new Date(attempt.created_at).toLocaleString()} · updated {new Date(attempt.updated_at).toLocaleString()}</p>{attempt.admin_notes && <p className="mt-2 text-sm text-muted-foreground">{attempt.admin_notes}</p>}</div>{attempt.didit_session_url && (attempt.status === 'pending' || attempt.status === 'in_progress') && <Button type="button" size="sm" variant="outline" onClick={() => handleOpenModal(attempt.didit_session_url)}>Continue<Shield className="ml-2 h-4 w-4" /></Button>}</li>;
          })}</ol>}
        </CardContent>
      </Card>

      <KycVerificationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        sessionUrl={modalSessionUrl}
        onComplete={handleVerificationCompleted}
      />
    </div>
  );
}

export default function VerificationPage() {
  return <VerificationCenter role="freelancer" />;
}

function CheckItem({ label, passed }: { label: string; passed: boolean | null }) {
  if (passed === null) return null;
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <CheckCircle className="w-4 h-4 text-success" />
      ) : (
        <XCircle className="w-4 h-4 text-destructive" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  );
}
