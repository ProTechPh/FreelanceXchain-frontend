import { useState, useEffect } from 'react';
import { Card, Button, Badge, Loader } from '../../components/ui';
import { FiAlertCircle, FiCheckCircle, FiMessageSquare, FiDollarSign, FiUser, FiFilter, FiEye } from 'react-icons/fi';
import api from '../../lib/api';
import type { Dispute } from '../../types';

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
      
      // The API returns disputes with basic info
      // In a real implementation, you'd fetch additional details (project title, user names, etc.)
      const disputesWithDetails = response.items.map(dispute => ({
        ...dispute,
        projectTitle: 'Project #' + (dispute.contractId?.slice(0, 8) || 'Unknown'),
        raisedByName: 'User ' + (dispute.initiatorId?.slice(0, 8) || 'Unknown'),
        raisedByRole: 'freelancer' as const,
        againstName: 'User (Opponent)',
        againstRole: 'employer' as const,
        evidenceCount: Array.isArray(dispute.evidence) ? dispute.evidence.length : 0,
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

  const handleResolve = (id: string) => {
    console.log('Resolving dispute:', id);
    // Logic to resolve dispute
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
          <h1 className="text-2xl font-bold text-white">Dispute Management</h1>
          <p className="text-gray-400 mt-1">Resolve conflicts between freelancers and employers</p>
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <p className="text-2xl font-bold text-white">
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
                      <h3 className="text-lg font-medium text-white">{dispute.projectTitle}</h3>
                      <Badge variant={getStatusBadgeVariant(dispute.status)}>
                        {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-400">#{dispute.id}</span>
                    </div>
                    
                    <p className="text-gray-300 mb-4">{dispute.reason}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <FiUser className="text-primary-400" />
                        <span>Raised by: <span className="text-white">{dispute.raisedByName || 'Unknown'}</span> ({dispute.raisedByRole || 'user'})</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <FiUser className="text-red-400" />
                        <span>Against: <span className="text-white">{dispute.againstName || 'Unknown'}</span> ({dispute.againstRole || 'user'})</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <FiDollarSign className="text-green-400" />
                        <span>Contract: <span className="text-white">{dispute.contractId?.slice(0, 8) || 'N/A'}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <FiMessageSquare className="text-blue-400" />
                        <span>Evidence Submitted: <span className="text-white">{dispute.evidenceCount || 0} items</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 min-w-[140px]">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedDispute(dispute)}
                      className="w-full"
                    >
                      <FiEye className="mr-2" /> View Details
                    </Button>
                    {dispute.status !== 'resolved' && (
                      <Button 
                        variant="primary"
                        onClick={() => handleResolve(dispute.id)}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedDispute(null)}>
          <Card className="max-w-2xl w-full mx-4" onClick={(e) => e?.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Dispute Details</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Project</p>
                    <p className="text-white font-medium">{selectedDispute.projectTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <Badge variant={getStatusBadgeVariant(selectedDispute.status)}>
                      {selectedDispute.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Disputed Amount</p>
                    <p className="text-white font-medium">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Date Raised</p>
                    <p className="text-white font-medium">{new Date(selectedDispute.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                  <p className="text-sm text-gray-400 mb-2">Reason for Dispute</p>
                  <p className="text-white">{selectedDispute.reason}</p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 bg-dark-bg p-4 rounded-lg border border-dark-border">
                    <p className="text-sm text-gray-400 mb-2">Plaintiff</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
                        {selectedDispute.raisedByName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{selectedDispute.raisedByName || 'Unknown'}</p>
                        <p className="text-gray-500 text-xs capitalize">{selectedDispute.raisedByRole || 'user'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-dark-bg p-4 rounded-lg border border-dark-border">
                    <p className="text-sm text-gray-400 mb-2">Defendant</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                        {selectedDispute.againstName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{selectedDispute.againstName || 'Unknown'}</p>
                        <p className="text-gray-500 text-xs capitalize">{selectedDispute.againstRole || 'user'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setSelectedDispute(null)}>Close</Button>
                <Button variant="primary">View Evidence</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
