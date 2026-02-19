import { useState, useCallback } from 'react';
import type { MfaFactor, MfaEnrollResponse } from './types';

// ---------------------------------------------------------------------------
// Static mock data — no API calls
// ---------------------------------------------------------------------------
const MOCK_FACTOR: MfaFactor = {
  id: 'mock-factor-id',
  type: 'totp',
  status: 'verified',
  created_at: new Date().toISOString(),
};

const MOCK_SECRET = 'JBSWY3DPEHPK3PXP';

// QR-like SVG placeholder (three finder-pattern squares + scattered data cells)
const MOCK_QR_CODE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" shape-rendering="crispEdges">'
    + '<rect width="100" height="100" fill="#fff"/>'
    // top-left finder
    + '<rect x="5" y="5" width="30" height="30" fill="#111"/>'
    + '<rect x="10" y="10" width="20" height="20" fill="#fff"/>'
    + '<rect x="15" y="15" width="10" height="10" fill="#111"/>'
    // top-right finder
    + '<rect x="65" y="5" width="30" height="30" fill="#111"/>'
    + '<rect x="70" y="10" width="20" height="20" fill="#fff"/>'
    + '<rect x="75" y="15" width="10" height="10" fill="#111"/>'
    // bottom-left finder
    + '<rect x="5" y="65" width="30" height="30" fill="#111"/>'
    + '<rect x="10" y="70" width="20" height="20" fill="#fff"/>'
    + '<rect x="15" y="75" width="10" height="10" fill="#111"/>'
    // data cells
    + '<rect x="40" y="5" width="5" height="5" fill="#111"/>'
    + '<rect x="50" y="5" width="5" height="5" fill="#111"/>'
    + '<rect x="45" y="15" width="5" height="5" fill="#111"/>'
    + '<rect x="55" y="10" width="5" height="5" fill="#111"/>'
    + '<rect x="5" y="40" width="5" height="5" fill="#111"/>'
    + '<rect x="20" y="40" width="5" height="5" fill="#111"/>'
    + '<rect x="10" y="50" width="5" height="5" fill="#111"/>'
    + '<rect x="25" y="45" width="5" height="5" fill="#111"/>'
    + '<rect x="40" y="40" width="5" height="5" fill="#111"/>'
    + '<rect x="55" y="40" width="5" height="5" fill="#111"/>'
    + '<rect x="70" y="40" width="5" height="5" fill="#111"/>'
    + '<rect x="90" y="40" width="5" height="5" fill="#111"/>'
    + '<rect x="45" y="50" width="5" height="5" fill="#111"/>'
    + '<rect x="80" y="50" width="5" height="5" fill="#111"/>'
    + '<rect x="40" y="60" width="5" height="5" fill="#111"/>'
    + '<rect x="60" y="60" width="5" height="5" fill="#111"/>'
    + '<rect x="80" y="60" width="5" height="5" fill="#111"/>'
    + '<rect x="50" y="70" width="5" height="5" fill="#111"/>'
    + '<rect x="65" y="75" width="5" height="5" fill="#111"/>'
    + '<rect x="85" y="70" width="5" height="5" fill="#111"/>'
    + '<rect x="40" y="80" width="5" height="5" fill="#111"/>'
    + '<rect x="60" y="85" width="5" height="5" fill="#111"/>'
    + '<rect x="75" y="80" width="5" height="5" fill="#111"/>'
    + '<rect x="90" y="90" width="5" height="5" fill="#111"/>'
    + '</svg>'
  );

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useMfa() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const verifiedFactor: MfaFactor | null = isEnabled
    ? { ...MOCK_FACTOR, created_at: new Date().toISOString() }
    : null;

  const enroll = useCallback(async (): Promise<MfaEnrollResponse> => {
    await delay(400);
    return { qrCode: MOCK_QR_CODE, secret: MOCK_SECRET, factorId: MOCK_FACTOR.id };
  }, []);

  const verifyEnrollment = useCallback(async (_factorId: string, _code: string): Promise<void> => {
    setIsActing(true);
    await delay(600);
    setIsEnabled(true);
    setIsActing(false);
  }, []);

  const disable = useCallback(async (_factorId: string): Promise<void> => {
    setIsActing(true);
    await delay(600);
    setIsEnabled(false);
    setIsActing(false);
  }, []);

  const createChallenge = useCallback(async (_factorId: string): Promise<string> => {
    await delay(300);
    return 'mock-challenge-id';
  }, []);

  const verifyChallenge = useCallback(
    async (_factorId: string, _challengeId: string, _code: string): Promise<void> => {
      await delay(600);
    },
    []
  );

  return {
    factors: isEnabled ? [MOCK_FACTOR] : [],
    verifiedFactor,
    isEnabled,
    isLoading: false,
    isActing,
    error: null,
    fetchFactors: async () => {},
    enroll,
    verifyEnrollment,
    disable,
    createChallenge,
    verifyChallenge,
  };
}
