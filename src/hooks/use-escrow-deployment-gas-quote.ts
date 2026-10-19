'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ContractFundInfo } from '@/types';
import {
  estimateEscrowDeploymentGas,
  readActualTransactionGas,
  type ActualTransactionGas,
  type WalletGasQuote,
} from '@/lib/wallet';

interface DeploymentGasQuoteState {
  quote: WalletGasQuote | null;
  actualGas: ActualTransactionGas | null;
  isLoading: boolean;
  error: string | null;
}

/** Reads a mined fee or refreshes a wallet-RPC deployment simulation without requesting account access. */
export function useEscrowDeploymentGasQuote(fundInfo: ContractFundInfo | null, enabled: boolean) {
  const [state, setState] = useState<DeploymentGasQuoteState>({
    quote: null,
    actualGas: null,
    isLoading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled || !fundInfo || typeof window === 'undefined' || !window.ethereum) {
      setState({ quote: null, actualGas: null, isLoading: false, error: null });
      return;
    }
    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      if (fundInfo.existingDeployment?.transactionHash) {
        const actualGas = await readActualTransactionGas(
          window.ethereum,
          fundInfo.existingDeployment.transactionHash,
          fundInfo.chainId,
        );
        setState({
          quote: null,
          actualGas,
          isLoading: false,
          error: actualGas ? null : 'The deployment receipt is not available yet.',
        });
        return;
      }
      if (!fundInfo.arbiterWallet) {
        setState({ quote: null, actualGas: null, isLoading: false, error: 'Escrow details are incomplete.' });
        return;
      }
      const quote = await estimateEscrowDeploymentGas(window.ethereum, {
        freelancerWallet: fundInfo.freelancerWallet,
        arbiterAddress: fundInfo.arbiterWallet,
        platformWallet: fundInfo.platformWallet,
        contractId: fundInfo.contractId,
        milestoneAmounts: fundInfo.milestoneAmounts,
        milestoneDescriptions: fundInfo.milestoneDescriptions,
        totalAmount: fundInfo.totalAmount,
        abi: fundInfo.abi,
        bytecode: fundInfo.bytecode,
        chainId: fundInfo.chainId,
      });
      setState({ quote, actualGas: null, isLoading: false, error: null });
    } catch (error) {
      setState({
        quote: null,
        actualGas: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Live wallet quote is unavailable.',
      });
    }
  }, [enabled, fundInfo]);

  useEffect(() => {
    if (!enabled) return;
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => void refresh(), 15_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [enabled, refresh]);

  return { ...state, refresh };
}
