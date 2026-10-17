'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEthPhpRate } from './use-eth-php-rate';
import { convertEthToPhp, formatEthToPhp } from '@/lib/eth-php-converter';
import {
  GAS_UNITS,
  calculateGasEth,
  computeEmployerTotalCost,
  computeFreelancerNetPayout,
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

// Global shared state for gas fee
let sharedGasPriceGwei = 20; // 20 Gwei baseline
let sharedGasPriceWei = '20000000000';
let sharedEmployerGasEth = (GAS_UNITS.EMPLOYER_DEPLOY_AND_DEPOSIT * 20) / 1e9;
let sharedFreelancerGasEth = (GAS_UNITS.FREELANCER_CLAIM_PAYOUT * 20) / 1e9;
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
    // 1. Try querying connected wallet provider (MetaMask / Brave / Web3)
    if (typeof window !== 'undefined' && window.ethereum?.request) {
      try {
        const hexPrice = await window.ethereum.request<string>({ method: 'eth_gasPrice' });
        if (hexPrice && typeof hexPrice === 'string' && hexPrice.startsWith('0x')) {
          const wei = BigInt(hexPrice);
          const gwei = Number(wei) / 1e9;
          sharedGasPriceWei = wei.toString();
          sharedGasPriceGwei = gwei;
          sharedEmployerGasEth = (GAS_UNITS.EMPLOYER_DEPLOY_AND_DEPOSIT * Number(wei)) / 1e18;
          sharedFreelancerGasEth = (GAS_UNITS.FREELANCER_CLAIM_PAYOUT * Number(wei)) / 1e18;
          sharedSource = 'metamask';
          sharedLastUpdated = new Date();
          return;
        }
      } catch {
        // Fallback to internal API
      }
    }

    // 2. Fetch from backend RPC endpoint
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
    (rateEth: number | string | null | undefined): FreelancerNetPayout | null => {
      return computeFreelancerNetPayout(rateEth, currentEthRate, state.gasPriceGwei);
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
  };
}
