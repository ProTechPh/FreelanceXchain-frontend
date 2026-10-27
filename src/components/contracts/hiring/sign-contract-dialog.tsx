'use client';

import { useState } from 'react';
import { FileSignature } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractPartyRole, SigningPayload } from '@/types';
import { signaturesApi } from '@/lib/api';
import { reportFailure } from '@/lib/report-failure';
import { requestWalletProvider } from '@/lib/metamask';
import { getLinkedWalletMismatchMessage } from '@/lib/wallet-linking';
import { isUsablePngDataUrl, signContractTerms, WalletSigningError } from '@/lib/contract-signing';
import { formatAmount, formatDate } from '@/lib/format';
import { useEthPhpRate } from '@/hooks/use-eth-php-rate';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Field, useField } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { SignaturePad } from './signature-pad';
import { countMeaningfulChars } from '@/lib/text-validation';

function NameControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const field = useField();
  return <Input {...field} autoComplete="name" maxLength={120} value={value} onChange={(e) => onChange(e.target.value)} />;
}

/** Contract amounts are whole cents of ETH, so wei → ETH needs no big-number library. */
const weiToEthNumber = (wei: string | number | null | undefined): number => {
  if (wei == null) return 0;
  if (typeof wei === 'number') return wei;
  if (typeof wei === 'string' && wei.includes('.')) {
    const parsed = parseFloat(wei);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  try {
    return Number(BigInt(wei) / BigInt(10) ** BigInt(14)) / 10000;
  } catch {
    const parsed = parseFloat(String(wei));
    return Number.isFinite(parsed) ? parsed : 0;
  }
};

const weiToEth = (wei: string | number | null | undefined): string => {
  const num = weiToEthNumber(wei);
  return formatAmount(num, { currency: 'ETH' });
};

/**
 * Dual e-signature: review the locked terms, adopt a drawn or typed signature
 * with explicit consent, then sign the same terms (EIP-712) in MetaMask.
 */
type SignContractDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: SigningPayload;
  role: ContractPartyRole;
  linkedWallet: string | null | undefined;
  defaultName: string;
  onSigned: () => Promise<void>;
};

