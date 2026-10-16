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
import { useRoleSwitch } from '@/hooks/use-role-switch';
import { getOtherRole, getRoleLabel, isOnRoleSide } from '@/lib/role-switch';
import type { Milestone, UserRole } from '@/types';
import { useContractWorkspace } from '@/hooks/use-contract-workspace';
import { ContractNegotiationPanel } from '@/components/contracts/contract-negotiation-panel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import { ContractPaymentHistory } from '@/components/contracts/contract-payment-history';
import { ContractWorkspaceHeader } from './workspace/contract-workspace-header';
import { ContractOverviewCard } from './workspace/contract-overview-card';
import { ContractFundingCards } from './workspace/contract-funding-cards';
import { ContractReviewCard } from './workspace/contract-review-card';
import { MilestoneListCard } from './workspace/milestone-list-card';
import { ContractHistoryCard } from './workspace/contract-history-card';
import { ContractWorkspaceDialogs } from './workspace/contract-workspace-dialogs';
import { ContractInvoiceDialog } from '@/components/contracts/contract-invoice-dialog';
import { deployEscrowFromWallet, withdrawFromEscrowFromWallet } from '@/lib/wallet';
import { requestWalletProvider } from '@/lib/metamask';
import { Coins, ArrowDownToLine, Loader2 } from 'lucide-react';

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
  disputeId,
}: {
  contractId: string;
  role: ParticipantRole;
  disputeId?: string;
}) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { requestRatingPrompt } = useRateApp();
  const { switchTo, switching } = useRoleSwitch();

  const {
    contract,
    milestones,
    transactions,
    disputes,
    rushRequests,
    refunds,
    fundInfo,
    paymentStatus,
    pendingWithdrawalEth,
    loading,
    reviewEligibility,
    refresh: loadWorkspace,
  } = useContractWorkspace(contractId, role, requestRatingPrompt, disputeId);

  const [actionId, setActionId] = useState<string | null>(null);
  const [withdrawingFunds, setWithdrawingFunds] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [review, setReview] = useState<ReviewDraft>(initialReview);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewTarget | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
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
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
          <p>Contract unavailable or failed to load.</p>
          <Button variant="outline" size="sm" onClick={() => void loadWorkspace()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // One account can be the employer on some contracts and the freelancer on
  // others. A contract from the other side (e.g. a notification link) must not
  // render with this side's actions.
  if (!isOnRoleSide(contract, role, user.id)) {
    const otherRole = getOtherRole(role);
    const otherLabel = getRoleLabel(otherRole).toLowerCase();
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="font-semibold text-foreground">This contract is on your {otherLabel} side</p>
          <p className="max-w-md text-sm text-muted-foreground">
            You&apos;re acting as {role === 'employer' ? 'an' : 'a'} {getRoleLabel(role).toLowerCase()}. Switch to {otherLabel} to work on it.
          </p>
          <Button
            size="sm"
            onClick={() => void switchTo(otherRole, { redirectTo: `/dashboard/${otherRole}/contracts/${contract.id}` })}
            loading={switching === otherRole}
            loadingText="Switching…"
          >
            Switch to {otherLabel}
          </Button>
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
      if (!fundInfo) throw new Error('Contract funding details are unavailable. Refresh and try again.');
      // Every constructor argument must be present: an empty arbiter address would only
      // surface as an opaque encoding failure from the wallet.
      const { freelancerWallet, arbiterWallet, platformWallet } = fundInfo;
      if (!freelancerWallet || !arbiterWallet || !platformWallet) {
        throw new Error('Escrow funding details are incomplete. Refresh and try again.');
      }
      const provider = await requestWalletProvider();
      const deployment = await deployEscrowFromWallet(provider, {
        freelancerWallet,
        arbiterAddress: arbiterWallet,
        platformWallet,
        contractId: fundInfo.contractId,
        milestoneAmounts: fundInfo.milestoneAmounts,
        milestoneDescriptions: fundInfo.milestoneDescriptions,
        totalAmount: fundInfo.totalAmount,
        abi: fundInfo.abi,
        bytecode: fundInfo.bytecode,
        chainId: fundInfo.chainId,
        existingDeployment: fundInfo.existingDeployment,
      });
      await contractsApi.fund(contract.id, deployment);
      toast.success('Contract funded and activated.');
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      await loadWorkspace();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Couldn\'t complete the transaction. Your wallet balance is unchanged — try again.'));
    } finally {
      setActionId(null);
    }
  };

  const handleWithdrawFunds = async () => {
    if (!contract.escrowAddress) {
      toast.error('Escrow address is missing for this contract.');
      return;
    }
    setWithdrawingFunds(true);
    try {
      const provider = await requestWalletProvider();
      await withdrawFromEscrowFromWallet(provider, {
        escrowAddress: contract.escrowAddress,
        chainId: fundInfo?.chainId,
      });
      toast.success(`Successfully claimed and withdrawn ${pendingWithdrawalEth} ETH to your wallet!`);
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      await loadWorkspace();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Failed to withdraw from escrow. Make sure your MetaMask wallet is connected and on the correct network.'
        )
      );
    } finally {
      setWithdrawingFunds(false);
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
      <ContractWorkspaceHeader
        contract={contract}
        role={role}
        onOpenInvoice={() => setInvoiceModalOpen(true)}
      />

      {pendingWithdrawalEth && parseFloat(pendingWithdrawalEth) > 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/10 dark:border-emerald-500/30 dark:bg-emerald-950/20 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Coins className="mt-0.5 size-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                  Escrow Funds Available to Claim
                </p>
                <p className="text-sm text-emerald-800/90 dark:text-emerald-300/90">
                  You have <span className="font-bold text-foreground">{pendingWithdrawalEth} ETH</span> pending in the escrow contract from a dispute resolution or refund. Connect your wallet to claim and withdraw the funds.
                </p>
              </div>
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              disabled={withdrawingFunds}
              onClick={() => void handleWithdrawFunds()}
            >
              {withdrawingFunds ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="mr-2 size-4" />
                  Claim {pendingWithdrawalEth} ETH
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

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
        onOpenInvoice={() => setInvoiceModalOpen(true)}
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
        currency={contract.currency || 'ETH'}
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
        contractStatus={contract.status}
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

      <ContractInvoiceDialog
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        contract={contract}
        milestones={milestones}
        transactions={transactions}
        fundInfo={fundInfo}
      />
    </div>
  );
});
