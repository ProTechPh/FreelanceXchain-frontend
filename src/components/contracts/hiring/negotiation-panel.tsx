'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Handshake, MessagesSquare } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractOfferInput, ContractPartyRole, NegotiationState } from '@/types';
import { contractsApi, negotiationApi } from '@/lib/api';
import { reportFailure } from '@/lib/report-failure';
import { getDirectMessageRoute } from '@/lib/dashboard-message-route';
import { draftFromOffer, floorToUnits } from '@/lib/contract-terms';
import { formatAmount } from '@/lib/format';
import { useEthPhpRate } from '@/hooks/use-eth-php-rate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Field, useField } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OfferSummary } from './offer-summary';
import { OfferBuilderDialog } from './offer-builder-dialog';

function ReasonControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const field = useField();
  return <Textarea {...field} rows={3} maxLength={1000} value={value} onChange={(e) => onChange(e.target.value)} />;
}

const roleLabel = (role: ContractPartyRole, viewer: ContractPartyRole) =>
  role === viewer ? 'You' : role === 'employer' ? 'Client' : 'Freelancer';

/**
 * Structured negotiation between accepting a proposal and signing: offers and
 * counter-offers with the freelancer's rate as the floor. Discussion happens in
 * the existing chat.
 */
export function NegotiationPanel({
  negotiation,
  role,
  onChanged,
}: {
  negotiation: NegotiationState;
  role: ContractPartyRole;
  onChanged: () => Promise<void>;
}) {
  const { contract, openOffer, offers, permissions, floor, template, limits, chat } = negotiation;
  const [builderOpen, setBuilderOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState<null | 'decline' | 'end'>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const initialDraft: ContractOfferInput = useMemo(() => draftFromOffer(openOffer, {
    floor: floor.proposedRate,
    deadline: template.deadline,
    isRush: template.isRush,
    rushFeePercentage: template.rushFeePercentage,
    milestones: template.milestones,
  }), [openOffer, floor.proposedRate, template]);

  const history = useMemo(() => [...offers].reverse().filter((o) => o.id !== openOffer?.id), [offers, openOffer]);
  const previousOf = (offerId: string) => {
    const index = offers.findIndex((o) => o.id === offerId);
    return index > 0 ? offers[index - 1] : null;
  };

  const run = async (id: string, action: () => Promise<unknown>, success: string) => {
    setBusy(id);
    try {
      await action();
      toast.success(success);
      await onChanged();
      return true;
    } catch (error) {
      reportFailure(error, 'update the negotiation');
      return false;
    } finally {
      setBusy(null);
    }
  };

  const { formatEthToPhp } = useEthPhpRate();
  const chatHref = getDirectMessageRoute(role, chat.otherPartyId, chat.projectId);
  const waitingOnOther = Boolean(openOffer) && !permissions.canAccept;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Handshake className="size-5 text-primary" aria-hidden="true" />
            Negotiate terms
          </CardTitle>
          <CardDescription>
            Agree on milestones, extra pay, deadline and rush fee. The base amount can&apos;t go below the
            freelancer&apos;s rate of {formatEthToPhp(floorToUnits(floor.proposedRate))} ({formatAmount(floorToUnits(floor.proposedRate), { currency: 'ETH' })}).
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={chatHref}>
            <MessagesSquare aria-hidden="true" /> Discuss in chat
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        {openOffer ? (
          <section aria-labelledby="open-offer-heading" className="space-y-3 rounded-lg border border-border p-4">
            <h3 id="open-offer-heading" className="text-sm font-semibold">
              {permissions.canAccept ? 'Offer waiting for your response' : 'Your offer is waiting for a response'}
            </h3>
            <OfferSummary offer={openOffer} previous={previousOf(openOffer.id)} proposerLabel={roleLabel(openOffer.proposerRole, role)} viewerRole={role} />
            <div className="flex flex-wrap gap-2">
              {permissions.canAccept && (
                <Button
                  loading={busy === 'accept'}
                  loadingText="Locking terms…"
                  disabled={Boolean(busy)}
                  onClick={() => void run('accept', () => negotiationApi.acceptOffer(contract.id, openOffer.id), 'Terms agreed. Next: sign the contract.')}
                >
                  Accept terms
                </Button>
              )}
              {permissions.canPropose && (
                <Button variant="outline" disabled={Boolean(busy)} onClick={() => setBuilderOpen(true)}>
                  {permissions.canAccept ? 'Counter-offer' : 'Revise offer'}
                </Button>
              )}
              {permissions.canDecline && (
                <Button variant="ghost" disabled={Boolean(busy)} onClick={() => { setReason(''); setDeclineOpen('decline'); }}>
                  Decline
                </Button>
              )}
              {permissions.canWithdraw && (
                <Button
                  variant="ghost"
                  loading={busy === 'withdraw'}
                  disabled={Boolean(busy)}
                  onClick={() => void run('withdraw', () => negotiationApi.withdrawOffer(contract.id, openOffer.id), 'Offer withdrawn.')}
                >
                  Withdraw offer
                </Button>
              )}
            </div>
            {waitingOnOther && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  Waiting for the other party to accept, counter or decline. You&apos;ll be notified.
                </p>
                <p>
                  <strong className="font-medium text-foreground">Revise offer</strong> replaces these terms with new ones.{' '}
                  <strong className="font-medium text-foreground">Withdraw offer</strong> takes them back so either side can propose again;
                  the negotiation stays open.
                </p>
              </div>
            )}
          </section>
        ) : (
          <Alert
            tone="info"
            title="No open offer"
            live={false}
          >
            {permissions.canPropose
              ? 'Propose the terms you want. The other party can accept them or send a counter-offer.'
              : 'Waiting for the other party to propose terms.'}
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!openOffer && permissions.canPropose && (
            <Button disabled={Boolean(busy)} onClick={() => setBuilderOpen(true)}>Propose terms</Button>
          )}
          {permissions.canEnd && (
            <Button variant="destructive" disabled={Boolean(busy)} onClick={() => { setReason(''); setDeclineOpen('end'); }}>
              End negotiation
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {limits.roundsUsed}/{limits.maxRounds} offers used
          </span>
        </div>

        {history.length > 0 && (
          <details className="group rounded-lg border border-border">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Offer history ({history.length})
            </summary>
            <ol className="space-y-4 border-t border-border p-4">
              {history.map((offer) => (
                <li key={offer.id}>
                  <OfferSummary offer={offer} previous={previousOf(offer.id)} proposerLabel={roleLabel(offer.proposerRole, role)} viewerRole={role} compact />
                </li>
              ))}
            </ol>
          </details>
        )}
      </CardContent>

      <OfferBuilderDialog
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        initialDraft={initialDraft}
        floor={floor.proposedRate}
        maxMilestones={limits.maxMilestones}
        isCounter={Boolean(openOffer && permissions.canAccept)}
        role={role}
        defaultRushFeePercentage={template.rushFeePercentage > 0 ? template.rushFeePercentage : 25}
        submitting={busy === 'offer'}
        onSubmit={(draft) => {
          void run('offer', () => negotiationApi.createOffer(contract.id, draft), 'Offer sent.').then((ok) => {
            if (ok) setBuilderOpen(false);
          });
        }}
      />

      <Dialog open={declineOpen !== null} onOpenChange={(open) => { if (!busy && !open) setDeclineOpen(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={declineOpen === 'end' ? 'text-destructive' : undefined}>
              {declineOpen === 'end' ? 'End this negotiation?' : 'Decline this offer?'}
            </DialogTitle>
            <DialogDescription>
              {declineOpen === 'end'
                ? 'The contract is cancelled and the hiring slot is released. This cannot be undone.'
                : 'The negotiation stays open, so either side can send new terms.'}
            </DialogDescription>
          </DialogHeader>
          <Field label="Reason (optional)">
            <ReasonControl value={reason} onChange={setReason} />
          </Field>
          <DialogFooter>
            <Button variant="outline" disabled={Boolean(busy)} onClick={() => setDeclineOpen(null)}>Keep negotiating</Button>
            <Button
              variant={declineOpen === 'end' ? 'destructive' : 'default'}
              loading={busy === 'decline'}
              loadingText={declineOpen === 'end' ? 'Ending…' : 'Declining…'}
              onClick={() => {
                const end = declineOpen === 'end';
                const action = end && !(openOffer && permissions.canDecline)
                  ? () => contractsApi.cancel(contract.id)
                  : () => negotiationApi.declineOffer(contract.id, openOffer!.id, { reason: reason.trim() || undefined, endNegotiation: end });
                void run('decline', action, end ? 'Negotiation ended.' : 'Offer declined.').then((ok) => {
                  if (ok) setDeclineOpen(null);
                });
              }}
            >
              {declineOpen === 'end' ? 'End negotiation' : 'Decline offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
