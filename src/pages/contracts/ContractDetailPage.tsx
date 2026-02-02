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
  Star
} from 'lucide-react';
import { Card, CardHeader, Button, PageLoader, StatusBadge } from '../../components/ui';
import { RatingModal } from '../../components/RatingModal';
import { useAuthStore } from '../../store';
import api from '../../lib/api';
import type { Contract, PaymentStatus, ContractMilestone } from '../../types';
import { format } from 'date-fns';

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [contract, setContract] = useState<Contract | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const isFreelancer = user?.role === 'freelancer';
  const isEmployer = user?.role === 'employer';

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

  const handleSubmitMilestone = async (milestoneId: string) => {
    if (!id) return;
    setActionLoading(`submit-${milestoneId}`);
    try {
      await api.completeMilestone(id, milestoneId);
      // Refresh data
      const contractData = await api.getContract(id);
      setContract(contractData);
    } catch (error) {
      console.error('Error submitting milestone:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    if (!id) return;
    setActionLoading(`approve-${milestoneId}`);
    try {
      await api.approveMilestone(id, milestoneId);
      // Refresh data
      const [contractData, paymentData] = await Promise.all([
        api.getContract(id),
        api.getPaymentStatus(id)
      ]);
      setContract(contractData);
      setPaymentStatus(paymentData);
    } catch (error) {
      console.error('Error approving milestone:', error);
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

    if (isFreelancer && milestone.status === 'pending') {
      actions.push(
        <Button
          key="submit"
          size="sm"
          onClick={() => handleSubmitMilestone(milestone.id)}
          disabled={actionLoading === `submit-${milestone.id}`}
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
        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-400">Contract not found</h3>
        <Button variant="outline" onClick={() => navigate('/contracts')} className="mt-4">
          Back to Contracts
        </Button>
      </div>
    );
  }

  const completedMilestones = contract.milestones.filter(
    (m: ContractMilestone) => m.status === 'approved'
  ).length;
  const progressPercentage = contract.milestones.length
    ? Math.round((completedMilestones / contract.milestones.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/contracts')}
          className="p-2 hover:bg-dark-surface rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{contract.title}</h1>
            <StatusBadge status={contract.status} />
          </div>
          <p className="text-gray-400 mt-1">{contract.description}</p>
        </div>
        {contract.status === 'active' && (
          <Button variant="outline">
            <AlertTriangle className="w-4 h-4" />
            Open Dispute
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-600/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Value</p>
              <p className="text-xl font-bold text-white">{contract.totalAmount} ETH</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Released</p>
              <p className="text-xl font-bold text-white">
                {paymentStatus?.releasedAmount || 0} ETH
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-600/20 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">In Escrow</p>
              <p className="text-xl font-bold text-white">
                {paymentStatus?.pendingAmount || 0} ETH
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Progress</p>
              <p className="text-xl font-bold text-white">{progressPercentage}%</p>
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
              description={`${completedMilestones}/${contract.milestones.length} completed`}
            />

            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Milestones list */}
            <div className="space-y-4">
              {contract.milestones.map((milestone: ContractMilestone, index: number) => (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-lg border ${milestone.status === 'approved'
                      ? 'bg-green-900/20 border-green-600/30'
                      : milestone.status === 'submitted'
                        ? 'bg-yellow-900/20 border-yellow-600/30'
                        : milestone.status === 'disputed'
                          ? 'bg-red-900/20 border-red-600/30'
                          : 'bg-dark-bg border-dark-border'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${milestone.status === 'approved'
                          ? 'bg-green-600 text-white'
                          : milestone.status === 'submitted'
                            ? 'bg-yellow-600 text-white'
                            : milestone.status === 'disputed'
                              ? 'bg-red-600 text-white'
                              : 'bg-dark-border text-gray-400'
                        }`}>
                        {milestone.status === 'approved' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{milestone.title}</h4>
                        <p className="text-sm text-gray-400 mt-1">{milestone.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-primary-400 font-medium">
                            {milestone.amount} ETH
                          </span>
                          <span className="text-gray-500">
                            Due: {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={milestone.status} />
                    </div>
                  </div>

                  {getMilestoneActions(milestone).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dark-border flex gap-2">
                      {getMilestoneActions(milestone)}
                    </div>
                  )}
                </div>
              ))}
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
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Start Date</p>
                  <p className="text-white">
                    {format(new Date(contract.startDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {contract.endDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">End Date</p>
                    <p className="text-white">
                      {format(new Date(contract.endDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Escrow Contract</p>
                  <a
                    href={`https://etherscan.io/address/${contract.escrowAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 text-sm font-mono"
                  >
                    {contract.escrowAddress.slice(0, 6)}...{contract.escrowAddress.slice(-4)}
                  </a>
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
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Building className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Client</p>
                    <p className="text-white">{contract.employer.companyName}</p>
                  </div>
                </div>
              )}

              {contract.freelancer && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <User className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Freelancer</p>
                    <p className="text-white">{contract.freelancer.name}</p>
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
                  <FileText className="w-4 h-4" />
                  View Project
                </Button>
              </Link>
              {contract.status === 'active' && (
                <Link to={`/disputes/new?contractId=${contract.id}`}>
                  <Button variant="outline" className="w-full justify-start text-red-400 border-red-400/50 hover:bg-red-400/10">
                    <AlertTriangle className="w-4 h-4" />
                    Open Dispute
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Rating Section */}
          {contract.status === 'completed' && (
            <Card>
              <CardHeader title="Rate Your Experience" />
              <div className="space-y-3">
                {hasRated ? (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Rating Submitted</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Thank you for rating {isFreelancer ? 'the client' : 'the freelancer'}!
                    </p>
                  </div>
                ) : canRate ? (
                  <>
                    <p className="text-sm text-gray-400">
                      Share your experience working with {isFreelancer ? contract.employer?.companyName : contract.freelancer?.name}
                    </p>
                    <Button
                      variant="primary"
                      className="w-full justify-start"
                      onClick={() => setShowRatingModal(true)}
                    >
                      <Star className="w-4 h-4" />
                      Submit Rating
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <p className="text-sm text-gray-400">
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
    </div>
  );
}
