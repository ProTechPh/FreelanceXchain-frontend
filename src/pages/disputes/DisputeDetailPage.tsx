import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronLeft,
  User,
  FileText,
  Send,
  Paperclip,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { Card, CardHeader, PageLoader, StatusBadge, Button, Input } from '../../components/ui';
import api from '../../lib/api';
import type { Dispute, Evidence, SubmitEvidenceInput, Contract } from '../../types';
import { format } from 'date-fns';
import { useAuthStore } from '../../store';

export function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [contractDetails, setContractDetails] = useState<Contract | null>(null);
  const [partyNames, setPartyNames] = useState<{ initiatorName?: string; respondentName?: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newEvidence, setNewEvidence] = useState<SubmitEvidenceInput>({
    type: 'text',
    content: '',
  });
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState<string>('');
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchDisputeData = async () => {
      if (!id) return;
      try {
        const data = await api.getDispute(id);
        setDispute(data);
        if (data.contractId) {
          const contractRes = await api.getContract(data.contractId);
          setContractDetails(contractRes);

          // Determine respondent ID and their roles to fetch names
          const respondentIdFallback = data.initiatorId === contractRes.employerId ? contractRes.freelancerId : contractRes.employerId;
          const actualRespondentId = data.respondentId || respondentIdFallback;

          const isInitiatorEmployer = data.initiatorId === contractRes.employerId;

          try {
            // Fetch names based on role (employer/freelancer)
            const resolvedNames: { initiatorName?: string; respondentName?: string } = {};

            if (isInitiatorEmployer) {
              const employer = await api.getEmployer(data.initiatorId).catch(() => null);
              const freelancer = await api.getFreelancer(actualRespondentId).catch(() => null);
              resolvedNames.initiatorName = employer?.companyName || employer?.name || employer?.userId?.slice(0, 8);
              resolvedNames.respondentName = freelancer?.firstName ? `${freelancer.firstName} ${freelancer.lastName}` : freelancer?.name || freelancer?.userId?.slice(0, 8);
            } else {
              const freelancer = await api.getFreelancer(data.initiatorId).catch(() => null);
              const employer = await api.getEmployer(actualRespondentId).catch(() => null);
              resolvedNames.initiatorName = freelancer?.firstName ? `${freelancer.firstName} ${freelancer.lastName}` : freelancer?.name || freelancer?.userId?.slice(0, 8);
              resolvedNames.respondentName = employer?.companyName || employer?.name || employer?.userId?.slice(0, 8);
            }

            setPartyNames(resolvedNames);
          } catch (e) {
            console.error("Failed to load party names", e);
          }
        }
      } catch (error) {
        console.error('Error fetching dispute/contract:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDisputeData();
  }, [id]);

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || (!newEvidence.content.trim() && !fileToUpload && !linkUrl.trim())) return;

    setSubmitting(true);
    try {
      // 1. If Text Only
      if (newEvidence.content.trim() && !fileToUpload && !linkUrl.trim()) {
        const updated = await api.submitEvidence(id, { type: 'text', content: newEvidence.content.trim() });
        setDispute(updated);
      }

      // 2. If Link provided (with or without description)
      if (linkUrl.trim()) {
        const desc = newEvidence.content.trim() ? newEvidence.content.trim() + " - " : "";
        const updated = await api.submitEvidence(id, {
          type: 'link',
          content: `${desc}${linkUrl.trim()}`,
          fileUrl: linkUrl.trim()
        });
        setDispute(updated);
      }

      // 3. If File provided (needs to upload first)
      if (fileToUpload) {
        // Upload the file first using uploadFile from api.ts
        const uploadRes = await api.uploadFile(fileToUpload, 'dispute-evidence', id);

        if (uploadRes.success) {
          const desc = newEvidence.content.trim() || fileToUpload.name;
          const updated = await api.submitEvidence(id, {
            type: 'file',
            content: desc,
            fileUrl: uploadRes.url
          });
          setDispute(updated);
        }
      }

      // Reset everything after success
      setNewEvidence({ type: 'text', content: '' });
      setFileToUpload(null);
      setLinkUrl('');
    } catch (error) {
      console.error('Error submitting evidence:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-600/20 text-yellow-400';
      case 'under_review':
        return 'bg-blue-600/20 text-blue-400';
      case 'resolved':
        return 'bg-green-600/20 text-green-400';
      case 'escalated':
        return 'bg-red-600/20 text-red-400';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <Paperclip className="w-4 h-4" />;
      case 'link':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!dispute) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Dispute not found</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">The dispute you're looking for doesn't exist or has been removed.</p>
        <Link to="/disputes">
          <Button className="mt-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Disputes
          </Button>
        </Link>
      </div>
    );
  }

  const respondentIdFallback = contractDetails ?
    (dispute?.initiatorId === contractDetails.employerId ? contractDetails.freelancerId : contractDetails.employerId)
    : null;

  // Subukan hanapin directly sa API object kung meron, kundi gamitin ang inferred mula sa contract.
  const respondentId = dispute?.respondentId || respondentIdFallback;

  const isParticipant = user?.id === dispute?.initiatorId || user?.id === respondentId;
  const canSubmitEvidence = isParticipant && dispute?.status !== 'resolved';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/disputes" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dispute #{dispute.id.slice(0, 8)}
            </h1>
            <StatusBadge status={dispute.status} />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Opened {format(new Date(dispute.createdAt), 'MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Details */}
          <Card>
            <CardHeader title="Dispute Details" />
            <div className="space-y-4">
              <div>
                <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reason</h4>
                <p className="text-gray-900 dark:text-white">{dispute.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Contract ID</h4>
                  <Link
                    to={`/contracts/${dispute.contractId}`}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    {dispute.contractId.slice(0, 12)}...
                  </Link>
                </div>
                {dispute.milestoneId && (
                  <div>
                    <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Milestone ID</h4>
                    <span className="text-gray-900 dark:text-white">{dispute.milestoneId.slice(0, 12)}...</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Evidence */}
          <Card>
            <CardHeader title="Evidence Submitted" />
            {dispute.evidence.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No evidence has been submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {dispute.evidence.map((evidence: Evidence) => (
                  <div
                    key={evidence.id}
                    className={`p-4 rounded-lg border ${evidence.submitterId === user?.id
                        ? 'border-primary-300 dark:border-primary-500/50 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEvidenceIcon(evidence.type)}
                        <span className={`text-sm px-2 py-0.5 rounded ${evidence.type === 'file'
                            ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400'
                            : evidence.type === 'link'
                              ? 'bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-400'
                              : 'bg-gray-100 dark:bg-gray-600/20 text-gray-700 dark:text-gray-400'
                          }`}>
                          {evidence.type}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          {evidence.submitterId === user?.id ? 'You' : 'Other Party'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-500">
                        {format(new Date(evidence.submittedAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white">{evidence.content}</p>
                    {evidence.fileUrl && (
                      <a
                        href={evidence.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm flex items-center gap-1 mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Attachment
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit Evidence Form */}
            {canSubmitEvidence && (
              <form onSubmit={handleSubmitEvidence} className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
                <h4 className="text-gray-900 dark:text-white font-medium mb-4">Submit New Evidence</h4>
                <div className="space-y-4">

                  {/* Pagsasamahin natin yung input fields para text agad, tapos may optional fields */}
                  <textarea
                    value={newEvidence.content}
                    onChange={(e) => setNewEvidence({ ...newEvidence, content: e.target.value })}
                    placeholder="Describe your evidence (Required)"
                    className="w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:border-primary-500 min-h-[100px]"
                  />

                  {/* Optional File/Link attachment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-sm text-gray-500 mb-1">Attach a Link (Optional)</span>
                      <Input
                        placeholder="https://..."
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500 mb-1">Attach a File (Optional)</span>
                      <input
                        type="file"
                        onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)}
                        className="w-full px-4 py-[0.4rem] bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400"
                        accept="image/*,.pdf,.doc,.docx"
                      />
                    </div>
                  </div>

                  {fileToUpload && (
                    <div className="text-sm text-primary-600 dark:text-primary-400 flex items-center gap-2 bg-primary-50 dark:bg-primary-900/10 p-2 rounded">
                      <Paperclip className="w-4 h-4" />
                      {fileToUpload.name} selected
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={submitting || (!newEvidence.content.trim() && !fileToUpload && !linkUrl.trim())}>
                      {submitting ? 'Submitting Evidence...' : 'Submit Evidence'}
                      <Send className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </Card>

          {/* Resolution */}
          {dispute.resolution && (
            <Card>
              <CardHeader title="Resolution" />
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${getStatusColor('resolved')}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      Decision: {dispute.resolution.decision.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm opacity-80">{dispute.resolution.reasoning}</p>
                </div>
                {dispute.resolution.amountToFreelancer !== undefined && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Amount to Freelancer:</span>
                      <span className="text-gray-900 dark:text-white ml-2">{dispute.resolution.amountToFreelancer} ETH</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Amount to Employer:</span>
                      <span className="text-gray-900 dark:text-white ml-2">{dispute.resolution.amountToEmployer} ETH</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-500">
                  Resolved on {format(new Date(dispute.resolution.resolvedAt), 'MMMM d, yyyy')}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parties */}
          <Card>
            <CardHeader title="Parties Involved" />
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-surface">
                <div className="p-2 bg-red-100 dark:bg-red-600/20 rounded-lg">
                  <User className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Initiator</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {dispute.initiatorId === user?.id ? 'You' : partyNames.initiatorName || (dispute.initiatorId ? dispute.initiatorId.slice(0, 8) + '...' : 'Unknown')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-surface">
                <div className="p-2 bg-blue-100 dark:bg-blue-600/20 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Respondent</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {respondentId === user?.id ? 'You' : partyNames.respondentName || (respondentId ? respondentId.slice(0, 8) + '...' : 'Unknown')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader title="Timeline" />
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 bg-primary-500 rounded-full" />
                <div>
                  <p className="text-gray-900 dark:text-white text-sm">Dispute Created</p>
                  <p className="text-xs text-gray-600 dark:text-gray-500">
                    {format(new Date(dispute.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
              {dispute.evidence.map((evidence) => (
                <div key={evidence.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-yellow-500 rounded-full" />
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm">Evidence Submitted</p>
                    <p className="text-xs text-gray-600 dark:text-gray-500">
                      {format(new Date(evidence.submittedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              {dispute.resolution && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-green-500 rounded-full" />
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm">Dispute Resolved</p>
                    <p className="text-xs text-gray-600 dark:text-gray-500">
                      {format(new Date(dispute.resolution.resolvedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <div className="space-y-3">
              <Link to={`/contracts/${dispute.contractId}`}>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                  View Contract
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
