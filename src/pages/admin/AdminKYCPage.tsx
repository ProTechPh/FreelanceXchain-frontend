import { useState, useEffect } from 'react';
import { Card, Button, Badge, Loader } from '../../components/ui';
import { FiCheck, FiX, FiEye, FiFileText, FiUser, FiCalendar, FiFilter } from 'react-icons/fi';
import api from '../../lib/api';
import type { KycVerification } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface AdminKycItem extends KycVerification {
  userEmail?: string;
  userName?: string;
}

export function AdminKYCPage() {
  const [verifications, setVerifications] = useState<AdminKycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedKyc, setSelectedKyc] = useState<AdminKycItem | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      let kycData: KycVerification[] = [];
      
      if (statusFilter === 'all') {
        const [pending, inProgress, completed, approved, rejected] = await Promise.all([
          api.getKycByStatus('pending').catch(() => []),
          api.getKycByStatus('in_progress').catch(() => []),
          api.getKycByStatus('completed').catch(() => []),
          api.getKycByStatus('approved').catch(() => []),
          api.getKycByStatus('rejected').catch(() => []),
        ]);
        kycData = [...pending, ...inProgress, ...completed, ...approved, ...rejected];
      } else {
        kycData = await api.getKycByStatus(statusFilter);
      }

      const kycWithUsers = await Promise.all(
        kycData.map(async (kyc) => {
          try {
            const users = await api.getAdminUsers();
            const user = users.find(u => u.id === kyc.userId);
            return {
              ...kyc,
              userEmail: user?.email,
              userName: user?.name || user?.email.split('@')[0],
            };
          } catch (error) {
            return {
              ...kyc,
              userEmail: 'Unknown',
              userName: 'Unknown',
            };
          }
        })
      );

      setVerifications(kycWithUsers);
    } catch (error) {
      console.error('Error fetching KYC verifications:', error);
      showToast({ message: 'Failed to fetch KYC verifications', type: 'error' });
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending':
      case 'in_progress':
      case 'completed': return 'warning';
      case 'rejected': return 'error';
      default: return 'info';
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.reviewKyc(id, 'approved');
      showToast({ message: 'KYC verification approved successfully', type: 'success' });
      fetchVerifications();
    } catch (error) {
      console.error('Error approving KYC:', error);
      showToast({ message: 'Failed to approve KYC verification', type: 'error' });
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await api.reviewKyc(id, 'rejected', reason);
      showToast({ message: 'KYC verification rejected', type: 'success' });
      fetchVerifications();
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      showToast({ message: 'Failed to reject KYC verification', type: 'error' });
    }
  };

  const handleCardClick = (e?: React.MouseEvent<HTMLDivElement>) => {
    e?.stopPropagation();
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KYC Verification Review</h1>
          <p className="text-gray-400 mt-1">Review and approve user identity verifications</p>
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed (Needs Review)</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Review</p>
                <p className="text-2xl font-bold text-amber-400">
                  {verifications.filter(v => v.status === 'completed').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Approved</p>
                <p className="text-2xl font-bold text-green-400">
                  {verifications.filter(v => v.status === 'approved').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <FiCheck className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Rejected</p>
                <p className="text-2xl font-bold text-red-400">
                  {verifications.filter(v => v.status === 'rejected').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <FiX className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{verifications.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <FiUser className="w-5 h-5 text-primary-400" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {verifications.length === 0 ? (
          <Card>
            <div className="p-8 text-center text-gray-400">
              No {statusFilter !== 'all' ? statusFilter : ''} verifications found
            </div>
          </Card>
        ) : (
          verifications.map((kyc) => (
            <Card key={kyc.id}>
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center">
                      <FiUser className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {kyc.firstName} {kyc.lastName}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(kyc.status)}>
                          {kyc.status.replace('_', ' ').charAt(0).toUpperCase() + kyc.status.replace('_', ' ').slice(1)}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{kyc.userEmail}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiFileText className="w-4 h-4" />
                          {kyc.documentType?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-4 h-4" />
                          Submitted: {new Date(kyc.createdAt).toLocaleDateString()}
                        </span>
                        {kyc.nationality && <span>Nationality: {kyc.nationality}</span>}
                      </div>
                      {kyc.rejectionReason && (
                        <p className="mt-2 text-red-400 text-sm">
                          Rejection reason: {kyc.rejectionReason}
                        </p>
                      )}
                      {kyc.admin_notes && (
                        <p className="mt-2 text-gray-400 text-sm">
                          Admin notes: {kyc.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedKyc(kyc)}
                    >
                      <FiEye className="mr-1" /> View Details
                    </Button>
                    {kyc.status === 'completed' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleApprove(kyc.id)}
                          className="text-green-400 border-green-600 hover:bg-green-600/20"
                        >
                          <FiCheck className="mr-1" /> Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReject(kyc.id)}
                          className="text-red-400 border-red-600 hover:bg-red-600/20"
                        >
                          <FiX className="mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {selectedKyc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedKyc(null)}>
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={handleCardClick}>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">KYC Verification Details</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">User Email:</span>
                    <p className="text-gray-900 dark:text-white">{selectedKyc.userEmail}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">User Name:</span>
                    <p className="text-gray-900 dark:text-white">{selectedKyc.userName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">First Name:</span>
                    <p className="text-gray-900 dark:text-white">{selectedKyc.firstName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Last Name:</span>
                    <p className="text-gray-900 dark:text-white">{selectedKyc.lastName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Status:</span>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(selectedKyc.status)}>
                        {selectedKyc.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Nationality:</span>
                    <p className="text-gray-900 dark:text-white">{selectedKyc.nationality || 'N/A'}</p>
                  </div>
                </div>
                {selectedKyc.dateOfBirth && (
                  <div>
                    <span className="text-gray-400 text-sm">Date of Birth:</span>
                    <p className="text-gray-900 dark:text-white">{new Date(selectedKyc.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-400 text-sm">Document Type:</span>
                  <p className="text-gray-900 dark:text-white">{selectedKyc.documentType || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Submitted:</span>
                    <p className="text-gray-900 dark:text-white">{new Date(selectedKyc.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedKyc.completed_at && (
                    <div>
                      <span className="text-gray-400 text-sm">Completed:</span>
                      <p className="text-gray-900 dark:text-white">{new Date(selectedKyc.completed_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {selectedKyc.rejectionReason && (
                  <div>
                    <span className="text-gray-400 text-sm">Rejection Reason:</span>
                    <p className="text-red-400">{selectedKyc.rejectionReason}</p>
                  </div>
                )}
                {selectedKyc.admin_notes && (
                  <div>
                    <span className="text-gray-400 text-sm">Admin Notes:</span>
                    <p className="text-gray-300">{selectedKyc.admin_notes}</p>
                  </div>
                )}
                {selectedKyc.didit_session_url && (
                  <div>
                    <span className="text-gray-400 text-sm">Didit Session:</span>
                    <a 
                      href={selectedKyc.didit_session_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:underline block"
                    >
                      View Didit Session
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                {selectedKyc.status === 'completed' && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        handleApprove(selectedKyc.id);
                        setSelectedKyc(null);
                      }}
                      className="text-green-400 border-green-600 hover:bg-green-600/20"
                    >
                      <FiCheck className="mr-1" /> Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        handleReject(selectedKyc.id);
                        setSelectedKyc(null);
                      }}
                      className="text-red-400 border-red-600 hover:bg-red-600/20"
                    >
                      <FiX className="mr-1" /> Reject
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setSelectedKyc(null)}>Close</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
