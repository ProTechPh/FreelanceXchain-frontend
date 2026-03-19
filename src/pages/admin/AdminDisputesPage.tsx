import { useState, useEffect } from 'react';
import { Card, Button, Badge, Loader, Modal, Input } from '../../components/ui';
import { FiAlertCircle, FiCheckCircle, FiMessageSquare, FiDollarSign, FiUser, FiFilter, FiEye } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import type { Dispute } from '../../types';
import { useToast } from '../../contexts/ToastContext';

// Extended dispute interface with user details
interface DisputeWithDetails extends Dispute {
  projectTitle?: string;
  raisedByName?: string;
  raisedByRole?: 'freelancer' | 'employer';
  againstName?: string;
  againstRole?: 'freelancer' | 'employer';
  evidenceCount?: number;
}

export function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithDetails | null>(null);

  // Resolve modal controls
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveDecision, setResolveDecision] = useState<'freelancer_favor' | 'employer_favor' | 'split'>('split');
  const [resolveReasoning, setResolveReasoning] = useState('');
  const [resolving, setResolving] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      // Fetch real disputes from API
      const response = await api.getDisputes(
        statusFilter !== 'all' ? { status: statusFilter } : undefined
      );

      // Fetch additional details concurrently
      const disputesWithDetails = await Promise.all(response.items.map(async (dispute) => {
        let raisedByName = 'User ' + dispute.initiatorId?.slice(0, 8);
        let againstName = 'Unknown Opponent';
        let raisedByRole: "employer" | "freelancer" = 'freelancer';
        let againstRole: "employer" | "freelancer" = 'employer';

        try {
          const contract = await api.getContract(dispute.contractId).catch(() => null);
          if (contract) {
             const actualRespondentId = dispute.initiatorId === contract.employerId ? contract.freelancerId : contract.employerId;
             const isInitiatorEmployer = dispute.initiatorId === contract.employerId;

             raisedByRole = isInitiatorEmployer ? 'employer' : 'freelancer';
             againstRole = isInitiatorEmployer ? 'freelancer' : 'employer';

             if (isInitiatorEmployer) {
                const employer = await api.getEmployer(dispute.initiatorId).catch(() => null);
                const freelancer = await api.getFreelancer(actualRespondentId).catch(() => null);
                raisedByName = employer?.companyName || employer?.name || employer?.userId?.slice(0, 8) || raisedByName;
                againstName = freelancer?.firstName ? `${freelancer.firstName} ${freelancer.lastName}` : freelancer?.name || freelancer?.userId?.slice(0, 8) || againstName;
             } else {
                const freelancer = await api.getFreelancer(dispute.initiatorId).catch(() => null);
                const employer = await api.getEmployer(actualRespondentId).catch(() => null);
                raisedByName = freelancer?.firstName ? `${freelancer.firstName} ${freelancer.lastName}` : freelancer?.name || freelancer?.userId?.slice(0, 8) || raisedByName;
                againstName = employer?.companyName || employer?.name || employer?.userId?.slice(0, 8) || againstName;
             }
          }
        } catch (e) {
          // Ignore failures and fallback to ID slices
        }

        return {
          ...dispute,
          projectTitle: 'Project #' + (dispute.contractId?.slice(0, 8) || 'Unknown'),
          raisedByName,
          raisedByRole,
          againstName,
          againstRole,
          evidenceCount: Array.isArray(dispute.evidence) ? dispute.evidence.length : 0,
        };
      }));

      setDisputes(disputesWithDetails);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDisputes = statusFilter === 'all'
    ? disputes
    : disputes.filter(d => d.status === statusFilter);

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'resolved': return 'success';
      case 'open': return 'warning';
      case 'under_review': return 'error';
      default: return 'info';
    }
  };

  const handleResolveOpen = (dispute: DisputeWithDetails) => {
    setSelectedDispute(dispute);
    setResolveModalOpen(true);
    setResolveReasoning('');
  };

  const submitResolution = async () => {
    if (!selectedDispute || !resolveReasoning.trim()) return;

    setResolving(true);
    try {
      await api.resolveDispute(selectedDispute.id, {
        decision: resolveDecision,
        reasoning: resolveReasoning
      });

      showToast({
        type: 'success',
        title: 'Dispute Resolved',
        message: 'The dispute block arrangement has been resolved successfully.',
      });

      setResolveModalOpen(false);
      setSelectedDispute(null);
      // Reload logic
      fetchDisputes();
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Failed to Resolve',
        message: e.message || 'An error occurred while resolving.',
      });
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dispute Management</h1>
          <p className="text-gray-400 mt-1">Resolve conflicts between freelancers and employers</p>
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Disputes</p>
                <p className="text-2xl font-bold text-amber-400">
                  {disputes.filter(d => d.status === 'open' || d.status === 'under_review').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <FiAlertCircle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Escalated</p>
                <p className="text-2xl font-bold text-red-400">
                  {disputes.filter(d => d.status === 'under_review').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <FiAlertCircle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Resolved</p>
                <p className="text-2xl font-bold text-green-400">
                  {disputes.filter(d => d.status === 'resolved').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <FiCheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {disputes.length > 0 ? '0 ETH' : '0 ETH'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <FiDollarSign className="w-5 h-5 text-primary-400" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {filteredDisputes.length === 0 ? (
          <Card>
            <div className="p-8 text-center text-gray-400">
              No {statusFilter !== 'all' ? statusFilter : ''} disputes found
            </div>
          </Card>
        ) : (
          filteredDisputes.map((dispute) => (
            <Card key={dispute.id}>
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{dispute.projectTitle}</h3>
                      <Badge variant={getStatusBadgeVariant(dispute.status)}>
                        {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-400">#{dispute.id}</span>
                    </div>
                    
                    <p className="text-gray-300 mb-4">{dispute.reason}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <FiUser className="text-primary-400" />
                        <span>Raised by: <span className="text-gray-900 dark:text-white">{dispute.raisedByName || 'Unknown'}</span> ({dispute.raisedByRole || 'user'})</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <FiUser className="text-red-400" />
                        <span>Against: <span className="text-gray-900 dark:text-white">{dispute.againstName || 'Unknown'}</span> ({dispute.againstRole || 'user'})</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <FiDollarSign className="text-green-400" />
                        <span>Contract: <span className="text-gray-900 dark:text-white">{dispute.contractId?.slice(0, 8) || 'N/A'}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <FiMessageSquare className="text-blue-400" />
                        <span>Evidence Submitted: <span className="text-gray-900 dark:text-white">{dispute.evidenceCount || 0} items</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 min-w-[140px]">
                    <Button
                      variant="outline"
                      onClick={() => handleResolveOpen(dispute)}
                      className="w-full"
                    >
                      <FiEye className="mr-2" /> View Details
                    </Button>
                    {dispute.status !== 'resolved' && (
                      <Button
                        variant="primary"
                        onClick={() => handleResolveOpen(dispute)}
                        className="w-full"
                      >
                        Resolve Dispute
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Detail Modal Placeholder */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => {
          setSelectedDispute(null);
          setResolveModalOpen(false);
          setResolveDecision('split');
          setResolveReasoning('');
        }}>
          <Card className="max-w-3xl w-full mx-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e?.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Dispute Details</h3>
                <button
                  onClick={() => {
                    setSelectedDispute(null);
                    setResolveModalOpen(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <FiAlertCircle className="w-6 h-6" /> {/* Generic close icon substitution */}
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Project</p>
                    <p className="text-gray-900 dark:text-white font-medium truncate" title={selectedDispute.projectTitle}>{selectedDispute.projectTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <Badge variant={getStatusBadgeVariant(selectedDispute.status)}>
                      {selectedDispute.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Contract ID</p>
                    <p className="text-gray-900 dark:text-white font-medium text-xs font-mono">{selectedDispute.contractId?.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Date Raised</p>
                    <p className="text-gray-900 dark:text-white font-medium">{new Date(selectedDispute.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                  <p className="text-sm text-gray-400 mb-2">Reason for Dispute</p>
                  <p className="text-gray-900 dark:text-white text-sm">{selectedDispute.reason}</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-dark-bg p-4 rounded-lg border border-dark-border">
                    <p className="text-sm text-gray-400 mb-2">Initiator</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold">
                        {selectedDispute.raisedByName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white text-sm font-medium">{selectedDispute.raisedByName || 'Unknown'}</p>
                        <p className="text-gray-500 text-xs capitalize">{selectedDispute.raisedByRole || 'user'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-dark-bg p-4 rounded-lg border border-dark-border">
                    <p className="text-sm text-gray-400 mb-2">Respondent</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                        {selectedDispute.againstName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white text-sm font-medium">{selectedDispute.againstName || 'Unknown'}</p>
                        <p className="text-gray-500 text-xs capitalize">{selectedDispute.againstRole || 'user'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {resolveModalOpen && selectedDispute.status !== 'resolved' && (
                  <div className="border border-primary-500/30 bg-primary-500/5 rounded-lg p-5 mt-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resolve Dispute</h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Decision
                        </label>
                        <select
                          value={resolveDecision}
                          onChange={(e) => setResolveDecision(e.target.value as any)}
                          className="w-full px-4 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="split">Split Escrow (50/50)</option>
                          <option value="freelancer_favor">Favor Freelancer (Release Funds)</option>
                          <option value="employer_favor">Favor Employer (Refund Funds)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reasoning (Required)
                        </label>
                        <textarea
                          value={resolveReasoning}
                          onChange={(e) => setResolveReasoning(e.target.value)}
                          placeholder="Provide the reasoning for this administrative decision..."
                          rows={4}
                          className="w-full px-4 py-2 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-border flex flex-col sm:flex-row justify-between items-center gap-4">
                <Link to={`/disputes/${selectedDispute.id}`} className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full">
                    View Full Evidence
                  </Button>
                </Link>

                <div className="flex gap-3 w-full sm:w-auto">
                  <Button variant="ghost" className="flex-1 sm:flex-none" onClick={() => {
                    setSelectedDispute(null);
                    setResolveModalOpen(false);
                  }}>
                    Close
                  </Button>

                  {resolveModalOpen && selectedDispute.status !== 'resolved' && (
                    <Button
                      variant="primary"
                      onClick={submitResolution}
                      disabled={resolving || !resolveReasoning.trim()}
                      className="flex-1 sm:flex-none whitespace-nowrap"
                    >
                      {resolving ? <Loader size="sm" /> : 'Submit Resolution'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
