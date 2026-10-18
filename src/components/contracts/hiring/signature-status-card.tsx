'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, FileSignature } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractPartyRole, ContractSignature, SigningPayload } from '@/types';
import { contractsApi, negotiationApi } from '@/lib/api';
import { reportFailure } from '@/lib/report-failure';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignContractDialog } from './sign-contract-dialog';

function truncate(value: string, head = 8, tail = 6): string {
  return value.length > head + tail + 1 ? `${value.slice(0, head)}…${value.slice(-tail)}` : value;
}

/** Who signed and when; the current signer's sign button; request changes / cancel. */
export function SignatureStatusCard({
  payload,
  role,
  linkedWallet,
  defaultName,
  onChanged,
}: {
  payload: SigningPayload;
  role: ContractPartyRole;
  linkedWallet: string | null | undefined;
  defaultName: string;
  onChanged: () => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const awaiting = payload.status === 'awaiting_signatures';
  const signatureFor = (signer: ContractPartyRole): ContractSignature | undefined =>
    payload.signatures.find((s) => s.signerRole === signer);

  const run = async (id: string, action: () => Promise<unknown>, success: string) => {
    setBusy(id);
    try {
      await action();
      toast.success(success);
      await onChanged();
    } catch (error) {
      reportFailure(error, 'update the contract');
    } finally {
      setBusy(null);
    }
  };

  const rows: Array<{ signer: ContractPartyRole; label: string }> = [
    { signer: 'freelancer', label: 'Freelancer (signs first)' },
    { signer: 'employer', label: 'Client' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="size-5 text-primary" aria-hidden="true" />
          Contract signatures
        </CardTitle>
        <CardDescription>
          Each party adopts a signature and confirms the same terms with their wallet. The freelancer signs first, then the client.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ signer, label }) => {
            const signature = signatureFor(signer);
            return (
              <li key={signer} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{label}{signer === role ? ' — you' : ''}</span>
                  {signature ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" /> Signed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden="true" /> {payload.nextSigner === signer ? 'Signs next' : 'Waiting'}
                    </span>
                  )}
                </div>
                {signature && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {signature.signatureImage ? (
                      // eslint-disable-next-line @next/next/no-img-element -- inline data URL, nothing to optimize
                      <img src={signature.signatureImage} alt={`${label} signature`} className="h-12 w-auto rounded bg-white" />
                    ) : (
                      <p className="font-serif text-lg italic text-foreground">{signature.typedName}</p>
                    )}
                    <p>Signed {formatDateTime(signature.signedAt)}</p>
                    <p className="font-mono">Wallet {truncate(signature.walletAddress)}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <p className="break-all font-mono text-2xs text-muted-foreground">Terms hash: {payload.termsHash}</p>

        {awaiting && (
          <div className="flex flex-wrap gap-2">
            {payload.canSign && (
              <Button onClick={() => setDialogOpen(true)} disabled={Boolean(busy)}>Review &amp; sign</Button>
            )}
            <Button
              variant="outline"
              disabled={Boolean(busy)}
              loading={busy === 'reopen'}
              onClick={() => void run('reopen', () => negotiationApi.reopen(payload.contractId), 'Back to negotiation. Any signatures were voided.')}
            >
              Request changes
            </Button>
            <Button
              variant="ghost"
              disabled={Boolean(busy)}
              loading={busy === 'cancel'}
              onClick={() => void run('cancel', () => contractsApi.cancel(payload.contractId), 'Contract cancelled.')}
            >
              Cancel contract
            </Button>
          </div>
        )}
      </CardContent>

      {payload.canSign && (
        <SignContractDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          payload={payload}
          role={role}
          linkedWallet={linkedWallet}
          defaultName={defaultName}
          onSigned={onChanged}
        />
      )}
    </Card>
  );
}
