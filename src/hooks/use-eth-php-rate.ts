'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  convertEthToPhp as pureConvertEthToPhp,
  formatEthToPhp as pureFormatEthToPhp,
  formatEthWithPhp as pureFormatEthWithPhp,
  convertPhpToEth as pureConvertPhpToEth,
  formatPhpToEth as pureFormatPhpToEth,
  DEFAULT_FALLBACK_ETH_PHP,
} from '@/lib/eth-php-converter';

interface EthPhpRateState {
  rate: number;
  isLoading: boolean;
  lastUpdated: Date | null;
  source: string | null;
  error: string | null;
}

// Global shared state across components in the client session
let sharedRate = DEFAULT_FALLBACK_ETH_PHP;
let sharedLastUpdated: Date | null = null;
let sharedSource: string | null = null;
let sharedError: string | null = null;
let isFetching = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

async function fetchEthPhpRate(): Promise<void> {
  if (isFetching) return;
  isFetching = true;
  notifyListeners();

  try {
    const res = await fetch('/api/crypto/eth-php', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch ETH rate (${res.status})`);
    }
    const data = (await res.json()) as { rate?: number; source?: string; updatedAt?: string };
    if (typeof data.rate === 'number' && Number.isFinite(data.rate) && data.rate > 0) {
      sharedRate = data.rate;
      sharedLastUpdated = data.updatedAt ? new Date(data.updatedAt) : new Date();
      sharedSource = data.source || 'live';
      sharedError = null;
    }
  } catch (err) {
    sharedError = err instanceof Error ? err.message : 'Unknown error fetching rate';
    // If we haven't set a lastUpdated yet, set fallback timestamp
    if (!sharedLastUpdated) {
      sharedLastUpdated = new Date();
    }
  } finally {
    isFetching = false;
    notifyListeners();
  }
}

export function useEthPhpRate() {
  const [state, setState] = useState<EthPhpRateState>({
    rate: sharedRate,
    isLoading: isFetching,
    lastUpdated: sharedLastUpdated,
    source: sharedSource,
    error: sharedError,
  });

  useEffect(() => {
    const updateState = () => {
      setState({
        rate: sharedRate,
        isLoading: isFetching,
        lastUpdated: sharedLastUpdated,
        source: sharedSource,
        error: sharedError,
      });
    };

    listeners.add(updateState);

    // Initial fetch if we don't have fresh data
    if (!sharedLastUpdated && !isFetching) {
      void fetchEthPhpRate();
    }

    // Refresh every 60 seconds
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchEthPhpRate();
      }
    }, 60000);

    return () => {
      listeners.delete(updateState);
      clearInterval(interval);
    };
  }, []);

  const convertEthToPhp = useCallback(
    (ethAmount: number | string | null | undefined): number | null => {
      return pureConvertEthToPhp(ethAmount, state.rate);
    },
    [state.rate]
  );

  const formatEthToPhp = useCallback(
    (ethAmount: number | string | null | undefined, options?: { fractionDigits?: number }): string => {
      return pureFormatEthToPhp(ethAmount, state.rate, options);
    },
    [state.rate]
  );

  const formatEthWithPhp = useCallback(
    (
      ethAmount: number | string | null | undefined,
      options?: { fractionDigitsEth?: number; fractionDigitsPhp?: number }
    ): string => {
      return pureFormatEthWithPhp(ethAmount, state.rate, options);
    },
    [state.rate]
  );

  const convertPhpToEth = useCallback(
    (phpAmount: number | string | null | undefined): number | null => {
      return pureConvertPhpToEth(phpAmount, state.rate);
    },
    [state.rate]
  );

  const formatPhpToEth = useCallback(
    (phpAmount: number | string | null | undefined, options?: { fractionDigits?: number }): string => {
      return pureFormatPhpToEth(phpAmount, state.rate, options);
    },
    [state.rate]
  );

  return {
    rate: state.rate,
    isLoading: state.isLoading,
    lastUpdated: state.lastUpdated,
    source: state.source,
    error: state.error,
    refresh: fetchEthPhpRate,
    convertEthToPhp,
    formatEthToPhp,
    formatEthWithPhp,
    convertPhpToEth,
    formatPhpToEth,
  };
}
