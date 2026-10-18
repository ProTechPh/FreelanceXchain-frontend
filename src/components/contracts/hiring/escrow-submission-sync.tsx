'use client';

import { useCallback, useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Contract, Milestone } from '@/types';
import { readEscrowMilestone, submitEscrowMilestoneFromWallet, switchToEscrowChain } from '@/lib/wallet';
import { DEFAULT_CHAIN_ID, requestWalletProvider } from '@/lib/metamask';
import { confirmSubmissionOnChain, EscrowActionError } from '@/lib/escrow-milestone-actions';
import { reportFailure } from '@/lib/report-failure';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const walletDeps = {
  read: readEscrowMilestone,
  switchChain: switchToEscrowChain,
  submit: submitEscrowMilestoneFromWallet,
  approve: async () => ({ transactionHash: '' }),
};

/**
 * Freelancer: submitted milestones that the escrow contract still shows as
 * Pending (the platform couldn't submit on their behalf). The payment can't be
 * released until the freelancer confirms the submission from their wallet.
 */
export function EscrowSubmissionSync({ contract, milestones, onSynced }: { contract: Contract; milestones: Milestone[]; onSynced: () => void }) {
  const [pending, setPending] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const escrowAddress = contract.escrowAddress;

  const check = useCallback(async () => {
    if (!escrowAddress || contract.status !== 'active' || typeof window === 'undefined' || !window.ethereum) return [];
    const indexes: number[] = [];
    for (const [index, milestone] of milestones.entries()) {
      if (milestone.status !== 'submitted') continue;
      try {
        const state = await readEscrowMilestone(window.ethereum, escrowAddress, index);
        if (state?.status === 'pending') indexes.push(index);
      } catch {
        // Wrong network or RPC hiccup: nothing to show.
      }
    }
    return indexes;
  }, [escrowAddress, contract.status, milestones]);

  useEffect(() => {
    let active = true;
    void check().then((indexes) => { if (active) setPending(indexes); });
    return () => { active = false; };
  }, [check]);

  if (pending.length === 0 || !escrowAddress) return null;

  const confirm = async () => {
    setBusy(true);
    try {
      const ethereum = await requestWalletProvider();
      for (const milestoneIndex of pending) {
        await confirmSubmissionOnChain(walletDeps, { ethereum, escrowAddress, milestoneIndex, chainId: DEFAULT_CHAIN_ID });
      }
      toast.success('Submission confirmed on the blockchain. The client can now release the payment.');
      setPending(await check());
      onSynced();
    } catch (error) {
      if (error instanceof EscrowActionError) toast.error(error.message);
      else reportFailure(error, 'confirm the submission on the blockchain');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-warning-border bg-warning-subtle">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm">
          <Link2 className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>
            {pending.length === 1 ? 'One submitted milestone isn’t' : `${pending.length} submitted milestones aren’t`} confirmed on the blockchain yet.
            This contract&apos;s escrow was created before the platform could confirm submissions for you, so it needs one
            confirmation from your wallet (a small gas fee) before the client can release the payment.
          </span>
        </p>
        <Button size="sm" className="shrink-0" loading={busy} loadingText="Confirm in MetaMask…" onClick={() => void confirm()}>
          Confirm on blockchain
        </Button>
      </CardContent>
    </Card>
  );
}
