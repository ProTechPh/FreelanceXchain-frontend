import type { Transaction, UserRole } from '@/types';

export function getSignedTransactionAmount(transaction: Transaction, userId: string) {
  if (transaction.to_user_id === userId) return transaction.amount;
  if (transaction.from_user_id === userId) return -transaction.amount;
  return 0;
}

export function parseTransactionMetadata(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { value: metadata };
    }
  }
  return {};
}

export function getTransactionDetailRoute(
  role: Extract<UserRole, 'employer' | 'freelancer'>,
  transactionId: string,
) {
  return `/dashboard/${role}/transactions/${transactionId}`;
}
