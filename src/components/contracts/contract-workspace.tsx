'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contractsApi, milestonesApi, reviewsApi } from '@/lib/api';
import { getContractPermissions } from '@/lib/contract-workflow';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { useRateApp } from '@/components/feedback/rate-app-provider';
import { hasApprovedKyc } from '@/lib/kyc-eligibility';
import { AttachmentPreviewDialog, type AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';
import { validateReviewDraft, type ReviewDraft } from '@/lib/review-form';
import { validateDocumentFiles } from '@/lib/file-validation';
import { useAuthStore } from '@/stores/authStore';
import type { Contract, Milestone, UserRole } from '@/types';
import { useContractWorkspace } from '@/hooks/use-contract-workspace';
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

export const ContractWorkspace = React.memo(function ContractWorkspace({
  contractId,
  role,
}: {
  contractId: string;
  role: ParticipantRole;
}) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { requestRatingPrompt } = useRateApp();

  const {
    contract,
    milestones,
    transactions,
    disputes,
    rushRequests,
    refunds,
    fundInfo,
    paymentStatus,
    loading,
    reviewEligibility,
    refresh: loadWorkspace,
  } = useContractWorkspace(contractId, role, requestRatingPrompt);

  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [review, setReview] = useState<ReviewDraft>(initialReview);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewTarget | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [approvingMilestone, setApprovingMilestone] = useState<Milestone | null>(null);
  const [localReviewEligibility, setLocalReviewEligibility] = useState(reviewEligibility);

  React.useEffect(() => {
    setLocalReviewEligibility(reviewEligibility);
  }, [reviewEligibility]);

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
      setLocalReviewEligibility({ canRate: false, reason: 'You have reviewed this contract.' });
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

      {contract.status === 'completed' && localReviewEligibility && (
        <ContractReviewCard
          reviewEligibility={localReviewEligibility}
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
});
