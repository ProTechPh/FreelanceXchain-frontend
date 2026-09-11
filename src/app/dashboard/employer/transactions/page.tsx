import { MyPaymentsLedger } from '@/components/payments/my-payments-ledger';
import { PaymentSummaryCards } from '@/components/payments/payment-summary-cards';
import { ParticipantTransactions } from '@/components/transactions/participant-transactions';

export default function EmployerTransactionsPage() {
  return (
    <div className="space-y-6">
      <PaymentSummaryCards show="spending" />
      <MyPaymentsLedger role="employer" />
      <ParticipantTransactions role="employer" />
    </div>
  );
}
