import { MyPaymentsLedger } from '@/components/payments/my-payments-ledger';
import { PaymentSummaryCards } from '@/components/payments/payment-summary-cards';
import { ParticipantTransactions } from '@/components/transactions/participant-transactions';

export default function FreelancerEarningsPage() {
  return (
    <div className="space-y-6">
      <PaymentSummaryCards show="earnings" />
      <MyPaymentsLedger role="freelancer" />
      <ParticipantTransactions role="freelancer" />
    </div>
  );
}
