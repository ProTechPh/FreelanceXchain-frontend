'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEthPhpRate } from './use-eth-php-rate';
import { convertEthToPhp, formatEthToPhp } from '@/lib/eth-php-converter';
import {
  GAS_UNITS,
  DEFAULT_GAS_PRICE_GWEI,
  calculateGasEth,
  computeEmployerTotalCost,
  computeFreelancerNetPayout,
  getMilestoneActionGasFee,
  type EmployerTotalCost,
  type FreelancerNetPayout,
} from '@/lib/gas-fee-estimator';

interface RealGasFeeState {
  gasPriceGwei: number;
  gasPriceWei: string;
  employerGasEth: number;
  freelancerGasEth: number;
  source: string;
  isLoading: boolean;
  lastUpdated: Date | null;
}

// Global shared state for gas fee (defaults to 1 Gwei benchmark for L2 / local EVM)
let sharedGasPriceGwei = DEFAULT_GAS_PRICE_GWEI;
let sharedGasPriceWei = String(BigInt(DEFAULT_GAS_PRICE_GWEI * 1e9));
let sharedEmployerGasEth = (GAS_UNITS.EMPLOYER_DEPLOY_AND_DEPOSIT * DEFAULT_GAS_PRICE_GWEI) / 1e9;
let sharedFreelancerGasEth = (GAS_UNITS.FREELANCER_CLAIM_PAYOUT * DEFAULT_GAS_PRICE_GWEI) / 1e9;
let sharedSource = 'initial';
let sharedLastUpdated: Date | null = null;
let isFetchingGas = false;
const gasListeners = new Set<() => void>();

function notifyGasListeners() {
  gasListeners.forEach((listener) => listener());
}

async function fetchRealGasFee(): Promise<void> {
  if (isFetchingGas) return;
  isFetchingGas = true;
  notifyGasListeners();

  try {
    // Prefer the app's configured chain. A connected wallet may currently be
    // viewing another network and would otherwise produce a misleading quote.
    const res = await fetch('/api/crypto/gas-fee', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as {
        gasPriceGwei?: number;
        gasPriceWei?: string;
        employerGasEth?: number;
        freelancerGasEth?: number;
        source?: string;
      };
      if (typeof data.gasPriceGwei === 'number' && Number.isFinite(data.gasPriceGwei) && data.gasPriceGwei > 0) {
        sharedGasPriceGwei = data.gasPriceGwei;
        sharedGasPriceWei = data.gasPriceWei || String(BigInt(Math.round(data.gasPriceGwei * 1e9)));
        sharedEmployerGasEth = data.employerGasEth ?? calculateGasEth(GAS_UNITS.EMPLOYER_DEPLOY_AND_DEPOSIT, data.gasPriceGwei);
        sharedFreelancerGasEth = data.freelancerGasEth ?? calculateGasEth(GAS_UNITS.FREELANCER_CLAIM_PAYOUT, data.gasPriceGwei);
        sharedSource = data.source || 'rpc';
        sharedLastUpdated = new Date();
        return;
      }
    }

    // Fall back to the connected wallet only when the configured RPC is unavailable.
    if (typeof window !== 'undefined' && window.ethereum?.request) {
      const hexPrice = await window.ethereum.request<string>({ method: 'eth_gasPrice' });
      if (hexPrice && typeof hexPrice === 'string' && hexPrice.startsWith('0x')) {
        const wei = BigInt(hexPrice);
        const gwei = Number(wei) / 1e9;
        sharedGasPriceWei = wei.toString();
        sharedGasPriceGwei = gwei;
        sharedEmployerGasEth = (GAS_UNITS.EMPLOYER_DEPLOY_AND_DEPOSIT * Number(wei)) / 1e18;
        sharedFreelancerGasEth = (GAS_UNITS.FREELANCER_SUBMIT_MILESTONE * Number(wei)) / 1e18;
        sharedSource = 'metamask';
        sharedLastUpdated = new Date();
      }
    }
  } catch {
    // Keep baseline on error
  } finally {
    isFetchingGas = false;
    notifyGasListeners();
  }
}

export function useRealGasFee() {
  const { rate: currentEthRate } = useEthPhpRate();
  const [state, setState] = useState<RealGasFeeState>({
    gasPriceGwei: sharedGasPriceGwei,
    gasPriceWei: sharedGasPriceWei,
    employerGasEth: sharedEmployerGasEth,
    freelancerGasEth: sharedFreelancerGasEth,
    source: sharedSource,
    isLoading: isFetchingGas,
    lastUpdated: sharedLastUpdated,
  });

  useEffect(() => {
    const updateState = () => {
      setState({
        gasPriceGwei: sharedGasPriceGwei,
        gasPriceWei: sharedGasPriceWei,
        employerGasEth: sharedEmployerGasEth,
        freelancerGasEth: sharedFreelancerGasEth,
        source: sharedSource,
        isLoading: isFetchingGas,
        lastUpdated: sharedLastUpdated,
      });
    };

    gasListeners.add(updateState);

    if (!sharedLastUpdated && !isFetchingGas) {
      void fetchRealGasFee();
    }

    // Refresh gas price every 30 seconds
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchRealGasFee();
      }
    }, 30000);

    return () => {
      gasListeners.delete(updateState);
      clearInterval(interval);
    };
  }, []);

  const employerGasPhp = convertEthToPhp(state.employerGasEth, currentEthRate) ?? 0;
  const freelancerGasPhp = convertEthToPhp(state.freelancerGasEth, currentEthRate) ?? 0;

  const getEmployerCost = useCallback(
    (rateEth: number | string | null | undefined): EmployerTotalCost | null => {
      return computeEmployerTotalCost(rateEth, currentEthRate, state.gasPriceGwei);
    },
    [currentEthRate, state.gasPriceGwei]
  );

  const getFreelancerPayout = useCallback(
    (rateEth: number | string | null | undefined, milestoneCount: number = 1): FreelancerNetPayout | null => {
      return computeFreelancerNetPayout(rateEth, currentEthRate, state.gasPriceGwei, milestoneCount);
    },
    [currentEthRate, state.gasPriceGwei]
  );

  return {
    gasPriceGwei: state.gasPriceGwei,
    gasPriceWei: state.gasPriceWei,
    employerGasEth: state.employerGasEth,
    employerGasPhp,
    employerGasFormattedEth: `${state.employerGasEth.toLocaleString('en-US', { maximumFractionDigits: 6 })} ETH`,
    employerGasFormattedPhp: formatEthToPhp(state.employerGasEth, currentEthRate),
    freelancerGasEth: state.freelancerGasEth,
    freelancerGasPhp,
    freelancerGasFormattedEth: `${state.freelancerGasEth.toLocaleString('en-US', { maximumFractionDigits: 6 })} ETH`,
    freelancerGasFormattedPhp: formatEthToPhp(state.freelancerGasEth, currentEthRate),
    source: state.source,
    isLoading: state.isLoading,
    lastUpdated: state.lastUpdated,
    refresh: fetchRealGasFee,
    getEmployerCost,
    getFreelancerPayout,
    getMilestoneActionCost: (action: 'employer-release' | 'freelancer-submit', milestoneCount: number) =>
      getMilestoneActionGasFee(action, milestoneCount, currentEthRate, state.gasPriceGwei),
  };
}
