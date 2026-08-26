import type { PaymentHistoryRecord, PaymentType } from '@/types';

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  escrow_deposit: 'Escrow deposit',
  milestone_release: 'Milestone release',
  refund: 'Refund',
  dispute_resolution: 'Dispute resolution',
  rush_fee: 'Rush fee',
};

export function getPaymentTypeLabel(paymentType: string): string {
  return PAYMENT_TYPE_LABELS[paymentType as PaymentType] ?? paymentType;
}

export type PaymentDirection = 'in' | 'out' | 'none';

/**
 * Which way the money moved from the viewer's perspective. A user can appear as
 * neither party (an admin reading someone else's contract — the API allows this),
 * which is 'none' rather than a misleading 'out'.
 */
export function getPaymentDirection(record: PaymentHistoryRecord, userId: string): PaymentDirection {
  if (record.payeeId === userId) return 'in';
  if (record.payerId === userId) return 'out';
  return 'none';
}

export interface PaymentHistorySummary {
  totalIn: number;
  totalOut: number;
  net: number;
  byType: Record<string, number>;
}

/**
 * Totals for a single contract's ledger. Only `completed` payments count toward
 * the money totals — pending/failed rows are still listed in the UI but must not
 * be presented as money that moved. `byType` counts every row regardless of status.
 */
export function summarizePaymentHistory(
  items: PaymentHistoryRecord[],
  userId: string,
): PaymentHistorySummary {
  let totalIn = 0;
  let totalOut = 0;
  const byType: Record<string, number> = {};

  for (const record of items) {
    byType[record.paymentType] = (byType[record.paymentType] ?? 0) + 1;
    if (record.status !== 'completed') continue;
    const direction = getPaymentDirection(record, userId);
    if (direction === 'in') totalIn += record.amount;
    else if (direction === 'out') totalOut += record.amount;
  }

  return { totalIn, totalOut, net: totalIn - totalOut, byType };
}
