export interface MfaFactor {
  id: string;
  type: 'totp';
  status: 'verified' | 'unverified';
  created_at: string;
}

export interface MfaEnrollResponse {
  qrCode: string;
  secret: string;
  factorId: string;
}

export interface MfaChallengeResponse {
  challengeId: string;
}

export interface MfaStatus {
  factors: MfaFactor[];
  isEnabled: boolean;
  verifiedFactor: MfaFactor | null;
}
