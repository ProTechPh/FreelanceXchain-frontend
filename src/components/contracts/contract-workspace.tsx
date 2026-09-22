'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reportFailure } from '@/lib/report-failure';
import {
  contractsApi,
  milestonesApi,
  paymentsApi,
  refundsApi,
  reviewsApi,
  rushUpgradesApi,
  transactionsApi,
} from '@/lib/api';
import {
  getContractPermissions,
  normalizeMilestone,
} from '@/lib/contract-workflow';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { useRateApp } from '@/components/feedback/rate-app-provider';
import { hasApprovedKyc } from '@/lib/kyc-eligibility';
import { AttachmentPreviewDialog, type AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';
import { validateReviewDraft, type ReviewDraft } from '@/lib/review-form';
import { validateDocumentFiles } from '@/lib/file-validation';
import { useAuthStore } from '@/stores/authStore';
import type {
  Contract,
  ContractFundInfo,
  ContractPaymentStatus,
  Dispute,
  Milestone,
  RefundRequest,
  RushUpgradeRequest,
  Transaction,
  UserRole,
} from '@/types';
import { ContractNegotiationPanel } from '@/components/contracts/contract-negotiation-panel';
import { Card, CardContent } from '@/components/ui/card';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import { ContractPaymentHistory } from '@/components/contracts/contract-payment-history';
import { ContractWorkspaceHeader } from './workspace/contract-workspace-header';
import { ContractOverviewCard } from './workspace/contract-overview-card';
import { ContractFundingCards } from './workspace/contract-funding-cards';
import { ContractReviewCard } from './workspace/contract-review-card';
import { MilestoneListCard } from './workspace/milestone-list-card';
import { ContractHistoryCard } from './workspace/contract-history-card';
import { ContractWorkspaceDialogs } from './workspace/contract-workspace-dialogs';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;

const initialReview: ReviewDraft = {
  rating: 5,
  comment: '',
  workQuality: 5,
  communication: 5,
  professionalism: 5,
  wouldWorkAgain: true,
};

export function ContractWorkspace({
  contractId,
  role,
}: {
  contractId: string;
  role: ParticipantRole;
}) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [contract, setContract] = useState<Contract | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [rushRequests, setRushRequests] = useState<RushUpgradeRequest[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [fundInfo, setFundInfo] = useState<ContractFundInfo | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<ContractPaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [reviewEligibility, setReviewEligibility] = useState<{ canRate: boolean; reason?: string } | null>(null);
  const [review, setReview] = useState<ReviewDraft>(initialReview);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewTarget | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [approvingMilestone, setApprovingMilestone] = useState<Milestone | null>(null);
  const { requestRatingPrompt } = useRateApp();

  const loadWorkspace = useCallback(async () => {
    try {
      const contractResponse = await contractsApi.get(contractId);
      const loadedContract = contractResponse.data;
      setContract(loadedContract);

      const [
        milestoneResult,
        transactionResult,
        disputeResult,
        rushResult,
        refundResult,
        paymentResult,
        fundInfoResult,
      ] = await Promise.allSettled([
        milestonesApi.listForContract(contractId),
        transactionsApi.getForContract(contractId),
        contractsApi.getDisputes(contractId),
        rushUpgradesApi.list(contractId),
        refundsApi.list(contractId),
        paymentsApi.getStatus(contractId),
        role === 'employer' ? contractsApi.getFundInfo(contractId) : Promise.resolve(null),
      ]);

      const rawMilestones =
        milestoneResult.status === 'fulfilled'
          ? milestoneResult.value.data
          : loadedContract.milestones ?? [];
      setMilestones(rawMilestones.map(normalizeMilestone));
      setTransactions(transactionResult.status === 'fulfilled' ? transactionResult.value.data : []);
      setDisputes(disputeResult.status === 'fulfilled' ? disputeResult.value.data : []);
      setRushRequests(rushResult.status === 'fulfilled' ? rushResult.value.data : []);
      setRefunds(refundResult.status === 'fulfilled' ? refundResult.value.data : []);
      setPaymentStatus(paymentResult.status === 'fulfilled' ? paymentResult.value.data : null);
      setFundInfo(
        fundInfoResult.status === 'fulfilled' && fundInfoResult.value
          ? fundInfoResult.value.data
          : null,
      );

      if (loadedContract.status === 'completed') {
        // The contract is completed inside the *employer's* approval request,
        // so the freelancer has no client event to hang a prompt on. Asking on
        // arrival covers them; the once-per-event rule makes it safe to call
        // on every load.
        requestRatingPrompt('contract_completed', loadedContract.id);

        const rateeId = role === 'employer' ? loadedContract.freelancerId : loadedContract.employerId;
        try {
          const { data } = await reviewsApi.canReview(loadedContract.id, rateeId);
          setReviewEligibility(data);
        } catch {
          setReviewEligibility(null);
        }
      } else {
        setReviewEligibility(null);
      }
    } catch (error) {
      reportFailure(error, 'load this contract');
    } finally {
      setLoading(false);
    }
  }, [contractId, role, requestRatingPrompt]);

  useEffect(() => {
    // The workspace state is populated from authenticated backend resources after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadWorkspace();
  }, [loadWorkspace]);

  if (loading) {
    return <DetailSkeleton label="Loading contract" />;
  }

  if (!contract || !user) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Contract unavailable.
        </CardContent>
      </Card>
    );
  }

  const contractPermissions = getContractPermissions(contract.status, role, user.kycStatus);
  const isVerified = hasApprovedKyc(user.kycStatus);

  // Returns what the action resolved to (undefined when it failed), so a
  // caller can react to the outcome — milestone approval needs to know whether
  // that approval also finished the contract.
  const runAction = async <T,>(id: string, action: () => Promise<T>, success: string): Promise<T | undefined> => {
    setActionId(id);
    try {
      const result = await action();
      toast.success(success);
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      await loadWorkspace();
      return result;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Couldn\'t complete this action. Try again.'));
      return undefined;
    } finally {
      setActionId(null);
    }
  };

  const handleFundContract = async () => {
    setActionId('fund');
    try {
      await contractsApi.fund(contract.id);
      toast.success('Contract funded and activated.');
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      await loadWorkspace();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Couldn\'t complete the transaction. Your wallet balance is unchanged — try again.'));
    } finally {
      setActionId(null);
    }
  };

  const submitMilestone = (milestone: Milestone) => {
    const selectedFiles = files[milestone.id] ?? [];
    if (selectedFiles.length === 0) {
      toast.error('Add at least one deliverable file before submitting this milestone.');
      return;
    }
    const fileError = validateDocumentFiles(selectedFiles);
    if (fileError) {
      toast.error(fileError);
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('files', file));
    formData.append('notes', notes[milestone.id] ?? '');
    void runAction(
      milestone.id,
      () => milestonesApi.submitWithFiles(milestone.id, formData),
      'Milestone submitted for review.',
    );
  };

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateReviewDraft(review);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setActionId('review');
    try {
      await reviewsApi.submit({ ...review, contractId: contract.id, comment: review.comment.trim() });
      setReviewEligibility({ canRate: false, reason: 'You have reviewed this contract.' });
      setReview(initialReview);
      toast.success('Review submitted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Couldn\'t submit your review. Try again.'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ContractWorkspaceHeader contract={contract} role={role} />

      <ContractOverviewCard
        contract={contract}
        role={role}
        isVerified={isVerified}
        hasWallet={Boolean(user.walletAddress)}
        canFund={contractPermissions.canFund}
        canCancel={contractPermissions.canCancel}
        actionId={actionId}
        onFundContract={() => void handleFundContract()}
        onOpenCancelModal={() => setConfirmCancelOpen(true)}
      />

      <ContractFundingCards
        contract={contract}
        role={role}
        paymentStatus={paymentStatus}
        fundInfo={fundInfo}
      />

      <ContractNegotiationPanel
        contract={contract}
        role={role}
        currentUserId={user.id}
        kycStatus={user.kycStatus}
        rushRequests={rushRequests}
        refunds={refunds}
        onRefresh={loadWorkspace}
      />

      {contract.status === 'completed' && reviewEligibility && (
        <ContractReviewCard
          reviewEligibility={reviewEligibility}
          isVerified={isVerified}
          review={review}
          actionId={actionId}
          onReviewChange={setReview}
          onSubmitReview={submitReview}
        />
      )}

      <MilestoneListCard
        milestones={milestones}
        role={role}
        kycStatus={user.kycStatus}
        contractStatus={contract.status}
        actionId={actionId}
        notes={notes}
        rejectionReasons={rejectionReasons}
        onFilesChange={(id, f) => setFiles((curr) => ({ ...curr, [id]: f }))}
        onNotesChange={(id, n) => setNotes((curr) => ({ ...curr, [id]: n }))}
        onRejectionReasonChange={(id, r) => setRejectionReasons((curr) => ({ ...curr, [id]: r }))}
        onSubmitMilestone={submitMilestone}
        onApproveMilestone={setApprovingMilestone}
        onRejectMilestone={(milestoneId) => {
          const reason = rejectionReasons[milestoneId];
          if (!reason) return;
          void runAction(
            milestoneId,
            () => milestonesApi.reject(milestoneId, reason),
            'Revision requested.',
          );
        }}
        onPreviewAttachment={setPreviewAttachment}
      />

      <ContractPaymentHistory contractId={contractId} userId={user.id} />

      <ContractHistoryCard
        contractId={contract.id}
        role={role}
        transactions={transactions}
        disputes={disputes}
      />

      <AttachmentPreviewDialog
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
        attachment={previewAttachment}
      />

      <ContractWorkspaceDialogs
        cancelModalOpen={confirmCancelOpen}
        onCancelModalChange={setConfirmCancelOpen}
        approvingMilestone={approvingMilestone}
        onApprovingMilestoneChange={setApprovingMilestone}
        actionId={actionId}
        onConfirmCancel={async () => {
          await runAction('cancel', () => contractsApi.cancel(contract.id), 'Contract cancelled.');
          setConfirmCancelOpen(false);
        }}
        onConfirmApproveMilestone={async () => {
          if (!approvingMilestone) return;
          const id = approvingMilestone.id;
          const result = await runAction(
            id,
            () => milestonesApi.approve(id),
            'Milestone approved and payment released.',
          );
          setApprovingMilestone(null);

          // The last approval releases the final payment and closes the
          // contract in the same request, so the response decides which of the
          // two moments this actually was.
          if (result) {
            const completed = result.data.contractCompleted;
            requestRatingPrompt(
              completed ? 'contract_completed' : 'milestone_released',
              completed ? contract.id : id,
            );
          }
        }}
      />
    </div>
  );
}
