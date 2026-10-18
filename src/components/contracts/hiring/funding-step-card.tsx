'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Hourglass, Wallet } from 'lucide-react';
import type { Contract, ContractPartyRole } from '@/types';
import { getFundingCountdown } from '@/lib/contract-lifecycle';
import { formatAmount, formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

/** Signed contract waiting for the escrow: countdown plus the employer's fund action. */
export function FundingStepCard({
  contract,
  role,
  canFund,
  hasWallet,
  funding,
  onFund,
}: {
  contract: Contract;
  role: ContractPartyRole;
  canFund: boolean;
  hasWallet: boolean;
  funding: boolean;
  onFund: () => void;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const countdown = getFundingCountdown(contract.fundingDeadline, now);
  const expired = Boolean(countdown?.expired);

  return (
    <Card className="border-warning-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="size-5 text-primary" aria-hidden="true" />
          {role === 'employer' ? 'Fund the escrow to start the work' : 'Waiting for the client to fund the escrow'}
        </CardTitle>
        <CardDescription>
          Both parties signed. {role === 'employer'
            ? `Deposit ${formatAmount(contract.totalAmount, { currency: 'ETH' })} into the escrow smart contract. Milestone payments are released from it as you approve work.`
            : 'Work starts once the escrow is funded. You will be notified.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {countdown && (
          <p className={`flex items-center gap-2 text-sm font-medium ${countdown.urgent ? 'text-warning' : 'text-foreground'}`}>
            <Hourglass className="size-4" aria-hidden="true" />
            {countdown.label}
            {contract.fundingDeadline && <span className="font-normal text-muted-foreground">(deadline {formatDateTime(contract.fundingDeadline)})</span>}
          </p>
        )}
        {expired && (
          <Alert tone="destructive" title="The funding deadline passed">
            This contract will be cancelled and the hiring slot released.
          </Alert>
        )}
        {role === 'employer' && !expired && (
          <div className="flex flex-wrap gap-2">
            {!hasWallet ? (
              <Button asChild variant="outline">
                <Link href="/dashboard/employer/settings">Connect wallet before funding</Link>
              </Button>
            ) : (
              <Button onClick={onFund} disabled={!canFund} loading={funding} loadingText="Deploying & funding…">
                Fund escrow now
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
