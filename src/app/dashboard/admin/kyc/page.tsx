'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { kycApi } from '@/lib/api';
import { safeAttachmentUrl } from '@/lib/attachment-presentation';
import type { KycVerification, KycDecisionDetails, KycImages, KycWarning } from '@/types';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Globe,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Maximize2,
  Camera,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ListSkeleton } from '@/components/dashboard/skeletons';

const statusColors: Record<string, string> = {
  pending: 'bg-warning-subtle text-warning',
  in_progress: 'bg-info-subtle text-info',
  completed: 'bg-info-subtle text-info',
  approved: 'bg-success-subtle text-success',
  rejected: 'bg-destructive-subtle text-destructive',
  expired: 'bg-neutral-subtle text-neutral',
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
  const [filter, setFilter] = useState<'completed' | 'approved' | 'rejected' | 'pending'>('completed');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [stats, setStats] = useState({ completed: 0, approved: 0, rejected: 0, pending: 0 });

  const fetchVerifications = useCallback(async (status: typeof filter) => {
    setLoading(true);
    try {
      const res = status === 'completed'
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
      const [completed, approved, rejected, pending] = await Promise.all([
        kycApi.adminGetPending().then(r => r.data.length).catch(() => 0),
        kycApi.adminGetByStatus('approved').then(r => r.data.length).catch(() => 0),
        kycApi.adminGetByStatus('rejected').then(r => r.data.length).catch(() => 0),
        kycApi.adminGetByStatus('pending').then(r => r.data.length).catch(() => 0),
      ]);
      setStats({ completed, approved, rejected, pending });
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">KYC review</h1>
          <p className="text-muted-foreground">Review identity verification requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Under Review" count={stats.completed} color="blue" active={filter === 'completed'} onClick={() => setFilter('completed')} />
        <StatCard icon={CheckCircle} label="Approved" count={stats.approved} color="green" active={filter === 'approved'} onClick={() => setFilter('approved')} />
        <StatCard icon={XCircle} label="Rejected" count={stats.rejected} color="red" active={filter === 'rejected'} onClick={() => setFilter('rejected')} />
        <StatCard icon={Clock} label="Pending Submission" count={stats.pending} color="yellow" active={filter === 'pending'} onClick={() => setFilter('pending')} />
      </div>

      {/* Verification List */}
      {loading ? (
        <ListSkeleton rows={4} label="Loading KYC queue" />
      ) : verifications.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No {filter === 'completed' ? 'under review' : filter === 'pending' ? 'pending submission' : filter} verifications found
            </p>
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
    yellow: 'bg-warning-subtle',
    blue: 'bg-info-subtle',
    green: 'bg-success-subtle',
    red: 'bg-destructive-subtle',
  };
  const iconColorMap: Record<string, string> = {
    yellow: 'text-warning',
    blue: 'text-info',
    green: 'text-success',
    red: 'text-destructive',
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
  const [decisionDetails, setDecisionDetails] = useState<KycDecisionDetails | null>(null);
  const [loadingDecision, setLoadingDecision] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (expanded && !fetchedRef.current) {
      fetchedRef.current = true;
      setLoadingDecision(true);
      kycApi.adminGetDecision(v.id)
        .then((res) => {
          if (res.data) {
            setDecisionDetails(res.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load decision details', err);
        })
        .finally(() => {
          setLoadingDecision(false);
        });
    }
  }, [expanded, v.id]);

  const activeV = decisionDetails?.verification ? { ...v, ...decisionDetails.verification } : v;
  const rawDecision = decisionDetails?.decision as Record<string, unknown> | undefined;
  const idReport = (rawDecision?.['id_verifications'] as Array<Record<string, unknown>>)?.[0];
  const livenessReport = (rawDecision?.['liveness_checks'] as Array<Record<string, unknown>>)?.[0];
  const faceMatchReport = (rawDecision?.['face_matches'] as Array<Record<string, unknown>>)?.[0];
  const ipReport = (rawDecision?.['ip_analyses'] as Array<Record<string, unknown>>)?.[0];

  const images: KycImages = decisionDetails?.images || activeV.metadata?.images || {};
  const warnings: KycWarning[] = decisionDetails?.warnings || activeV.metadata?.warnings || [];

  const frontDoc = images.front_image || images.full_front_image;
  const backDoc = images.back_image || images.full_back_image;
  const selfie = images.reference_image;
  const portrait = images.portrait_image;

  // Personal Info Fields
  const fullName = (idReport?.['full_name'] as string) || [activeV.first_name, activeV.last_name].filter(Boolean).join(' ') || 'Unknown User';
  const initials = [activeV.first_name?.[0], activeV.last_name?.[0]].filter(Boolean).join('') || fullName.slice(0, 2).toUpperCase() || '??';
  const dateOfBirth = activeV.date_of_birth || (idReport?.['date_of_birth'] as string) || 'N/A';
  const nationality = activeV.nationality || (idReport?.['nationality'] as string) || (idReport?.['issuing_state_name'] as string) || 'Philippines';
  const documentNumber = activeV.document_number || (idReport?.['document_number'] as string) || 'N/A';
  const documentType = activeV.document_type || (idReport?.['document_type'] as string) || 'Identity Card';
  const issuingCountry = activeV.issuing_country || (idReport?.['issuing_state_name'] as string) || (idReport?.['issuing_state'] as string) || 'Philippines';
  const gender = (idReport?.['gender'] as string) || null;
  const maritalStatus = (idReport?.['marital_status'] as string) || null;
  const placeOfBirth = (idReport?.['place_of_birth'] as string) || null;
  const address = (idReport?.['formatted_address'] as string) || (idReport?.['address'] as string) || null;
  const dateOfIssue = (idReport?.['date_of_issue'] as string) || null;
  const expirationDate = (idReport?.['expiration_date'] as string) || null;
  const calculatedAge = (idReport?.['age'] as number) || null;

  // Verification Results
  const docVerified = activeV.document_verified ?? (idReport?.['status'] === 'Approved');
  const livenessPassed = activeV.liveness_passed ?? (livenessReport?.['status'] === 'Approved');
  const livenessScore = activeV.liveness_confidence_score || (livenessReport?.['score'] !== undefined ? `${livenessReport['score']}%` : null);
  const livenessMethod = (livenessReport?.['method'] as string) || null;

  const faceMatched = activeV.face_matched ?? (faceMatchReport?.['status'] === 'Approved');
  const faceScore = activeV.face_similarity_score || (faceMatchReport?.['score'] !== undefined ? `${faceMatchReport['score']}%` : null);
  const faceStatus = (faceMatchReport?.['status'] as string) || (faceMatched ? 'Approved' : 'In Review');

  // IP & Network Analysis
  const ipAddress = activeV.ip_address || (ipReport?.['ip_address'] as string) || 'N/A';
  const ipCountry = activeV.ip_country_code || (ipReport?.['ip_country'] as string) || 'Philippines';
  const ipCity = (ipReport?.['ip_city'] as string) || null;
  const ipState = (ipReport?.['ip_state'] as string) || null;
  const isp = (ipReport?.['isp'] as string) || null;
  const isVpn = activeV.is_vpn === true || ipReport?.['is_vpn_or_tor'] === true;
  const isProxy = activeV.is_proxy === true || ipReport?.['is_data_center'] === true;
  const deviceBrand = (ipReport?.['device_brand'] as string) || null;
  const deviceModel = (ipReport?.['device_model'] as string) || null;
  const browserFamily = (ipReport?.['browser_family'] as string) || null;
  const osFamily = (ipReport?.['os_family'] as string) || null;

  return (
    <>
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center font-bold text-lg">
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
            <InfoCell label="Nationality" value={nationality} icon={Globe} />
            <InfoCell label="Document" value={documentType} icon={FileText} />
            <InfoCell label="Submitted" value={activeV.created_at ? new Date(activeV.created_at).toLocaleDateString() : 'N/A'} icon={Clock} />
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground">Checks</p>
              <div className="flex gap-2 mt-1">
                <CheckDot passed={docVerified} label="ID" />
                <CheckDot passed={livenessPassed} label="Live" />
                <CheckDot passed={faceMatched} label="Face" />
                <CheckDot passed={!isVpn && !isProxy} label="IP" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={onToggle}>
              {expanded ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
              {expanded ? 'Hide Details' : 'View Details'}
            </Button>
          </div>

          {/* Expanded Detail View */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-5">
              {/* Didit Warnings Banner (if any) */}
              {warnings.length > 0 && (
                <div className="p-3.5 rounded-lg bg-warning-subtle border border-warning-border text-xs text-warning space-y-1.5">
                  <p className="font-semibold flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="size-4" /> Didit Verification Warnings ({warnings.length})
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    {warnings.map((w, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{w.short_description || w.risk || w.feature}:</span>{' '}
                        {w.long_description || w.short_description || w.risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Submitted Documents & Biometrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Submitted Documents & Biometrics
                  </h4>
                  {loadingDecision && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching latest images…
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Front Document */}
                  {frontDoc ? (
                    <div className="border border-border rounded-xl p-3 bg-secondary/20 space-y-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Document Front</span>
                        <Badge variant="outline" className="text-2xs h-5">ID Front</Badge>
                      </div>
                      <div
                        className="relative group overflow-hidden rounded-lg bg-black/60 h-44 flex items-center justify-center cursor-pointer border border-border"
                        onClick={() => setSelectedImage({ url: frontDoc, title: 'Document Front' })}
                      >
                        <img
                          src={frontDoc}
                          alt="Document Front"
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium gap-1">
                          <Maximize2 className="w-4 h-4" /> Enlarge
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Back Document */}
                  {backDoc ? (
                    <div className="border border-border rounded-xl p-3 bg-secondary/20 space-y-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Document Back</span>
                        <Badge variant="outline" className="text-2xs h-5">ID Back</Badge>
                      </div>
                      <div
                        className="relative group overflow-hidden rounded-lg bg-black/60 h-44 flex items-center justify-center cursor-pointer border border-border"
                        onClick={() => setSelectedImage({ url: backDoc, title: 'Document Back' })}
                      >
                        <img
                          src={backDoc}
                          alt="Document Back"
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium gap-1">
                          <Maximize2 className="w-4 h-4" /> Enlarge
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Selfie / Liveness Photo */}
                  {selfie ? (
                    <div className="border border-border rounded-xl p-3 bg-secondary/20 space-y-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" /> Live Selfie
                        </span>
                        <Badge variant="outline" className="text-2xs h-5">Liveness</Badge>
                      </div>
                      <div
                        className="relative group overflow-hidden rounded-lg bg-black/60 h-44 flex items-center justify-center cursor-pointer border border-border"
                        onClick={() => setSelectedImage({ url: selfie, title: 'Live Selfie (Liveness)' })}
                      >
                        <img
                          src={selfie}
                          alt="Live Selfie"
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium gap-1">
                          <Maximize2 className="w-4 h-4" /> Enlarge
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* ID Portrait Crop */}
                  {portrait ? (
                    <div className="border border-border rounded-xl p-3 bg-secondary/20 space-y-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">ID Portrait Crop</span>
                        <Badge variant="outline" className="text-2xs h-5">Extracted</Badge>
                      </div>
                      <div
                        className="relative group overflow-hidden rounded-lg bg-black/60 h-44 flex items-center justify-center cursor-pointer border border-border"
                        onClick={() => setSelectedImage({ url: portrait, title: 'ID Portrait Crop' })}
                      >
                        <img
                          src={portrait}
                          alt="ID Portrait Crop"
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium gap-1">
                          <Maximize2 className="w-4 h-4" /> Enlarge
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {!frontDoc && !backDoc && !selfie && !portrait && !loadingDecision && (
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border text-center text-xs text-muted-foreground">
                    No document images captured yet for this verification session.
                  </div>
                )}
              </div>

              {/* Personal Info */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Personal Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <DetailCell label="Full Name" value={fullName} />
                  <DetailCell label="Date of Birth" value={calculatedAge ? `${dateOfBirth} (${calculatedAge} yrs)` : dateOfBirth} />
                  <DetailCell label="Nationality" value={nationality} />
                  <DetailCell label="Document Number" value={documentNumber} />
                  <DetailCell label="Document Type" value={documentType} />
                  <DetailCell label="Issuing Country" value={issuingCountry} />
                  {gender && <DetailCell label="Gender" value={gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender} />}
                  {maritalStatus && <DetailCell label="Marital Status" value={maritalStatus} />}
                  {placeOfBirth && <DetailCell label="Place of Birth" value={placeOfBirth} />}
                  {address && <DetailCell label="Address on ID" value={address} />}
                  {dateOfIssue && <DetailCell label="Date of Issue" value={dateOfIssue} />}
                  {expirationDate && <DetailCell label="Expiration Date" value={expirationDate} />}
                </div>
              </div>

              {/* Verification Results */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Verification Results</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ResultCell
                    label="Document Verified"
                    passed={docVerified}
                    extra={idReport?.['status'] ? `Status: ${idReport['status']}` : docVerified ? 'Passed' : undefined}
                  />
                  <ResultCell
                    label="Liveness Check"
                    passed={livenessPassed}
                    extra={livenessScore ? `Score: ${livenessScore}${livenessMethod ? ` (${livenessMethod})` : ''}` : undefined}
                  />
                  <ResultCell
                    label="Face Match"
                    passed={faceMatched}
                    extra={faceScore ? `Score: ${faceScore} (${faceStatus})` : faceMatched ? 'Passed' : 'Low Similarity'}
                  />
                  <ResultCell
                    label="VPN/Proxy"
                    passed={!isVpn && !isProxy}
                    extra={isVpn ? 'VPN detected' : isProxy ? 'Proxy detected' : 'Clean (No VPN/Proxy)'}
                  />
                </div>
              </div>

              {/* IP & Device Analysis */}
              {(ipAddress !== 'N/A' || ipCountry !== 'N/A') && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">IP & Device Analysis</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <DetailCell label="IP Address" value={ipAddress} />
                    <DetailCell label="Location" value={[ipCity, ipState, ipCountry].filter(Boolean).join(', ') || ipCountry} />
                    {isp && <DetailCell label="ISP" value={isp} />}
                    <DetailCell label="VPN Detected" value={isVpn ? 'Yes (Detected)' : 'No'} />
                    <DetailCell label="Proxy / Datacenter" value={isProxy ? 'Yes (Detected)' : 'No'} />
                    {(deviceBrand || deviceModel || browserFamily || osFamily) && (
                      <DetailCell label="Device & Browser" value={[deviceBrand || deviceModel, browserFamily, osFamily].filter(Boolean).join(' • ')} />
                    )}
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
                      className="bg-success hover:bg-success/90 text-success-foreground"
                      loading={reviewing}
                      loadingText="Approving…"
                      onClick={() => onReview(v.id, 'approved')}
                    >
                      <CheckCircle className="size-4" aria-hidden="true" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive-border hover:bg-destructive-subtle"
                      loading={reviewing}
                      loadingText="Rejecting…"
                      onClick={() => onReview(v.id, 'rejected')}
                    >
                      <XCircle className="size-4" aria-hidden="true" />
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

      {/* Fullscreen Lightbox Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={(open) => { if (!open) setSelectedImage(null); }}>
          <DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
            <DialogHeader className="p-4 border-b border-border flex-row items-center justify-between gap-4 space-y-0">
              <DialogTitle className="text-sm font-semibold">{selectedImage.title}</DialogTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(selectedImage.url, '_blank', 'noopener,noreferrer')}
                className="text-xs gap-1 h-8"
              >
                <ExternalLink className="size-3.5" /> Open original
              </Button>
            </DialogHeader>
            <div className="p-4 flex items-center justify-center bg-black/80 max-h-[78vh] overflow-auto">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-w-full max-h-[75vh] object-contain rounded shadow-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
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
        <Clock className="w-4 h-4 text-neutral" />
      ) : passed ? (
        <CheckCircle className="w-4 h-4 text-success" />
      ) : (
        <XCircle className="w-4 h-4 text-destructive" />
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
      className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold ${
        passed === null
          ? 'bg-neutral-subtle text-neutral'
          : passed
          ? 'bg-success-subtle text-success'
          : 'bg-destructive-subtle text-destructive'
      }`}
      title={`${label}: ${passed === null ? 'N/A' : passed ? 'Passed' : 'Failed'}`}
    >
      {label[0]}
    </div>
  );
}
