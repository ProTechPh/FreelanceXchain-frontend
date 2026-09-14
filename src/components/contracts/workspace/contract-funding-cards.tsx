'use client';

import type { Contract, ContractFundInfo, ContractPaymentStatus, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAmount } from '@/lib/format';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;

interface ContractFundingCardsProps {
  contract: Contract;
  role: ParticipantRole;
  paymentStatus: ContractPaymentStatus | null;
  fundInfo: ContractFundInfo | null;
}

export function ContractFundingCards({
  contract,
  role,
  paymentStatus,
  fundInfo,
}: ContractFundingCardsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Payment release status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentStatus ? (
            <>
              <div className="grid grid-cols-1 gap-3 text-sm xs:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{formatAmount(paymentStatus.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Released</p>
                  <p className="font-semibold text-success">{formatAmount(paymentStatus.releasedAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending</p>
                  <p className="font-semibold text-warning">{formatAmount(paymentStatus.pendingAmount)}</p>
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Release progress</span>
                  <span>
                    {paymentStatus.totalAmount > 0
                      ? Math.round((paymentStatus.releasedAmount / paymentStatus.totalAmount) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-success"
                    style={{
                      width: `${paymentStatus.totalAmount > 0 ? Math.min(100, (paymentStatus.releasedAmount / paymentStatus.totalAmount) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {paymentStatus.milestones.length} milestone
                {paymentStatus.milestones.length === 1 ? '' : 's'} tracked by the payment service.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Payment status is temporarily unavailable.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{role === 'employer' ? 'Funding prerequisites' : 'Escrow funding'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {role === 'employer' && fundInfo ? (
            <>
              <div>
                <p className="text-muted-foreground">Freelancer wallet</p>
                <p className="truncate font-mono text-xs">{fundInfo.freelancerWallet}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Platform arbiter</p>
                <p className="truncate font-mono text-xs">{fundInfo.arbiterWallet || 'Configured'}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Funding will prompt MetaMask to deposit {formatAmount(contract.totalAmount)} directly from your
                wallet into the secure smart contract escrow on the blockchain.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">
              {contract.escrowAddress
                ? 'This contract is funded through the secure smart contract escrow shown above.'
                : role === 'employer'
                  ? 'Funding details are unavailable until both participant wallets are ready.'
                  : 'The employer has not funded this contract yet.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
