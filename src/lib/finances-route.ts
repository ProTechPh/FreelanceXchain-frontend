import type { UserRole } from '@/types';

export type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;
export type FinanceTab = 'transactions' | 'invoices' | 'billing';

export function getFinancesRoute(role: ParticipantRole, tab?: FinanceTab): string {
  const base = `/dashboard/${role}/finances`;
  return tab ? `${base}?tab=${tab}` : base;
}
