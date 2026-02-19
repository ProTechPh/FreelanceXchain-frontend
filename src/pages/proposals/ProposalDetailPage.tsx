import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  DollarSign, 
  Clock, 
  User,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Mail
} from 'lucide-react';
import { Card, CardHeader, Button, StatusBadge, PageLoader } from '../../components/ui';
import { useAuthStore } from '../../store';
import api from '../../lib/api';
import type { Proposal } from '../../types';
import { format } from 'date-fns';

export function ProposalDetailPage() {
  const { projectId, proposalId } = useParams<{ projectId: string; proposalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposal = async () => {
      if (!proposalId) return;
      try {
        const data = await api.getProposal(proposalId);
        setProposal(data);
      } catch (error) {
        console.error('Error fetching proposal:', error);
        navigate(`/projects/${projectId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [proposalId, projectId, navigate]);

  const handleAccept = async () => {
    if (!proposalId) return;
    try {
      await api.acceptProposal(proposalId);
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error accepting proposal:', error);
    }
  };

  const handleReject = async () => {
    if (!proposalId) return;
    try {
      await api.rejectProposal(proposalId);
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error rejecting proposal:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-gray-900 dark:text-white">Proposal not found</h2>
        <Link to={`/projects/${projectId}`}>
          <Button variant="outline" className="mt-4">Back to Project</Button>
        </Link>
      </div>
    );
  }

  const isEmployer = user?.role === 'employer';
  const canTakeAction = isEmployer && proposal.status === 'pending';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/projects/${projectId}`}>
            <Button variant="ghost">
              <ArrowLeft className="w-5 h-5" />
              Back to Project
            </Button>
          </Link>
        </div>
        <StatusBadge status={proposal.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Freelancer Info */}
          <Card>
            <CardHeader title="Freelancer Information" />
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-600/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {proposal.freelancer?.name || 'Freelancer'}
                </h3>
                {(proposal.freelancer as any)?.email && (
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {(proposal.freelancer as any).email}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Cover Letter */}
          {proposal.coverLetter && (
            <Card>
              <CardHeader title="Cover Letter" />
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{proposal.coverLetter}</p>
              </div>
            </Card>
          )}

          {/* Attachments */}
          {proposal.attachments && proposal.attachments.length > 0 && (
            <Card>
              <CardHeader 
                title="Attachments" 
                description={`${proposal.attachments.length} file${proposal.attachments.length > 1 ? 's' : ''} attached`}
              />
              <ul className="space-y-2">
                {proposal.attachments.map((attachment, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-dark-border/30 border border-gray-200 dark:border-dark-border rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                          {attachment.filename}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatBytes(attachment.size || 0)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium flex-shrink-0"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Actions */}
          {canTakeAction && (
            <Card>
              <CardHeader title="Actions" description="Review and respond to this proposal" />
              <div className="flex gap-3">
                <Button onClick={handleAccept} className="flex-1">
                  <CheckCircle className="w-4 h-4" />
                  Accept Proposal
                </Button>
                <Button onClick={handleReject} variant="outline" className="flex-1">
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Proposal Details */}
          <Card>
            <CardHeader title="Proposal Details" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Proposed Rate</span>
                <span className="text-gray-900 dark:text-white font-medium flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                  {proposal.proposedRate} ETH
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Duration</span>
                <span className="text-gray-900 dark:text-white flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {proposal.estimatedDuration} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Submitted</span>
                <span className="text-gray-900 dark:text-white flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {proposal.createdAt
                    ? format(new Date(proposal.createdAt), 'MMM d, yyyy')
                    : 'Recently'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
