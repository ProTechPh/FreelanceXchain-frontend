import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, Button, PageLoader } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';
import type { Contract, ContractMilestone } from '../../types';

export function CreateDisputePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('contractId') || '';
  const { success: showSuccess, error: showError } = useToast();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchContract = async () => {
      if (!contractId) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getContract(contractId);
        setContract(data);

        // Auto-select if there's only one disputable milestone
        const disputable = (data.milestones || []).filter(
          (m: ContractMilestone) =>
            m.status === 'in_progress' || m.status === 'pending' || m.status === 'submitted'
        );
        if (disputable.length === 1) {
          setSelectedMilestoneId(disputable[0].id);
        }
      } catch (error) {
        console.error('Error fetching contract:', error);
        showError('Failed to load contract details.', 'Error');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [contractId]);

  const disputableMilestones = (contract?.milestones || []).filter(
    (m: ContractMilestone) =>
      m.status === 'in_progress' || m.status === 'pending' || m.status === 'submitted'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMilestoneId) {
      showError('Please select a milestone to dispute.', 'Error');
      return;
    }
    if (!reason.trim()) {
      showError('Please provide a reason for the dispute.', 'Error');
      return;
    }

    setSubmitting(true);
    try {
      const dispute = await api.createDispute({
        contractId,
        milestoneId: selectedMilestoneId,
        reason: reason.trim(),
      });
      showSuccess('Dispute opened successfully.', 'Success');
      navigate(`/disputes/${dispute.id}`);
    } catch (error: any) {
      console.error('Error creating dispute:', error);
      showError(error?.message || 'Failed to open dispute. Please try again.', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!contractId || !contract) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">Contract not found</h3>
        <Button variant="outline" onClick={() => navigate('/contracts')} className="mt-4">
          Back to Contracts
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/contracts/${contractId}`)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Open Dispute</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Contract: {contract.title}
          </p>
        </div>
      </div>

      {/* Warning */}
      <Card className="border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-900/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-medium mb-1">Before opening a dispute</p>
            <p>
              Opening a dispute will pause the selected milestone and notify both parties.
              Consider communicating with the other party first to resolve the issue directly.
            </p>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader title="Dispute Details" />
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Milestone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Milestone to Dispute
            </label>
            {disputableMilestones.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No milestones available for dispute. Only milestones that are pending, in progress, or submitted can be disputed.
              </p>
            ) : (
              <div className="space-y-2">
                {disputableMilestones.map((milestone: ContractMilestone) => (
                  <label
                    key={milestone.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMilestoneId === milestone.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-600/10'
                        : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="milestone"
                      value={milestone.id}
                      checked={selectedMilestoneId === milestone.id}
                      onChange={(e) => setSelectedMilestoneId(e.target.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{milestone.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{milestone.description}</p>
                    </div>
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {milestone.amount} ETH
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Dispute
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              rows={5}
              placeholder="Describe the issue in detail. Include relevant dates, communications, and what resolution you're seeking..."
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Be specific and factual. You can submit evidence after the dispute is opened.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/contracts/${contractId}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={submitting || !selectedMilestoneId || !reason.trim()}
            >
              <AlertTriangle className="w-4 h-4" />
              {submitting ? 'Opening Dispute...' : 'Open Dispute'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
