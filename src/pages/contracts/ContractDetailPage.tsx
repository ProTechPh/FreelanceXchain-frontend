import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  Building,
  ExternalLink,
  Star,
  Download,
  RotateCcw,
  X
} from 'lucide-react';
import { Card, CardHeader, Button, PageLoader, StatusBadge } from '../../components/ui';
import { FileUpload } from '../../components/ui/FileUpload';
import { RatingModal } from '../../components/RatingModal';
import { ChatPopup, ChatButton } from '../../components/chat';
import { useAuthStore } from '../../store';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';
import type { Contract, PaymentStatus, ContractMilestone, RefundRequest } from '../../types';
import { format } from 'date-fns';

type MilestoneAttachment = {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
};

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success: showSuccess, error: showError } = useToast();

  const [contract, setContract] = useState<Contract | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [milestoneFiles, setMilestoneFiles] = useState<Record<string, File[]>>({});
  const [milestoneNotes, setMilestoneNotes] = useState<Record<string, string>>({});
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingRefundId, setRejectingRefundId] = useState<string | null>(null);

  const isFreelancer = user?.role === 'freelancer';
  const isEmployer = user?.role === 'employer';
  const freelancerUserId = contract?.freelancer?.userId || contract?.freelancer?.id || contract?.freelancerId;
  const employerUserId = contract?.employer?.userId || contract?.employer?.id || contract?.employerId;
  const otherPartyId = contract
    ? (
      freelancerUserId === user?.id
        ? employerUserId
        : employerUserId === user?.id
          ? freelancerUserId
          : (freelancerUserId || employerUserId)
    )
    : null;

  // Helper function to safely format dates
  const formatDate = (dateString: string | undefined | null, formatStr: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, formatStr);
    } catch {
      return 'Invalid Date';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMilestoneDeliverables = (milestone: ContractMilestone): MilestoneAttachment[] =>
    milestone.deliverableFiles || ((milestone as any).attachments as MilestoneAttachment[] | undefined) || [];

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!contract || !user?.id || !otherPartyId) return;
      
      // Only fetch unread count for active or disputed contracts
      if (contract.status === 'active' || contract.status === 'disputed') {
        try {
          const conversation = await api.findConversationWithUser(otherPartyId);
          if (!conversation) {
            setUnreadCount(0);
            return;
          }

          const count = conversation.participant1_id === user.id
            ? conversation.unread_count_1
            : conversation.unread_count_2;
          setUnreadCount(count);
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      }
    };

    fetchUnreadCount();
    
    // Refresh unread count periodically when chat is closed
    const interval = setInterval(() => {
      if (!isChatOpen) {
        fetchUnreadCount();
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [contract, isChatOpen, otherPartyId, user?.id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;

      try {
        const [contractData, paymentData] = await Promise.all([
          api.getContract(id),
          api.getPaymentStatus(id)
        ]);
        setContract(contractData);
        setPaymentStatus(paymentData);

        // Check if user can rate (only for completed contracts)
        if (contractData.status === 'completed') {
          const rateeId = isFreelancer ? contractData.employerId : contractData.freelancerId;
          try {
            const canRateResponse = await api.canRate(id, rateeId);
            setCanRate(canRateResponse.canRate);
            setHasRated(!canRateResponse.canRate && (canRateResponse.reason?.includes('already rated') ?? false));
          } catch (error) {
            console.error('Error checking rating status:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching contract:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, isFreelancer]);

  // Fetch refund requests for active contracts
  useEffect(() => {
    const fetchRefunds = async () => {
      if (!id || !contract || (contract.status !== 'active' && contract.status !== 'disputed')) return;
      try {
        const data = await api.getContractRefunds(id);
        setRefundRequests(data);
      } catch (error) {
        console.error('Error fetching refund requests:', error);
      }
    };

    fetchRefunds();
  }, [id, contract?.status]);

  const handleSubmitMilestone = async (milestone: ContractMilestone) => {
    if (!id) return;
    const milestoneId = milestone.id;
    const files = milestoneFiles[milestoneId] || [];
    const notes = milestoneNotes[milestoneId] || '';
    const existingDeliverables = getMilestoneDeliverables(milestone);

    if (files.length === 0) {
      showError('Please upload at least one attachment before submitting.', 'Error');
      return;
    }

    setActionLoading(`submit-${milestoneId}`);
    try {
      await api.submitMilestoneWithFiles(milestoneId, files, notes, existingDeliverables);

      const [contractData, paymentData] = await Promise.all([
        api.getContract(id),
        api.getPaymentStatus(id)
      ]);
      setContract(contractData);
      setPaymentStatus(paymentData);

      setMilestoneFiles((prev) => {
        const updated = { ...prev };
        delete updated[milestoneId];
        return updated;
      });
      setMilestoneNotes((prev) => {
        const updated = { ...prev };
        delete updated[milestoneId];
        return updated;
      });

      showSuccess('Milestone submitted successfully!', 'Success');
    } catch (submissionError: any) {
      console.error('Error submitting milestone:', submissionError);
      showError(submissionError?.message || 'Failed to submit milestone', 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    if (!id) return;
    setActionLoading(`approve-${milestoneId}`);
    try {
      await api.approveMilestone(milestoneId, id);
      // Refresh data
      const [contractData, paymentData] = await Promise.all([
        api.getContract(id),
        api.getPaymentStatus(id)
      ]);
      setContract({ ...contractData });
      setPaymentStatus({ ...paymentData });
      showSuccess('Milestone approved and payment released!', 'Success');
    } catch (error: any) {
      console.error('Error approving milestone:', error);
      showError(error?.message || 'Failed to approve milestone. Please try again.', 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisputeMilestone = async (milestoneId: string) => {
    if (!id) return;
    setActionLoading(`dispute-${milestoneId}`);
    try {
      await api.disputeMilestone(id, milestoneId);
      // Navigate to disputes page
      navigate('/disputes');
    } catch (error) {
      console.error('Error disputing milestone:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFundContract = async () => {
    if (!id) return;
    setActionLoading('fund');
    try {
      // Step 1: Get funding info from backend (freelancer wallet, milestone amounts, etc.)
      const fundInfo = await api.getFundInfo(id);

      // Step 2: Deploy escrow contract via MetaMask (employer pays from their wallet)
      const { deployEscrowViaMetaMask } = await import('../../lib/escrow');
      const arbiterAddress = '0x0000000000000000000000000000000000000001';

      const result = await deployEscrowViaMetaMask({
        freelancerAddress: fundInfo.freelancerWallet,
        arbiterAddress,
        platformAddress: fundInfo.platformWallet,
        contractId: fundInfo.contractId,
        milestoneAmounts: fundInfo.milestoneAmounts.map((a: string) => BigInt(a)),
        milestoneDescriptions: fundInfo.milestoneDescriptions,
        totalAmount: BigInt(fundInfo.totalAmount),
      });

      // Step 3: Tell backend the escrow address so it activates the contract
      await api.fundContract(id, result.escrowAddress, result.transactionHash);

      const [contractData, paymentData] = await Promise.all([
        api.getContract(id),
        api.getPaymentStatus(id)
      ]);
      setContract(contractData);
      setPaymentStatus(paymentData);
      showSuccess('Contract funded from your wallet and escrow deployed!', 'Success');
    } catch (error: any) {
      console.error('Error funding contract:', error);
      if (error?.code === 'ACTION_REJECTED' || error?.code === 4001) {
        showError('Transaction rejected in MetaMask.', 'Cancelled');
      } else {
        showError(error?.message || 'Failed to fund contract. Please try again.', 'Error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRefund = async () => {
    if (!id || !refundReason.trim()) return;
    setActionLoading('refund-request');
    try {
      await api.createRefundRequest(id, { reason: refundReason.trim() });
      const data = await api.getContractRefunds(id);
      setRefundRequests(data);
      setShowRefundForm(false);
      setRefundReason('');
      showSuccess('Refund request submitted successfully.', 'Success');
    } catch (error: any) {
      console.error('Error requesting refund:', error);
      showError(error?.message || 'Failed to submit refund request.', 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveRefund = async (refundId: string) => {
    if (!id) return;
    setActionLoading(`approve-refund-${refundId}`);
    try {
      await api.approveRefund(refundId);
      const data = await api.getContractRefunds(id);
      setRefundRequests(data);
      const [contractData, paymentData] = await Promise.all([
        api.getContract(id),
        api.getPaymentStatus(id)
      ]);
      setContract(contractData);
      setPaymentStatus(paymentData);
      showSuccess('Refund approved and processed.', 'Success');
    } catch (error: any) {
      console.error('Error approving refund:', error);
      showError(error?.message || 'Failed to approve refund.', 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRefund = async (refundId: string) => {
    if (!id || !rejectReason.trim()) return;
    setActionLoading(`reject-refund-${refundId}`);
    try {
      await api.rejectRefund(refundId, rejectReason.trim());
      const data = await api.getContractRefunds(id);
      setRefundRequests(data);
      setRejectingRefundId(null);
      setRejectReason('');
      showSuccess('Refund request rejected.', 'Success');
    } catch (error: any) {
      console.error('Error rejecting refund:', error);
      showError(error?.message || 'Failed to reject refund.', 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!id || !contract || !user) return;

    const rateeId = isFreelancer ? contract.employerId : contract.freelancerId;

    await api.submitRating({
      contractId: id,
      rateeId,
      rating,
      comment,
    });

    // Update state
    setHasRated(true);
    setCanRate(false);
  };

  const getMilestoneActions = (milestone: ContractMilestone) => {
    const actions: React.ReactNode[] = [];

    if (isFreelancer && (milestone.status === 'pending' || milestone.status === 'in_progress' || milestone.status === 'rejected')) {
      actions.push(
        <Button
          key="submit"
          size="sm"
          onClick={() => handleSubmitMilestone(milestone)}
          disabled={
            actionLoading === `submit-${milestone.id}` ||
            (milestoneFiles[milestone.id]?.length ?? 0) === 0
          }
        >
          {actionLoading === `submit-${milestone.id}` ? 'Submitting...' : 'Submit for Review'}
        </Button>
      );
    }

    if (isEmployer && milestone.status === 'submitted') {
      actions.push(
        <Button
          key="approve"
          size="sm"
          variant="primary"
          onClick={() => handleApproveMilestone(milestone.id)}
          disabled={actionLoading === `approve-${milestone.id}`}
        >
          {actionLoading === `approve-${milestone.id}` ? 'Approving...' : 'Approve & Release'}
        </Button>,
        <Button
          key="dispute"
          size="sm"
          variant="danger"
          onClick={() => handleDisputeMilestone(milestone.id)}
          disabled={actionLoading === `dispute-${milestone.id}`}
        >
          Dispute
        </Button>
      );
    }

    return actions;
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">Contract not found</h3>
        <Button variant="outline" onClick={() => navigate('/contracts')} className="mt-4">
          Back to Contracts
        </Button>
      </div>
    );
  }

  const completedMilestones = (contract.milestones || []).filter(
    (m: ContractMilestone) => m.status === 'approved'
  ).length;
  const progressPercentage = (contract.milestones || []).length
    ? Math.round((completedMilestones / (contract.milestones || []).length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/contracts')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{contract.title}</h1>
            <StatusBadge status={contract.status} />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{contract.description}</p>
        </div>
        {isEmployer && contract.status === 'pending' && (
          <Button
            variant="primary"
            onClick={handleFundContract}
            disabled={actionLoading === 'fund'}
          >
            <DollarSign className="w-4 h-4" />
            {actionLoading === 'fund' ? 'Funding...' : 'Fund Contract'}
          </Button>
        )}
        {contract.status === 'active' && (
          <Button variant="outline" onClick={() => navigate(`/disputes/new?contractId=${contract.id}`)}>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Open Dispute
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 dark:bg-primary-600/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Value</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{contract.totalAmount} ETH</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-600/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Released</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {paymentStatus?.releasedAmount || 0} ETH
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-600/20 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">In Escrow</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {paymentStatus?.pendingAmount || 0} ETH
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-600/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Progress</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{progressPercentage}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Contract Details */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones */}
          <Card>
            <CardHeader
              title="Milestones"
              description={`${completedMilestones}/${(contract.milestones || []).length} completed`}
            />

            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-2 bg-gray-200 dark:bg-dark-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Milestones list */}
            <div className="space-y-4">
              {(contract.milestones || []).map((milestone: ContractMilestone, index: number) => {
                const existingDeliverables = getMilestoneDeliverables(milestone);
                const isSubmittingMilestone = actionLoading === `submit-${milestone.id}`;
                const canFreelancerSubmit =
                  isFreelancer &&
                  (milestone.status === 'pending' || milestone.status === 'in_progress' || milestone.status === 'rejected');
                const actions = getMilestoneActions(milestone);

                return (
                  <div
                    key={milestone.id}
                    className={`p-4 rounded-lg border ${milestone.status === 'approved'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-600/30'
                        : milestone.status === 'submitted'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-600/30'
                          : milestone.status === 'disputed'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-600/30'
                            : 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${milestone.status === 'approved'
                            ? 'bg-green-600 text-gray-900 dark:text-white'
                            : milestone.status === 'submitted'
                              ? 'bg-yellow-600 text-gray-900 dark:text-white'
                              : milestone.status === 'disputed'
                                ? 'bg-red-600 text-gray-900 dark:text-white'
                                : 'bg-dark-border text-gray-400'
                          }`}>
                          {milestone.status === 'approved' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{milestone.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{milestone.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-primary-600 dark:text-primary-400 font-medium">
                              {milestone.amount} ETH
                            </span>
                            <span className="text-gray-600 dark:text-gray-500">
                              Due: {formatDate(milestone.dueDate, 'MMM d, yyyy')}
                            </span>
                            {existingDeliverables.length > 0 && (
                              <span className="text-blue-600 dark:text-blue-400">
                                {existingDeliverables.length} attachment{existingDeliverables.length === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={milestone.status} />
                      </div>
                    </div>

                    {existingDeliverables.length > 0 && (
                      <div className="mt-4 p-3 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Existing Attachments ({existingDeliverables.length})
                        </p>
                        <div className="space-y-1">
                          {existingDeliverables.map((file, fileIndex) => (
                            <a
                              key={`${file.url}-${fileIndex}`}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              <FileText className="w-3 h-3" />
                              <span className="truncate flex-1">{file.filename}</span>
                              <span className="text-gray-500 dark:text-gray-400">{formatBytes(file.size)}</span>
                              <Download className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {canFreelancerSubmit && (
                      <div className="mt-4 p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Submission</h5>
                        <FileUpload
                          maxFiles={10}
                          maxSizeMB={25}
                          acceptedTypes={[
                            '.pdf', '.doc', '.docx', '.xlsx', '.pptx', '.txt', '.csv',
                            '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
                            '.zip', '.rar', '.7z',
                            '.html', '.css', '.js', '.json', '.xml',
                            '.mp4', '.webm', '.mov'
                          ]}
                          onFilesChange={(files) =>
                            setMilestoneFiles((prev) => ({
                              ...prev,
                              [milestone.id]: files,
                            }))
                          }
                          files={milestoneFiles[milestone.id] || []}
                          disabled={isSubmittingMilestone}
                          label="Attachments"
                          helperText="Max 10 files, 25MB total."
                        />
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Notes (Optional)
                          </label>
                          <textarea
                            value={milestoneNotes[milestone.id] || ''}
                            onChange={(e) =>
                              setMilestoneNotes((prev) => ({
                                ...prev,
                                [milestone.id]: e.target.value,
                              }))
                            }
                            className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                            rows={2}
                            placeholder="Add context for your submission..."
                            disabled={isSubmittingMilestone}
                          />
                        </div>
                      </div>
                    )}

                    {actions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border flex gap-2">
                        {actions}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contract Info */}
          <Card>
            <CardHeader title="Contract Details" />
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(contract.startDate, 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {contract.endDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">End Date</p>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(contract.endDate, 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Escrow Contract</p>
                  {contract.escrowAddress ? (
                    <a
                      href={`https://etherscan.io/address/${contract.escrowAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-mono"
                    >
                      {contract.escrowAddress.slice(0, 6)}...{contract.escrowAddress.slice(-4)}
                    </a>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-500 text-sm">Not deployed</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Parties */}
          <Card>
            <CardHeader title="Parties" />
            <div className="space-y-4">
              {contract.employer && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-600/20 rounded-lg">
                    <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Client</p>
                    <p className="text-gray-900 dark:text-white">{contract.employer.companyName}</p>
                  </div>
                </div>
              )}

              {contract.freelancer && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-600/20 rounded-lg">
                    <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Freelancer</p>
                    <p className="text-gray-900 dark:text-white">{contract.freelancer.name}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <div className="space-y-2">
              <Link to={`/projects/${contract.projectId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  View Project
                </Button>
              </Link>
              {contract.status === 'active' && (
                <Link to={`/disputes/new?contractId=${contract.id}`}>
                  <Button variant="outline" className="w-full justify-start text-red-600 dark:text-red-400 border-red-300 dark:border-red-400/50 hover:bg-red-50 dark:hover:bg-red-400/10">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    Open Dispute
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Refund Escrow Section */}
          {(contract.status === 'active' || contract.status === 'disputed') && (
            <Card>
              <CardHeader title="Refund Escrow" />
              <div className="space-y-3">
                {/* Existing refund requests */}
                {refundRequests.length > 0 && (
                  <div className="space-y-2">
                    {refundRequests.map((refund) => {
                      const isRequester = refund.requested_by === user?.id;
                      const isPending = refund.status === 'pending';
                      return (
                        <div
                          key={refund.id}
                          className={`p-3 rounded-lg border text-sm ${
                            refund.status === 'approved'
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-600/30'
                              : refund.status === 'rejected'
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-600/30'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-600/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {refund.amount} ETH
                            </span>
                            <StatusBadge status={refund.status} />
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                            {refund.reason}
                          </p>
                          {refund.rejection_reason && (
                            <p className="text-red-600 dark:text-red-400 text-xs mb-2">
                              Rejected: {refund.rejection_reason}
                            </p>
                          )}

                          {/* Approve/Reject buttons for the other party */}
                          {isPending && !isRequester && (
                            <div className="space-y-2 mt-2">
                              {rejectingRefundId === refund.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                                    rows={2}
                                    placeholder="Reason for rejection..."
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      onClick={() => handleRejectRefund(refund.id)}
                                      disabled={actionLoading === `reject-refund-${refund.id}` || !rejectReason.trim()}
                                    >
                                      {actionLoading === `reject-refund-${refund.id}` ? 'Rejecting...' : 'Confirm Reject'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => { setRejectingRefundId(null); setRejectReason(''); }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleApproveRefund(refund.id)}
                                    disabled={actionLoading === `approve-refund-${refund.id}`}
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    {actionLoading === `approve-refund-${refund.id}` ? 'Approving...' : 'Approve'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => setRejectingRefundId(refund.id)}
                                  >
                                    <X className="w-3 h-3" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {isPending && isRequester && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Waiting for the other party to respond...
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Request Refund Form */}
                {refundRequests.some(r => r.status === 'pending') ? null : showRefundForm ? (
                  <div className="space-y-3">
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                      rows={3}
                      placeholder="Describe why you're requesting a refund..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleRequestRefund}
                        disabled={actionLoading === 'refund-request' || !refundReason.trim()}
                      >
                        {actionLoading === 'refund-request' ? 'Submitting...' : 'Submit Request'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setShowRefundForm(false); setRefundReason(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-400/10"
                    onClick={() => setShowRefundForm(true)}
                  >
                    <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Request Refund
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Rating Section */}
          {contract.status === 'completed' && (
            <Card>
              <CardHeader title="Rate Your Experience" />
              <div className="space-y-3">
                {hasRated ? (
                  <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-medium">Rating Submitted</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Thank you for rating {isFreelancer ? 'the client' : 'the freelancer'}!
                    </p>
                  </div>
                ) : canRate ? (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Share your experience working with {isFreelancer ? contract.employer?.companyName : contract.freelancer?.name}
                    </p>
                    <Button
                      variant="primary"
                      className="w-full justify-start"
                      onClick={() => setShowRatingModal(true)}
                    >
                      <Star className="w-4 h-4 text-white" />
                      Submit Rating
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Rating not available at this time
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {contract && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          onSubmit={handleSubmitRating}
          rateeName={isFreelancer ? contract.employer?.companyName || 'Client' : contract.freelancer?.name || 'Freelancer'}
          rateeRole={isFreelancer ? 'employer' : 'freelancer'}
        />
      )}

      {/* Chat Components - Only show for active or disputed contracts */}
      {contract && (contract.status === 'active' || contract.status === 'disputed') && (
        <>
          <ChatButton 
            onClick={() => setIsChatOpen(true)}
            unreadCount={unreadCount}
            isOpen={isChatOpen}
          />
          
          <ChatPopup
            contractId={contract.id}
            otherPartyId={otherPartyId || ''}
            otherPartyName={isFreelancer ? contract.employer?.companyName || 'Client' : contract.freelancer?.name || 'Freelancer'}
            otherPartyRole={isFreelancer ? 'Client' : 'Freelancer'}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onMinimize={() => setIsChatMinimized(!isChatMinimized)}
            isMinimized={isChatMinimized}
            onUnreadCountChange={setUnreadCount}
          />
        </>
      )}
    </div>
  );
}
