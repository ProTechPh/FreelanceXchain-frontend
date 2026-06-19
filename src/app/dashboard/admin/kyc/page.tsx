'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { kycApi } from '@/lib/api';
import type { KycVerification } from '@/types';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Globe,
  AlertTriangle,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  completed: 'bg-blue-500/10 text-blue-500',
  approved: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
  expired: 'bg-gray-500/10 text-gray-500',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
};

export default function KycReviewPage() {
  const [verifications, setVerifications] = useState<KycVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'completed' | 'approved' | 'rejected'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [stats, setStats] = useState({ pending: 0, completed: 0, approved: 0, rejected: 0 });

  const fetchVerifications = useCallback(async (status: typeof filter) => {
    setLoading(true);
    try {
      const res = status === 'pending'
        ? await kycApi.adminGetPending()
        : await kycApi.adminGetByStatus(status);
      setVerifications(res.data);
    } catch {
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [pending, completed, approved, rejected] = await Promise.all([
        kycApi.adminGetPending().then(r => r.data.length).catch(() => 0),
        kycApi.adminGetByStatus('completed').then(r => r.data.length).catch(() => 0),
        kycApi.adminGetByStatus('approved').then(r => r.data.length).catch(() => 0),
        kycApi.adminGetByStatus('rejected').then(r => r.data.length).catch(() => 0),
      ]);
      setStats({ pending, completed, approved, rejected });
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVerifications(filter);
  }, [filter, fetchVerifications]);

  const handleReview = async (id: string, decision: 'approved' | 'rejected') => {
    setReviewing(id);
    try {
      await kycApi.adminReview(id, decision, reviewNotes || undefined);
      setReviewNotes('');
      setExpandedId(null);
      fetchVerifications(filter);
      fetchStats();
    } catch {
      // error handled silently
    } finally {
      setReviewing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KYC Review</h1>
          <p className="text-muted-foreground">Review identity verification requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Pending" count={stats.pending} color="yellow" active={filter === 'pending'} onClick={() => setFilter('pending')} />
        <StatCard icon={AlertTriangle} label="Under Review" count={stats.completed} color="blue" active={filter === 'completed'} onClick={() => setFilter('completed')} />
        <StatCard icon={CheckCircle} label="Approved" count={stats.approved} color="green" active={filter === 'approved'} onClick={() => setFilter('approved')} />
        <StatCard icon={XCircle} label="Rejected" count={stats.rejected} color="red" active={filter === 'rejected'} onClick={() => setFilter('rejected')} />
      </div>

      {/* Verification List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : verifications.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No {filter} verifications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {verifications.map((v) => (
            <VerificationCard
              key={v.id}
              verification={v}
              expanded={expandedId === v.id}
              onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)}
              onReview={handleReview}
              reviewing={reviewing === v.id}
              reviewNotes={reviewNotes}
              setReviewNotes={setReviewNotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, count, color, active, onClick }: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-500/10',
    blue: 'bg-blue-500/10',
    green: 'bg-green-500/10',
    red: 'bg-red-500/10',
  };
  const iconColorMap: Record<string, string> = {
    yellow: 'text-yellow-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
  };

  return (
    <Card
      className={`bg-card border-border cursor-pointer transition-all ${active ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColorMap[color]}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VerificationCard({ verification: v, expanded, onToggle, onReview, reviewing, reviewNotes, setReviewNotes }: {
  verification: KycVerification;
  expanded: boolean;
  onToggle: () => void;
  onReview: (id: string, decision: 'approved' | 'rejected') => void;
  reviewing: boolean;
  reviewNotes: string;
  setReviewNotes: (n: string) => void;
}) {
  const initials = [v.first_name?.[0], v.last_name?.[0]].filter(Boolean).join('') || '??';
  const fullName = [v.first_name, v.last_name].filter(Boolean).join(' ') || 'Unknown User';

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg">
              {initials}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{fullName}</h3>
              <p className="text-sm text-muted-foreground">{v.user_id}</p>
            </div>
          </div>
          <Badge className={statusColors[v.status]}>{statusLabels[v.status]}</Badge>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <InfoCell label="Nationality" value={v.nationality || 'N/A'} icon={Globe} />
          <InfoCell label="Document" value={v.document_type || 'N/A'} icon={FileText} />
          <InfoCell label="Submitted" value={v.created_at ? new Date(v.created_at).toLocaleDateString() : 'N/A'} icon={Clock} />
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground">Checks</p>
            <div className="flex gap-2 mt-1">
              <CheckDot passed={v.document_verified} label="ID" />
              <CheckDot passed={v.liveness_passed} label="Live" />
              <CheckDot passed={v.face_matched} label="Face" />
              <CheckDot passed={v.is_vpn === false} label="IP" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={onToggle}>
            {expanded ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
            {expanded ? 'Hide Details' : 'View Details'}
          </Button>
          {v.didit_session_url && (
            <Button variant="outline" size="sm" onClick={() => window.open(v.didit_session_url!, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" /> Open in Didit
            </Button>
          )}
        </div>

        {/* Expanded Detail View */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-4">
            {/* Personal Info */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Personal Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <DetailCell label="Full Name" value={fullName} />
                <DetailCell label="Date of Birth" value={v.date_of_birth || 'N/A'} />
                <DetailCell label="Nationality" value={v.nationality || 'N/A'} />
                <DetailCell label="Document Number" value={v.document_number || 'N/A'} />
                <DetailCell label="Document Type" value={v.document_type || 'N/A'} />
                <DetailCell label="Issuing Country" value={v.issuing_country || 'N/A'} />
              </div>
            </div>

            {/* Verification Results */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Verification Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ResultCell label="Document Verified" passed={v.document_verified} />
                <ResultCell label="Liveness Check" passed={v.liveness_passed} extra={v.liveness_confidence_score ? `Score: ${v.liveness_confidence_score}` : undefined} />
                <ResultCell label="Face Match" passed={v.face_matched} extra={v.face_similarity_score ? `Score: ${v.face_similarity_score}` : undefined} />
                <ResultCell label="VPN/Proxy" passed={v.is_vpn === false && v.is_proxy === false} extra={v.is_vpn ? 'VPN detected' : v.is_proxy ? 'Proxy detected' : 'Clean'} />
              </div>
            </div>

            {/* IP Analysis */}
            {(v.ip_address || v.ip_country_code) && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">IP Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <DetailCell label="IP Address" value={v.ip_address || 'N/A'} />
                  <DetailCell label="Country" value={v.ip_country_code || 'N/A'} />
                  <DetailCell label="VPN" value={v.is_vpn ? 'Yes' : 'No'} />
                  <DetailCell label="Proxy" value={v.is_proxy ? 'Yes' : 'No'} />
                </div>
              </div>
            )}

            {/* Admin Review */}
            {v.status === 'completed' && (
              <div className="pt-3 border-t border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Admin Review</h4>
                <textarea
                  className="w-full p-3 rounded-lg bg-secondary border border-border text-sm resize-none"
                  rows={3}
                  placeholder="Add review notes (optional)..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
                <div className="flex gap-3 mt-3">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={reviewing}
                    onClick={() => onReview(v.id, 'approved')}
                  >
                    {reviewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                    disabled={reviewing}
                    onClick={() => onReview(v.id, 'rejected')}
                  >
                    {reviewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {/* Previous Review Info */}
            {v.reviewed_by && (
              <div className="pt-3 border-t border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Review History</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <DetailCell label="Reviewed By" value={v.reviewed_by} />
                  <DetailCell label="Reviewed At" value={v.reviewed_at ? new Date(v.reviewed_at).toLocaleString() : 'N/A'} />
                  <DetailCell label="Notes" value={v.admin_notes || 'N/A'} />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoCell({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="p-3 rounded-lg bg-secondary/50 border border-border">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded bg-secondary/30">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function ResultCell({ label, passed, extra }: { label: string; passed: boolean | null; extra?: string }) {
  return (
    <div className="p-2 rounded bg-secondary/30 flex items-center gap-2">
      {passed === null ? (
        <Clock className="w-4 h-4 text-gray-400" />
      ) : passed ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {extra && <p className="text-xs">{extra}</p>}
      </div>
    </div>
  );
}

function CheckDot({ passed, label }: { passed: boolean | null; label: string }) {
  return (
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
        passed === null
          ? 'bg-gray-500/20 text-gray-400'
          : passed
          ? 'bg-green-500/20 text-green-500'
          : 'bg-red-500/20 text-red-500'
      }`}
      title={`${label}: ${passed === null ? 'N/A' : passed ? 'Passed' : 'Failed'}`}
    >
      {label[0]}
    </div>
  );
}
