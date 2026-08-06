import type { UserRole } from '@/types';

export function getContractDetailRoute(
  role: Extract<UserRole, 'employer' | 'freelancer'>,
  contractId: string,
): string {
  return `/dashboard/${role}/contracts/${contractId}`;
}
