'use client';

import { useMemo, useState } from 'react';
import { BadgeDollarSign, FastForward, HandCoins } from 'lucide-react';
import { toast } from 'sonner';
import { refundsApi, rushUpgradesApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import {
  canActOnRefund,
  canRequestRefund,
  canRequestRushUpgrade,
  canRespondToRushUpgrade,
} from '@/lib/contract-negotiation';
import { StatusBadge } from '@/components/ui/status-badge';
import type { Contract, KycStatus, RefundRequest, RushUpgradeRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ParticipantRole = 'employer' | 'freelancer';

type ContractNegotiationPanelProps = {
  contract: Contract;
  role: ParticipantRole;
  currentUserId: string;
  kycStatus?: KycStatus;
  rushRequests: RushUpgradeRequest[];
  refunds: RefundRequest[];
  onRefresh: () => Promise<void>;
};

export function ContractNegotiationPanel({
  contract,
  role,
  currentUserId,
  kycStatus,
  rushRequests,
  refunds,
  onRefresh,
}: ContractNegotiationPanelProps) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [rushPercentage, setRushPercentage] = useState('');
  const [counterPercentage, setCounterPercentage] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const openRushRequest = useMemo(
    () => rushRequests.find((request) => request.status === 'pending' || request.status === 'counter_offered'),
    [rushRequests],
  );
  const pendingRefund = refunds.find((refund) => refund.status === 'pending');
  const canCreateRush = canRequestRushUpgrade({
    role,
    contractStatus: contract.status,
    rushFee: contract.rushFee,
    kycStatus,
    hasOpenRequest: Boolean(openRushRequest),
  });
  const canCreateRefund = canRequestRefund(contract.status, kycStatus, Boolean(pendingRefund));

  const runAction = async (id: string, action: () => Promise<unknown>, message: string) => {
    setActionId(id);
    try {
      await action();
      toast.success(message);
      await onRefresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to complete this contract request.'));
    } finally {
      setActionId(null);
    }
  };

  const requestRush = () => {
    const percentage = Number(rushPercentage);
    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      toast.error('Enter a rush fee percentage between 0.01 and 100.');
      return;
    }
    void runAction('rush-request', () => rushUpgradesApi.request(contract.id, percentage), 'Rush upgrade requested.');
  };

  const counterRush = (requestId: string) => {
    const percentage = Number(counterPercentage);
    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      toast.error('Enter a counter percentage between 0.01 and 100.');
      return;
    }
    void runAction(`rush-${requestId}`, () => rushUpgradesApi.respond(requestId, 'counter_offer', percentage), 'Counter-offer sent.');
  };

  const requestRefund = () => {
    const reason = refundReason.trim();
    if (!reason) {
      toast.error('Explain why you are requesting a refund.');
      return;
    }
    const amount = refundAmount.trim() ? Number(refundAmount) : undefined;
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      toast.error('Refund amount must be a positive number.');
      return;
    }
    void runAction(
      'refund-request',
      () => refundsApi.request(contract.id, { reason, ...(amount === undefined ? {} : { amount }) }),
      'Refund request submitted.',
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FastForward className="size-5 text-primary" />Rush upgrade</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {contract.rushFee > 0 && <p className="rounded-lg bg-primary/10 p-3 text-sm">A ${contract.rushFee.toLocaleString()} rush fee is active on this contract.</p>}

          {canCreateRush && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="space-y-2"><Label htmlFor="rush-percentage">Proposed rush fee</Label><div className="flex items-center gap-2"><Input id="rush-percentage" type="number" min="0.01" max="100" step="0.01" value={rushPercentage} onChange={(event) => setRushPercentage(event.target.value)} /><span className="text-sm text-muted-foreground">%</span></div></div>
              <Button type="button" disabled={actionId === 'rush-request'} onClick={requestRush}>{actionId === 'rush-request' ? 'Requesting…' : 'Request rush upgrade'}</Button>
            </div>
          )}

          {openRushRequest && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">Open request: {openRushRequest.proposedPercentage}%</p><StatusBadge status={openRushRequest.status} domain="rush" /></div>
              {openRushRequest.counterPercentage !== null && <p className="text-sm text-muted-foreground">Freelancer counter-offer: {openRushRequest.counterPercentage}%</p>}

              {role === 'freelancer' && canRespondToRushUpgrade(role, openRushRequest.status, kycStatus) && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={actionId === `rush-${openRushRequest.id}`} onClick={() => void runAction(`rush-${openRushRequest.id}`, () => rushUpgradesApi.respond(openRushRequest.id, 'accept'), 'Rush upgrade accepted.')}>Accept</Button>
                    <Button type="button" variant="outline" disabled={actionId === `rush-${openRushRequest.id}`} onClick={() => void runAction(`rush-${openRushRequest.id}`, () => rushUpgradesApi.respond(openRushRequest.id, 'decline'), 'Rush upgrade declined.')}>Decline</Button>
                  </div>
                  <div className="flex items-end gap-2"><div className="flex-1 space-y-2"><Label htmlFor={`rush-counter-${openRushRequest.id}`}>Counter percentage</Label><Input id={`rush-counter-${openRushRequest.id}`} type="number" min="0.01" max="100" step="0.01" value={counterPercentage} onChange={(event) => setCounterPercentage(event.target.value)} /></div><Button type="button" variant="secondary" disabled={actionId === `rush-${openRushRequest.id}`} onClick={() => counterRush(openRushRequest.id)}>Counter</Button></div>
                </div>
              )}

              {role === 'employer' && canRespondToRushUpgrade(role, openRushRequest.status, kycStatus) && (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={actionId === `rush-${openRushRequest.id}`} onClick={() => void runAction(`rush-${openRushRequest.id}`, () => rushUpgradesApi.acceptCounter(openRushRequest.id), 'Counter-offer accepted.')}>Accept counter</Button>
                  <Button type="button" variant="outline" disabled={actionId === `rush-${openRushRequest.id}`} onClick={() => void runAction(`rush-${openRushRequest.id}`, () => rushUpgradesApi.declineCounter(openRushRequest.id), 'Counter-offer declined.')}>Decline counter</Button>
                </div>
              )}
            </div>
          )}

          {rushRequests.length === 0 && !canCreateRush && contract.rushFee === 0 && <p className="text-sm text-muted-foreground">Rush negotiation is available to a verified employer while the contract is active.</p>}
          {rushRequests.length > 0 && <ul className="space-y-2 border-t border-border pt-3 text-sm">{rushRequests.map((request) => <li key={request.id} className="flex items-center justify-between gap-3"><span>{new Date(request.createdAt).toLocaleDateString()} · {request.counterPercentage ?? request.proposedPercentage}%</span><Badge variant="secondary">{request.status.replace('_', ' ')}</Badge></li>)}</ul>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><HandCoins className="size-5 text-primary" />Escrow refunds</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {canCreateRefund && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="space-y-2"><Label htmlFor="refund-reason">Reason</Label><Textarea id="refund-reason" rows={3} value={refundReason} onChange={(event) => setRefundReason(event.target.value)} placeholder="Explain why the remaining escrow should be refunded" /></div>
              <div className="space-y-2"><Label htmlFor="refund-amount">Amount (optional)</Label><Input id="refund-amount" type="number" min="0.01" step="0.01" max={contract.totalAmount} value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} placeholder={`Full remaining escrow (up to $${contract.totalAmount})`} /></div>
              <Button type="button" disabled={actionId === 'refund-request'} onClick={requestRefund}><BadgeDollarSign className="mr-2 size-4" />{actionId === 'refund-request' ? 'Submitting…' : 'Request refund'}</Button>
            </div>
          )}

          {refunds.length === 0 && !canCreateRefund && <p className="text-sm text-muted-foreground">No refund requests are available.</p>}
          <ul className="space-y-3">
            {refunds.map((refund) => {
              const canDecide = canActOnRefund({ status: refund.status, requestedBy: refund.requested_by, currentUserId, kycStatus });
              const rejectionReason = rejectionReasons[refund.id] ?? '';
              return (
                <li key={refund.id} className="space-y-3 rounded-lg border border-border p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">${refund.amount.toLocaleString()} {refund.is_partial ? 'partial refund' : 'refund'}</p><p className="mt-1 text-muted-foreground">{refund.reason}</p></div><StatusBadge status={refund.status} domain="refund" /></div>
                  {refund.rejection_reason && <p className="text-destructive">Rejected: {refund.rejection_reason}</p>}
                  {refund.requested_by === currentUserId && refund.status === 'pending' && <p className="text-muted-foreground">Waiting for the other participant to respond.</p>}
                  {canDecide && (
                    <div className="space-y-3">
                      <div className="flex gap-2"><Button type="button" disabled={actionId === `refund-${refund.id}`} onClick={() => void runAction(`refund-${refund.id}`, () => refundsApi.approve(refund.id), 'Refund approved.')}>Approve refund</Button></div>
                      <div className="flex items-end gap-2"><div className="flex-1 space-y-2"><Label htmlFor={`refund-reject-${refund.id}`}>Rejection reason</Label><Input id={`refund-reject-${refund.id}`} value={rejectionReason} onChange={(event) => setRejectionReasons((current) => ({ ...current, [refund.id]: event.target.value }))} /></div><Button type="button" variant="outline" disabled={actionId === `refund-${refund.id}` || !rejectionReason.trim()} onClick={() => void runAction(`refund-${refund.id}`, () => refundsApi.reject(refund.id, rejectionReason.trim()), 'Refund rejected.')}>Reject</Button></div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
