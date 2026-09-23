'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  contractsApi,
  milestonesApi,
  transactionsApi,
  rushUpgradesApi,
  refundsApi,
  paymentsApi,
  reviewsApi,
} from '@/lib/api';
import { normalizeMilestone } from '@/lib/contract-workflow';
import { reportFailure } from '@/lib/report-failure';
import type {
  Contract,
  ContractFundInfo,
  ContractPaymentStatus,
  Milestone,
  Transaction,
  Dispute,
  RushUpgradeRequest,
  RefundRequest,
  UserRole,
} from '@/types';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;

interface ContractWorkspaceState {
  contract: Contract | null;
  milestones: Milestone[];
  transactions: Transaction[];
  disputes: Dispute[];
  rushRequests: RushUpgradeRequest[];
  refunds: RefundRequest[];
  fundInfo: ContractFundInfo | null;
  paymentStatus: ContractPaymentStatus | null;
  loading: boolean;
  reviewEligibility: { canRate: boolean; reason?: string } | null;
}

interface ContractWorkspaceActions {
  refresh: () => Promise<void>;
  requestRatingPrompt: (source: string, contextId: string) => void;
}

interface UseContractWorkspaceResult extends ContractWorkspaceState, ContractWorkspaceActions {}

export function useContractWorkspace(
  contractId: string,
  role: ParticipantRole,
  requestRatingPrompt: (source: string, contextId: string) => void,
): UseContractWorkspaceResult {
  const [state, setState] = useState<ContractWorkspaceState>({
    contract: null,
    milestones: [],
    transactions: [],
    disputes: [],
    rushRequests: [],
    refunds: [],
    fundInfo: null,
    paymentStatus: null,
    loading: true,
    reviewEligibility: null,
  });

  const loadWorkspace = useCallback(async () => {
    try {
      const contractResponse = await contractsApi.get(contractId);
      const loadedContract = contractResponse.data;

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

      const newState: ContractWorkspaceState = {
        contract: loadedContract,
        milestones: rawMilestones.map(normalizeMilestone),
        transactions: transactionResult.status === 'fulfilled' ? transactionResult.value.data : [],
        disputes: disputeResult.status === 'fulfilled' ? disputeResult.value.data : [],
        rushRequests: rushResult.status === 'fulfilled' ? rushResult.value.data : [],
        refunds: refundResult.status === 'fulfilled' ? refundResult.value.data : [],
        paymentStatus: paymentResult.status === 'fulfilled' ? paymentResult.value.data : null,
        fundInfo:
          fundInfoResult.status === 'fulfilled' && fundInfoResult.value
            ? fundInfoResult.value.data
            : null,
        loading: false,
        reviewEligibility: null,
      };

      if (loadedContract.status === 'completed') {
        requestRatingPrompt('contract_completed', loadedContract.id);
        const rateeId = role === 'employer' ? loadedContract.freelancerId : loadedContract.employerId;
        try {
          const { data } = await reviewsApi.canReview(loadedContract.id, rateeId);
          newState.reviewEligibility = data;
        } catch {
          newState.reviewEligibility = null;
        }
      }

      setState(newState);
    } catch (error) {
      reportFailure(error, 'load this contract');
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [contractId, role, requestRatingPrompt]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  return {
    ...state,
    refresh: loadWorkspace,
    requestRatingPrompt,
  };
}
