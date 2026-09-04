import { isDashboardHome, isTourRole } from './onboarding-tour.ts';
import type { KycStatus, UserRole } from '@/types';

export const KYC_REMINDER_STORAGE_PREFIX = 'kyc-reminder-seen';

export interface KycReminderInput {
  authHasHydrated: boolean;
  isAuthenticated: boolean;
  userId: string | undefined | null;
  role: UserRole | undefined | null;
  emailVerification: boolean | undefined;
  kycStatus: KycStatus | undefined;
  pathname: string | null | undefined;
  seenThisSession: boolean;
}

export function getKycReminderStorageKey(userId: string): string {
  return `${KYC_REMINDER_STORAGE_PREFIX}:${userId}`;
}

export function shouldOfferKycReminder(input: KycReminderInput): boolean {
  if (!input.authHasHydrated || !input.isAuthenticated || !input.userId) return false;
  if (!isTourRole(input.role)) return false;
  if (input.emailVerification === false) return false;
  if (input.kycStatus !== undefined) return false;
  if (input.seenThisSession) return false;
  return isDashboardHome(input.pathname, input.role);
}
