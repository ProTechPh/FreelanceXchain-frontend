'use client';

import { useParams } from 'next/navigation';
import { TransactionDetail } from '@/components/transactions/transaction-detail';

export default function EmployerTransactionPage() {
  const params = useParams<{ id: string }>();
  return <TransactionDetail transactionId={params?.id ?? ''} role="employer" />;
}
