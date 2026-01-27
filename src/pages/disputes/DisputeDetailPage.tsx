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
import type { Dispute, Evidence, SubmitEvidenceInput } from '../../types';
import { format } from 'date-fns';
import { useAuthStore } from '../../store';

export function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newEvidence, setNewEvidence] = useState<SubmitEvidenceInput>({
    type: 'text',
    content: '',
  });
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchDispute = async () => {
      if (!id) return;
      try {
        const data = await api.getDispute(id);
        setDispute(data);
      } catch (error) {
        console.error('Error fetching dispute:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDispute();
  }, [id]);

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newEvidence.content.trim()) return;

    setSubmitting(true);
    try {
      const updated = await api.submitEvidence(id, newEvidence);
      setDispute(updated);
      setNewEvidence({ type: 'text', content: '' });
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
        <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white">Dispute not found</h2>
        <p className="text-gray-400 mt-2">The dispute you're looking for doesn't exist or has been removed.</p>
        <Link to="/disputes">
          <Button className="mt-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Disputes
          </Button>
        </Link>
      </div>
    );
  }

  const isParticipant = user?.id === dispute.initiatorId || user?.id === dispute.respondentId;
  const canSubmitEvidence = isParticipant && dispute.status !== 'resolved';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/disputes" className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              Dispute #{dispute.id.slice(0, 8)}
            </h1>
            <StatusBadge status={dispute.status} />
          </div>
          <p className="text-gray-400 mt-1">
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
                <h4 className="text-sm text-gray-400 mb-1">Reason</h4>
                <p className="text-white">{dispute.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-gray-400 mb-1">Contract ID</h4>
                  <Link
                    to={`/contracts/${dispute.contractId}`}
                    className="text-primary-400 hover:text-primary-300"
                  >
                    {dispute.contractId.slice(0, 12)}...
                  </Link>
                </div>
                {dispute.milestoneId && (
                  <div>
                    <h4 className="text-sm text-gray-400 mb-1">Milestone ID</h4>
                    <span className="text-white">{dispute.milestoneId.slice(0, 12)}...</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Evidence */}
          <Card>
            <CardHeader title="Evidence Submitted" />
            {dispute.evidence.length === 0 ? (
              <p className="text-gray-400">No evidence has been submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {dispute.evidence.map((evidence: Evidence) => (
                  <div
                    key={evidence.id}
                    className={`p-4 rounded-lg border ${evidence.submitterId === user?.id
                        ? 'border-primary-500/50 bg-primary-900/20'
                        : 'border-dark-border bg-dark-surface'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEvidenceIcon(evidence.type)}
                        <span className={`text-sm px-2 py-0.5 rounded ${evidence.type === 'file'
                            ? 'bg-blue-600/20 text-blue-400'
                            : evidence.type === 'link'
                              ? 'bg-purple-600/20 text-purple-400'
                              : 'bg-gray-600/20 text-gray-400'
                          }`}>
                          {evidence.type}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {evidence.submitterId === user?.id ? 'You' : 'Other Party'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(evidence.submittedAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-white">{evidence.content}</p>
                    {evidence.fileUrl && (
                      <a
                        href={evidence.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1 mt-2"
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
              <form onSubmit={handleSubmitEvidence} className="mt-6 pt-6 border-t border-dark-border">
                <h4 className="text-white font-medium mb-4">Submit New Evidence</h4>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {(['text', 'file', 'link'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewEvidence({ ...newEvidence, type })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${newEvidence.type === type
                            ? 'bg-primary-600 text-white'
                            : 'bg-dark-surface text-gray-400 hover:text-white'
                          }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newEvidence.content}
                    onChange={(e) => setNewEvidence({ ...newEvidence, content: e.target.value })}
                    placeholder="Describe your evidence..."
                    className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-primary-500 min-h-[100px]"
                  />
                  {newEvidence.type === 'link' && (
                    <Input
                      placeholder="Enter URL..."
                      value={newEvidence.fileUrl || ''}
                      onChange={(e) => setNewEvidence({ ...newEvidence, fileUrl: e.target.value })}
                    />
                  )}
                  <Button type="submit" disabled={submitting || !newEvidence.content.trim()}>
                    {submitting ? 'Submitting...' : 'Submit Evidence'}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
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
                      <span className="text-gray-400">Amount to Freelancer:</span>
                      <span className="text-white ml-2">{dispute.resolution.amountToFreelancer} ETH</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Amount to Employer:</span>
                      <span className="text-white ml-2">{dispute.resolution.amountToEmployer} ETH</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500">
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
              <div className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface">
                <div className="p-2 bg-red-600/20 rounded-lg">
                  <User className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Initiator</p>
                  <p className="text-white font-medium">
                    {dispute.initiatorId === user?.id ? 'You' : dispute.initiatorId.slice(0, 8) + '...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-dark-surface">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Respondent</p>
                  <p className="text-white font-medium">
                    {dispute.respondentId === user?.id ? 'You' : dispute.respondentId.slice(0, 8) + '...'}
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
                  <p className="text-white text-sm">Dispute Created</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(dispute.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
              {dispute.evidence.map((evidence) => (
                <div key={evidence.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-yellow-500 rounded-full" />
                  <div>
                    <p className="text-white text-sm">Evidence Submitted</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(evidence.submittedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              {dispute.resolution && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 bg-green-500 rounded-full" />
                  <div>
                    <p className="text-white text-sm">Dispute Resolved</p>
                    <p className="text-xs text-gray-500">
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
                  <FileText className="w-4 h-4 mr-2" />
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
