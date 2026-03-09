import { useState, useCallback, useEffect } from 'react';
import { api } from '../../lib/api';
import type { MfaFactor, MfaEnrollResponse } from './types';

export function useMfa() {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch MFA factors on mount
  const fetchFactors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getMFAFactors();
      
      // Map API response to our MfaFactor type
      const mappedFactors: MfaFactor[] = response.factors.map(f => ({
        id: f.id,
        type: 'totp' as const,
        status: f.status === 'verified' ? 'verified' : 'unverified',
        created_at: f.created_at,
      }));
      
      setFactors(mappedFactors);
    } catch (err: any) {
      console.error('Failed to fetch MFA factors:', err);
      setError(err.message || 'Failed to load MFA status');
      setFactors([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactors();
  }, [fetchFactors]);

  const verifiedFactor = factors.find(f => f.status === 'verified') || null;
  const isEnabled = !!verifiedFactor;

  const enroll = useCallback(async (): Promise<MfaEnrollResponse> => {
    try {
      setError(null);
      const response = await api.enrollMFA();
      return response;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to enroll MFA';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const verifyEnrollment = useCallback(async (factorId: string, code: string): Promise<void> => {
    try {
      setIsActing(true);
      setError(null);
      await api.verifyMFAEnrollment(factorId, code);
      // Refresh factors after successful enrollment
      await fetchFactors();
    } catch (err: any) {
      const errorMsg = err.message || 'Invalid verification code';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsActing(false);
    }
  }, [fetchFactors]);

  const disable = useCallback(async (factorId: string, totpCode: string): Promise<void> => {
    try {
      setIsActing(true);
      setError(null);
      await api.disableMFA(factorId, totpCode);
      // Refresh factors after disabling
      await fetchFactors();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to disable MFA';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsActing(false);
    }
  }, [fetchFactors]);

  const createChallenge = useCallback(async (factorId: string): Promise<string> => {
    try {
      setError(null);
      const response = await api.challengeMFA(factorId);
      return response.challengeId;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create MFA challenge';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const verifyChallenge = useCallback(
    async (factorId: string, challengeId: string, code: string): Promise<void> => {
      try {
        setError(null);
        await api.verifyMFAChallenge(factorId, challengeId, code);
      } catch (err: any) {
        const errorMsg = err.message || 'Invalid verification code';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    []
  );

  return {
    factors,
    verifiedFactor,
    isEnabled,
    isLoading,
    isActing,
    error,
    fetchFactors,
    enroll,
    verifyEnrollment,
    disable,
    createChallenge,
    verifyChallenge,
  };
}
