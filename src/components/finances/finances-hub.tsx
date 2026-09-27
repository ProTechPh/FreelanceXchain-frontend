'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Wallet, Receipt, CreditCard } from 'lucide-react';
import type { UserRole } from '@/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PaymentSummaryCards } from '@/components/payments/payment-summary-cards';
import { MyPaymentsLedger } from '@/components/payments/my-payments-ledger';
import { ParticipantTransactions } from '@/components/transactions/participant-transactions';
import { BillingSettings } from '@/components/billing/billing-settings';
import { ContractInvoicesList } from '@/components/finances/contract-invoices-list';

export type FinanceTab = 'transactions' | 'invoices' | 'billing';

export interface FinancesHubProps {
  role: Extract<UserRole, 'employer' | 'freelancer'>;
  defaultTab?: FinanceTab;
}

function FinancesContent({ role, defaultTab = 'transactions' }: FinancesHubProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get('tab') as FinanceTab | null;
  const activeTab: FinanceTab = (tabParam && ['transactions', 'invoices', 'billing'].includes(tabParam))
    ? tabParam
    : defaultTab;

  const handleTabChange = (value: string) => {
    const nextTab = value as FinanceTab;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finances"
        description="Your unified financial hub for milestone payments, blockchain transactions, official invoices, and subscription billing."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
          <TabsTrigger value="transactions" className="gap-2">
            <Wallet className="size-4" />
            <span>{role === 'freelancer' ? 'Earnings & Payouts' : 'Payments & Spending'}</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="size-4" />
            <span>Invoices &amp; SOW</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="size-4" />
            <span>Plan &amp; Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Transactions & Payouts */}
        <TabsContent value="transactions" className="space-y-6">
          <PaymentSummaryCards show={role === 'freelancer' ? 'earnings' : 'spending'} />
          <MyPaymentsLedger role={role} />
          <ParticipantTransactions role={role} />
        </TabsContent>

        {/* Tab 2: Invoices & Receipts */}
        <TabsContent value="invoices" className="space-y-6">
          <ContractInvoicesList role={role} />
        </TabsContent>

        {/* Tab 3: Subscription & Billing */}
        <TabsContent value="billing" className="space-y-6">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function FinancesHub(props: FinancesHubProps) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted/40" />}>
      <FinancesContent {...props} />
    </Suspense>
  );
}
