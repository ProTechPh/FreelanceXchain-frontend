'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import type { Contract, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAmount } from '@/lib/format';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;

interface ContractOverviewCardProps {
  contract: Contract;
  role: ParticipantRole;
  isVerified: boolean;
  hasWallet: boolean;
  canFund: boolean;
  canCancel: boolean;
  actionId: string | null;
  onFundContract: () => void;
  onOpenCancelModal: () => void;
}

export function ContractOverviewCard({
  contract,
  role,
  isVerified,
  hasWallet,
  canFund,
  canCancel,
  actionId,
  onFundContract,
  onOpenCancelModal,
}: ContractOverviewCardProps) {
  const verificationPath = `/dashboard/${role}/verification`;

  return (
    <>
      {!isVerified && ['pending', 'active', 'completed'].includes(contract.status) && (
        <Card className="border-warning-border bg-warning-subtle">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm">
              <ShieldCheck className="size-5 text-warning" />
              Your identity isn&apos;t verified yet. Verification is required to fund, cancel, or modify contracts.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href={verificationPath}>Verify identity — takes ~2 min</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Base amount</p>
              <p className="font-semibold">{formatAmount(contract.baseAmount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rush fee</p>
              <p className="font-semibold">{formatAmount(contract.rushFee)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold text-primary">{formatAmount(contract.totalAmount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Escrow</p>
              <p className="truncate font-mono text-xs">{contract.escrowAddress || 'Not funded'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {role === 'employer' && contract.status === 'pending' && !hasWallet && (
              <Button asChild variant="outline">
                <Link href="/dashboard/employer/settings">Connect wallet before funding</Link>
              </Button>
            )}
            {canFund && hasWallet && (
              <Button
                disabled={Boolean(actionId)}
                onClick={onFundContract}
              >
                {actionId === 'fund' ? 'Deploying & Funding…' : 'Fund contract securely'}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                disabled={Boolean(actionId)}
                onClick={onOpenCancelModal}
              >
                Cancel contract
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