export function SignContractDialog(props: SignContractDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Dialog open={props.open} onOpenChange={(next) => { if (!submitting) props.onOpenChange(next); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {/* Mounted per opening so every open starts clean (no stale drawing or consent). */}
        {props.open && <SignContractForm {...props} submitting={submitting} setSubmitting={setSubmitting} />}
      </DialogContent>
    </Dialog>
  );
}

function SignContractForm({
  onOpenChange,
  payload,
  role,
  linkedWallet,
  defaultName,
  onSigned,
  submitting,
  setSubmitting,
}: SignContractDialogProps & { submitting: boolean; setSubmitting: (value: boolean) => void }) {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [drawn, setDrawn] = useState<string | null>(null);
  const [typedName, setTypedName] = useState(defaultName);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { formatEthToPhp } = useEthPhpRate();
  const { terms, legal } = payload;
  const nameValid = countMeaningfulChars(typedName) >= 2;
  const adopted = mode === 'draw' ? isUsablePngDataUrl(drawn) : nameValid;
  const ready = adopted && consent && Boolean(linkedWallet);

  const handleSign = async () => {
    if (!linkedWallet) return;
    setSubmitting(true);
    setError(null);
    try {
      const provider = await requestWalletProvider();
      const wallet = await signContractTerms(provider, payload, linkedWallet, getLinkedWalletMismatchMessage);
      await signaturesApi.sign(payload.contractId, {
        termsHash: payload.termsHash,
        signatureType: mode === 'draw' ? 'drawn' : 'typed',
        ...(mode === 'draw' && drawn ? { signatureImage: drawn } : {}),
        ...(nameValid ? { typedName: typedName.trim() } : {}),
        walletAddress: wallet.walletAddress,
        walletSignature: wallet.walletSignature,
        consent: true,
      });
      toast.success(role === 'employer' ? 'Contract signed. Fund the escrow to start the work.' : 'Contract signed. The client signs next.');
      onOpenChange(false);
      await onSigned();
    } catch (err) {
      if (err instanceof WalletSigningError) {
        setError(err.message);
      } else if ((err as { code?: number })?.code === 4001) {
        setError('You rejected the signature request in MetaMask. Nothing was signed.');
      } else {
        reportFailure(err, 'sign the contract');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileSignature className="size-5 text-primary" aria-hidden="true" />
          Sign the contract
        </DialogTitle>
        <DialogDescription>
          Review the agreed terms, adopt your signature, then confirm with your wallet. Both signatures cover the same terms.
        </DialogDescription>
      </DialogHeader>

      <section aria-labelledby="sign-terms-heading" className="space-y-3">
        <h3 id="sign-terms-heading" className="text-sm font-semibold">1. Review the terms{payload.projectTitle ? ` for “${payload.projectTitle}”` : ''}</h3>
        <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Base</dt>
            <dd className="font-semibold text-foreground">{formatEthToPhp(weiToEthNumber(terms.baseAmountWei))}</dd>
            <dd className="text-2xs text-muted-foreground">{weiToEth(terms.baseAmountWei)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Additional pay</dt>
            <dd className="font-semibold text-foreground">{formatEthToPhp(weiToEthNumber(terms.additionalPayWei))}</dd>
            <dd className="text-2xs text-muted-foreground">{weiToEth(terms.additionalPayWei)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Rush fee</dt>
            <dd className="font-semibold text-foreground">
              {terms.rushFeeBps > 0 ? formatEthToPhp(weiToEthNumber(terms.rushFeeWei)) : 'None'}
            </dd>
            {terms.rushFeeBps > 0 && (
              <dd className="text-2xs text-muted-foreground">
                {weiToEth(terms.rushFeeWei)} ({terms.rushFeeBps / 100}%)
              </dd>
            )}
          </div>
          <div>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-semibold text-primary">{formatEthToPhp(weiToEthNumber(terms.totalAmountWei))}</dd>
            <dd className="text-2xs text-muted-foreground">{weiToEth(terms.totalAmountWei)}</dd>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-muted-foreground">Deadline</dt>
            <dd className="font-medium">{formatDate(terms.deadline)}</dd>
          </div>
        </dl>
        <ol className="space-y-2 text-sm">
          {terms.milestones.map((m) => (
            <li key={m.index} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <p className="font-medium">{m.index + 1}. {m.title}</p>
                {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                <p className="text-xs text-muted-foreground">Due {formatDate(m.dueDate)}</p>
              </div>
              <div className="text-right">
                <p className="whitespace-nowrap font-semibold text-foreground">{formatEthToPhp(weiToEthNumber(m.amountWei))}</p>
                <p className="text-2xs text-muted-foreground">{weiToEth(m.amountWei)}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="space-y-2 rounded-lg border border-border p-3 text-xs text-muted-foreground">
          {legal.clauses.map((clause, i) => (
            <p key={clause.title}><strong className="text-foreground">{i + 1}. {clause.title}:</strong> {clause.body}</p>
          ))}
        </div>
        <p className="break-all font-mono text-2xs text-muted-foreground">Terms hash: {payload.termsHash}</p>
      </section>

      <section aria-labelledby="sign-adopt-heading" className="space-y-3">
        <h3 id="sign-adopt-heading" className="text-sm font-semibold">2. Adopt your signature</h3>
        <Tabs value={mode} onValueChange={(value) => setMode(value as 'draw' | 'type')}>
          <TabsList>
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
          </TabsList>
          <TabsContent value="draw" className="pt-3">
            <SignaturePad onChange={setDrawn} />
          </TabsContent>
          <TabsContent value="type" className="space-y-3 pt-3">
            <Field label="Full legal name" error={typedName && !nameValid ? 'Enter at least 2 letters.' : null} required>
              <NameControl value={typedName} onChange={setTypedName} />
            </Field>
            {nameValid && (
              <p className="rounded-lg border border-border bg-card px-4 py-3 font-serif text-2xl italic text-foreground" aria-label={`Signature preview: ${typedName}`}>
                {typedName}
              </p>
            )}
          </TabsContent>
        </Tabs>
        <div className="flex items-start gap-3">
          <Checkbox id="sign-consent" checked={consent} onCheckedChange={(checked) => setConsent(Boolean(checked))} className="mt-0.5" />
          <Label htmlFor="sign-consent" className="text-sm font-normal leading-snug">{legal.statement}</Label>
        </div>
      </section>

      <section aria-labelledby="sign-wallet-heading" className="space-y-2">
        <h3 id="sign-wallet-heading" className="text-sm font-semibold">3. Confirm with your wallet</h3>
        <p className="text-xs text-muted-foreground">
          MetaMask asks you to sign these exact terms. Signing is free and doesn&apos;t send a transaction.
        </p>
        {!linkedWallet && <Alert tone="warning" title="Link a wallet in Settings before signing." />}
        {error && <Alert tone="destructive" title={error} />}
      </section>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Not now</Button>
        <Button onClick={() => void handleSign()} disabled={!ready} loading={submitting} loadingText="Waiting for MetaMask…">
          Sign contract
        </Button>
      </DialogFooter>
    </>
  );
}
