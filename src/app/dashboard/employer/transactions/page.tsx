import { MyPaymentsLedger } from '@/components/payments/my-payments-ledger';
import { PaymentSummaryCards } from '@/components/payments/payment-summary-cards';
import { ParticipantTransactions } from '@/components/transactions/participant-transactions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EmployerTransactionsPage() {
  return (
    <div className="space-y-6">
      <PaymentSummaryCards show="spending" />
      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mb-4">
          <TabsTrigger value="payments">Contract Payments</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>
        <TabsContent value="payments">
          <MyPaymentsLedger role="employer" />
        </TabsContent>
        <TabsContent value="transactions">
          <ParticipantTransactions role="employer" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
