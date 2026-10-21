'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Building,
  User,
  Wallet,
  Coins,
  Fuel,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Contract, ContractSignature, Milestone, Transaction, ContractFundInfo } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FreelanceXchainIcon } from '@/components/ui/freelancexchain-logo';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatAmount, formatDate, formatDateTime, formatDocumentNumber } from '@/lib/format';
import { useEthPhpRate } from '@/hooks/use-eth-php-rate';
import { useRealGasFee } from '@/hooks/use-real-gas-fee';
import { parseTransactionMetadata } from '@/lib/transaction-view';
import { useAuthStore } from '@/stores/authStore';
import { contractsApi, milestonesApi } from '@/lib/api';

export interface ContractInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
  milestones: Milestone[];
  transactions?: Transaction[];
  fundInfo?: ContractFundInfo | null;
  /** Valid signatures over the current terms (negotiated contracts). */
  signatures?: ContractSignature[];
  /** The versioned clauses the parties signed. */
  legalClauses?: Array<{ title: string; body: string }>;
  termsHash?: string;
}

const DEFAULT_LEGAL_CLAUSES: Array<{ title: string; body: string }> = [
  {
    title: 'Confidentiality & NDA',
    body: 'Both Client and Contractor agree to keep all technical specifications, code, mockups, trade secrets, and non-public business information confidential. No proprietary materials may be disclosed to third parties without prior written consent.',
  },
  {
    title: 'Intellectual Property (IP) Transfer',
    body: 'Upon approval of final milestone deliverable and complete release of agreed escrow funds, all intellectual property rights, copyrights, and title in the deliverable are irrevocably transferred to the Client.',
  },
  {
    title: 'Escrow Settlement',
    body: 'Payments are held securely in non-custodial smart contracts and disbursed strictly upon Client milestone acceptance or formal arbitration ruling under the platform dispute mechanism.',
  },
];

function SignatureBlock({
  title,
  signerName,
  signerDetail,
  signature,
  negotiated,
  acceptedAt,
}: {
  title: string;
  signerName: string;
  signerDetail?: string;
  signature?: ContractSignature;
  negotiated: boolean;
  acceptedAt?: string;
}) {
  const statusLabel = signature ? 'E-signed & wallet-verified' : negotiated ? 'Awaiting signature' : 'Accepted in-app';
  return (
    <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <span
          className={signature
            ? 'inline-flex items-center gap-1 text-2xs font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full'
            : 'inline-flex items-center gap-1 text-2xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full'}
        >
          {signature && <Check className="size-3" aria-hidden="true" />} {statusLabel}
        </span>
      </div>
      <div className="border-b border-dashed border-border/80 pb-2 pt-2 min-h-14">
        {signature?.signatureImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- inline data URL, nothing to optimize
          <img src={signature.signatureImage} alt={`${title} signature`} className="h-12 w-auto rounded bg-white" />
        ) : signature?.typedName ? (
          <p className="font-serif italic text-base font-bold text-primary tracking-wide">{signature.typedName}</p>
        ) : (
          <p className="text-2xs text-muted-foreground">{negotiated ? 'Not signed yet' : 'Signed records are kept for contracts agreed through negotiation.'}</p>
        )}
      </div>
      <div className="space-y-0.5 text-2xs text-muted-foreground">
        <p><strong className="text-foreground">Signer:</strong> {signerName} {signerDetail ? `(${signerDetail})` : ''}</p>
        {signature && (
          <>
            <p><strong className="text-foreground">Wallet:</strong> {truncateAddr(signature.walletAddress, 12, 8)}</p>
            <p><strong className="text-foreground">Signed:</strong> {formatDateTime(signature.signedAt)}</p>
            <p className="break-all font-mono"><strong className="font-sans text-foreground">Wallet signature:</strong> {truncateAddr(signature.walletSignature, 14, 10)}</p>
          </>
        )}
        {!signature && !negotiated && acceptedAt && (
          <p><strong className="text-foreground">Accepted:</strong> {formatDate(acceptedAt)}</p>
        )}
      </div>
    </div>
  );
}

type DocumentMode = 'combined' | 'invoice' | 'sow';

/** Truncate a long string (e.g. wallet address) for display */
function truncateAddr(value: string, start = 10, end = 6): string {
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

export function ContractInvoiceDialog({
  open,
  onOpenChange,
  contract,
  milestones,
  transactions = [],
  fundInfo,
  signatures = [],
  legalClauses,
  termsHash,
}: ContractInvoiceDialogProps) {
  const { formatEthToPhp } = useEthPhpRate();
  const [docMode, setDocMode] = useState<DocumentMode>('combined');
  const [copied, setCopied] = useState(false);

  const isEth = !contract.currency || contract.currency.toUpperCase() === 'ETH';
  const formatInvoiceMoney = (amount: number) => {
    if (isEth) {
      return (
        <span>
          {formatEthToPhp(amount)}{' '}
          <span className="text-2xs text-muted-foreground font-normal">({formatAmount(amount, { currency: 'ETH' })})</span>
        </span>
      );
    }
    return formatAmount(amount, { currency: contract.currency || 'PHP' });
  };

  const currentUser = useAuthStore((s) => s.user);
  const [extraContract, setExtraContract] = useState<Contract | null>(null);
  const [fetchedMilestones, setFetchedMilestones] = useState<Milestone[] | null>(null);

  useEffect(() => {
    let active = true;
    // Fetch full contract with relations if relations or names are missing
    if (!contract.employer?.name || !contract.freelancer?.name) {
      contractsApi.get(contract.id)
        .then(({ data }) => {
          if (active && data) {
            setExtraContract(data);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [contract.id, contract.employer?.name, contract.freelancer?.name]);

  useEffect(() => {
    let active = true;
    // If milestones are empty or not provided, fetch them directly for the contract
    if ((!milestones || milestones.length === 0) && contract.id) {
      milestonesApi.listForContract(contract.id)
        .then(({ data }) => {
          if (active && data && data.length > 0) {
            setFetchedMilestones(data);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [contract.id, milestones]);

  const detailContract = extraContract?.id === contract.id ? { ...contract, ...extraContract } : contract;
  const effectiveMilestones = (milestones && milestones.length > 0)
    ? milestones
    : (fetchedMilestones || detailContract.milestones || []);

  const contractTitle = detailContract.project?.title || detailContract.title || `Contract #${detailContract.id.slice(0, 8)}`;
  const invoiceNumber = formatDocumentNumber('INV', detailContract.id);
  const sowNumber = formatDocumentNumber('SOW', detailContract.id);

  const isCurrentUserEmployer = currentUser?.id === detailContract.employerId;
  const isCurrentUserFreelancer = currentUser?.id === detailContract.freelancerId;

  const clientName =
    detailContract.employer?.name ||
    (isCurrentUserEmployer ? currentUser?.name : null) ||
    detailContract.employer?.companyName ||
    'Client';

  const clientOrg =
    detailContract.employer?.companyName ||
    detailContract.employer?.industry ||
    '';

  const clientWallet =
    fundInfo?.employerWallet ||
    detailContract.employer?.walletAddress ||
    (isCurrentUserEmployer ? currentUser?.walletAddress : null) ||
    '';

  const freelancerName =
    detailContract.freelancer?.name ||
    (isCurrentUserFreelancer ? currentUser?.name : null) ||
    'Contractor';

  const freelancerTitle =
    detailContract.freelancer?.bio
      ? `${detailContract.freelancer.bio.slice(0, 45)}…`
      : 'Web3 Specialist';

  const freelancerWallet =
    fundInfo?.freelancerWallet ||
    detailContract.freelancer?.walletAddress ||
    (isCurrentUserFreelancer ? currentUser?.walletAddress : null) ||
    '';

  // If the entire contract is completed, any unfinalized milestones were signed off and released upon contract completion
  const normalizedMilestones = detailContract.status === 'completed'
    ? effectiveMilestones.map((m) =>
        ['pending', 'submitted', 'in_progress'].includes(m.status)
          ? { ...m, status: 'completed' as const }
          : m
      )
    : effectiveMilestones;

  const completedMilestones = normalizedMilestones.filter((m) => ['approved', 'completed'].includes(m.status));
  const releasedTotal = detailContract.status === 'completed'
    ? detailContract.totalAmount
    : completedMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const remainingTotal = Math.max(0, detailContract.totalAmount - releasedTotal);

  const {
    employerGasEth,
    gasPriceGwei,
    getMilestoneActionCost,
  } = useRealGasFee();

  const getTxGasFee = (tx: (typeof transactions)[number]): number | null => {
    const meta = parseTransactionMetadata(tx.metadata);
    const fee = typeof meta['feeEth'] === 'number'
      ? meta['feeEth']
      : typeof meta['gasFee'] === 'number'
      ? meta['gasFee']
      : meta['gasUsed'] && meta['gasPrice']
      ? (Number(meta['gasUsed']) * Number(meta['gasPrice'])) / 1e18
      : null;
    return typeof fee === 'number' && Number.isFinite(fee) && fee > 0 ? fee : null;
  };

  // Check if transactions contain actual gas metadata
  const actualGasFromTxs = (transactions ?? []).reduce((sum, tx) => {
    const fee = getTxGasFee(tx);
    return sum + (fee ?? 0);
  }, 0);

  const releasePerMilestoneCost = getMilestoneActionCost('employer-release', 1);
  const releasesGasEth = completedMilestones.length * releasePerMilestoneCost.gasEth;
  const estimatedTotalGasEth = employerGasEth + releasesGasEth;

  const contractHasDeployedEscrow = Boolean(contract.escrowAddress) || ['active', 'completed', 'disputed'].includes(contract.status);
  const totalGasFeeEth = actualGasFromTxs > 0
    ? actualGasFromTxs
    : contractHasDeployedEscrow
    ? estimatedTotalGasEth
    : employerGasEth;

  const totalWithGas = (detailContract.totalAmount || 0) + totalGasFeeEth;

  const handleCopyId = () => {
    void navigator.clipboard.writeText(invoiceNumber);
    setCopied(true);
    toast.success('Document reference copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const scrollContainer = document.getElementById('printable-contract-document')?.parentElement;
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
      scrollContainer.scrollLeft = 0;
    }
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Wide modal — !sm:max-w-none overrides the sm:max-w-sm default in DialogContent */}
      <DialogContent
        showCloseButton={false}
        className="flex !max-w-[min(56rem,calc(100vw-2rem))] w-full flex-col overflow-hidden p-0 print:!max-w-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:!translate-x-0 print:!translate-y-0 print:!translate-none print:!transform-none print:!static print:!top-0 print:!left-0"
      >
        {/* ── Controls (hidden when printing) ── */}
        <div className="no-print shrink-0 space-y-3 border-b border-border px-5 py-4 sm:px-7">
          <DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                  <FileText className="size-5 text-primary" />
                  Contract Agreement, SOW &amp; E-Sign
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs">
                  Official binding service agreement, statement of work, and tax invoice with verified on-chain e-signatures.
                </DialogDescription>
              </div>

              {/* Action buttons + close */}
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyId}>
                  {copied ? <Check className="mr-1.5 size-3.5 text-success" /> : <Copy className="mr-1.5 size-3.5" />}
                  {copied ? 'Copied' : invoiceNumber}
                </Button>
                <Button variant="default" size="sm" onClick={handlePrint} className="gap-1.5">
                  <Printer className="size-4" />
                  Print / Save PDF
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg border border-border bg-muted/40 p-1 text-xs">
            {([
              ['combined', 'Agreement & E-Sign'],
              ['invoice', 'Tax & Escrow Invoice'],
              ['sow', 'Statement of Work (SOW)'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDocMode(key)}
                className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-colors ${
                  docMode === key
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable printable document area ── */}
        <div className="max-h-[70dvh] overflow-y-auto print:max-h-none print:overflow-visible">
          <div
            id="printable-contract-document"
            className="space-y-6 bg-card p-5 text-card-foreground sm:p-8"
          >
            {/* Document Header */}
            <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FreelanceXchainIcon size={32} />
                  <span className="text-xl font-black tracking-tight text-foreground">
                    Freelance<span className="text-primary">X</span>chain
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Decentralized Freelance Escrow Protocol</p>
                <div className="flex items-center gap-1.5 pt-1 text-xs text-primary">
                  <ShieldCheck className="size-3.5 text-primary" />
                  <span>Smart Contract Escrow Protected</span>
                </div>
              </div>

              <div className="space-y-1.5 sm:text-right">
                <h2 className="text-lg font-extrabold uppercase tracking-wide text-foreground">
                  {docMode === 'invoice' && 'Tax Invoice & Escrow Receipt'}
                  {docMode === 'sow' && 'Statement of Work (SOW)'}
                  {docMode === 'combined' && 'Binding Contract Agreement & Statement of Work'}
                </h2>
                <p className="font-mono text-xs font-semibold text-muted-foreground">
                  Ref: {docMode === 'sow' ? sowNumber : invoiceNumber}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground sm:justify-end">
                  <Calendar className="size-3.5" />
                  <span>Issued: {formatDate(contract.createdAt)}</span>
                </div>
                <div className="pt-1">
                  <StatusBadge status={contract.status} domain="contract" />
                </div>
              </div>
            </div>

            {/* Parties: Client / Contractor — responsive 2-col */}
            <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-lg border border-border bg-muted/20 text-xs sm:grid-cols-2">
              {/* Client */}
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building className="size-3.5 shrink-0" />
                  Client / Billed To
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{clientName}</p>
                  {clientOrg && clientOrg !== clientName && (
                    <p className="text-xs text-muted-foreground mt-0.5">{clientOrg}</p>
                  )}
                </div>
                <div className="flex items-start gap-1.5 pt-1 text-muted-foreground">
                  <Wallet className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground">Wallet: </span>
                    <span className="break-all font-mono text-xs text-foreground">
                      {clientWallet ? truncateAddr(clientWallet, 10, 8) : 'Not connected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contractor — border-l on sm+, border-t on mobile */}
              <div className="space-y-2 border-t border-border p-4 sm:border-l sm:border-t-0">
                <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground">
                  <User className="size-3.5 shrink-0" />
                  Contractor / Service Provider
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{freelancerName}</p>
                  {freelancerTitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">{freelancerTitle}</p>
                  )}
                </div>
                <div className="flex items-start gap-1.5 pt-1 text-muted-foreground">
                  <Wallet className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground">Wallet: </span>
                    <span className="break-all font-mono text-xs text-foreground">
                      {freelancerWallet ? truncateAddr(freelancerWallet, 10, 8) : 'Not connected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SOW Scope Section */}
            {docMode !== 'invoice' && (
              <div className="space-y-3 rounded-lg border border-border p-4 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-foreground">
                  Scope of Work &amp; Agreement Terms
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">Project Title: </span>
                    {contractTitle}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Deliverables Summary: </span>
                    {contract.project?.description ||
                      contract.description ||
                      'Deliverables and scope agreed in approved proposal.'}
                  </div>
                  <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                    <div>
                      <span className="font-semibold text-foreground">Engagement Start: </span>
                      {contract.startDate ? formatDate(contract.startDate) : formatDate(contract.createdAt)}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Expected Completion: </span>
                      {contract.endDate ? formatDate(contract.endDate) : 'Upon milestone delivery and review'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Milestones Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Milestone Schedule &amp; Payment Deliverables
              </h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[32rem] text-left text-xs">
                  <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Milestone / Deliverable</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Due Date</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Escrow Status</th>
                      <th className="px-3 py-2.5 text-right whitespace-nowrap">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {normalizedMilestones.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-muted-foreground">
                          Single contract payment upon deliverable sign-off.
                        </td>
                      </tr>
                    ) : (
                      normalizedMilestones.map((milestone, idx) => (
                        <tr key={milestone.id}>
                          <td className="px-3 py-2.5 font-mono text-muted-foreground">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-foreground">{milestone.title}</p>
                            {milestone.description && (
                              <p className="mt-0.5 line-clamp-2 text-muted-foreground text-2xs">
                                {milestone.description}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                            {milestone.dueDate ? formatDate(milestone.dueDate) : '—'}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <StatusBadge status={milestone.status} domain="milestone" />
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-foreground">
                            {formatInvoiceMoney(milestone.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="flex flex-col items-end gap-1.5 pt-2 text-xs">
                <div className="flex w-full max-w-xs justify-between text-muted-foreground">
                  <span>Milestone Subtotal:</span>
                  <span className="font-semibold tabular-nums">{formatInvoiceMoney(contract.baseAmount)}</span>
                </div>
                {contract.rushFee > 0 && (
                  <div className="flex w-full max-w-xs justify-between text-muted-foreground">
                    <span>Rush Acceleration Fee:</span>
                    <span className="font-semibold tabular-nums">{formatInvoiceMoney(contract.rushFee)}</span>
                  </div>
                )}
                <div className="flex w-full max-w-xs justify-between border-t border-border pt-1.5 text-sm font-bold text-foreground">
                  <span>Total Contract Value:</span>
                  <span className="tabular-nums text-primary font-bold">{formatInvoiceMoney(contract.totalAmount)}</span>
                </div>
                <div className="flex w-full max-w-xs justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Fuel className="size-3 text-primary shrink-0" />
                    <span>Blockchain Network Gas:</span>
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatInvoiceMoney(totalGasFeeEth)}
                  </span>
                </div>
                <div className="flex w-full max-w-xs justify-between border-t border-dashed border-border/80 pt-1 text-xs font-bold text-foreground">
                  <span>Total Settlement (with Gas):</span>
                  <span className="tabular-nums text-foreground font-bold">{formatInvoiceMoney(totalWithGas)}</span>
                </div>
                <div className="flex w-full max-w-xs justify-between text-muted-foreground">
                  <span>Released to Contractor:</span>
                  <span className="font-semibold tabular-nums text-success">{formatInvoiceMoney(releasedTotal)}</span>
                </div>
                <div className="flex w-full max-w-xs justify-between text-muted-foreground">
                  <span>Remaining in Escrow:</span>
                  <span className="font-semibold tabular-nums">{formatInvoiceMoney(remainingTotal)}</span>
                </div>
              </div>
            </div>

            {/* On-Chain Escrow Verification */}
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4 text-xs">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-foreground">
                <Coins className="size-3.5 text-primary" />
                On-Chain Escrow Security &amp; Audit Trail
              </div>
              <div className="grid grid-cols-1 gap-2 text-muted-foreground sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-foreground">Escrow Smart Contract: </span>
                  <p className="break-all font-mono text-2xs">
                    {contract.escrowAddress || 'Pending On-Chain Deployment'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Settlement Protocol: </span>
                  <p>EVM Trustless Escrow with Multi-Sig Arbitration</p>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Network Gas Used / Allocated: </span>
                  <p className="font-mono text-2xs text-foreground">
                    {formatInvoiceMoney(totalGasFeeEth)} · ~{Number(850000 + completedMilestones.length * 65000).toLocaleString('en-US')} gas units @ {gasPriceGwei.toFixed(1)} Gwei
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Gas Settlement Status: </span>
                  <p className="text-2xs text-foreground">
                    {actualGasFromTxs > 0
                      ? 'Mined on blockchain · Settled via transaction receipts'
                      : contractHasDeployedEscrow
                      ? 'Escrow deployed · Network fee paid to EVM validators'
                      : 'Pre-transaction quote · Settled upon escrow funding'}
                  </p>
                </div>
              </div>

              {transactions.length > 0 && (
                <div className="space-y-1 border-t border-border pt-2">
                  <span className="font-semibold text-foreground">Recorded On-Chain Transactions &amp; Gas:</span>
                  <div className="space-y-1">
                    {transactions.slice(0, 3).map((tx) => {
                      const txGas = getTxGasFee(tx);
                      return (
                      <div key={tx.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 font-mono text-2xs">
                        <span className="truncate max-w-[260px] text-muted-foreground">
                          Tx: {tx.transaction_hash || tx.id}
                        </span>
                        <span className="shrink-0 uppercase text-foreground">
                          {tx.type} • {formatInvoiceMoney(tx.amount)}
                          {txGas !== null && (
                            <span className="ml-1 font-sans text-muted-foreground">
                              (Gas: {formatInvoiceMoney(txGas)})
                            </span>
                          )}
                        </span>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Legal terms: the versioned clauses both parties signed (fallback text for older contracts) */}
            {docMode !== 'invoice' && (
              <div className="space-y-2 rounded-lg border border-border bg-card p-4 text-xs">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-foreground">
                  <ShieldCheck className="size-3.5 text-success" />
                  Legal Terms, Non-Disclosure (NDA) &amp; IP Protection
                </div>
                <div className="space-y-2 text-2xs text-muted-foreground leading-relaxed">
                  {(legalClauses ?? DEFAULT_LEGAL_CLAUSES).map((clause, index) => (
                    <p key={clause.title}>
                      <strong className="text-foreground">{index + 1}. {clause.title}:</strong> {clause.body}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* E-Signature & Execution Block: real signature records */}
            {docMode !== 'invoice' && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-success" />
                    E-Signature &amp; Execution Block
                  </h3>
                  {termsHash && (
                    <span className="text-2xs font-mono text-muted-foreground">
                      Terms hash: {truncateAddr(termsHash, 12, 8)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SignatureBlock
                    title="Employer / Client"
                    signerName={clientName}
                    signerDetail={clientOrg && clientOrg !== clientName ? clientOrg : undefined}
                    signature={signatures.find((sig) => sig.signerRole === 'employer')}
                    negotiated={Boolean(termsHash)}
                    acceptedAt={detailContract.createdAt}
                  />
                  <SignatureBlock
                    title="Contractor / Freelancer"
                    signerName={freelancerName}
                    signature={signatures.find((sig) => sig.signerRole === 'freelancer')}
                    negotiated={Boolean(termsHash)}
                    acceptedAt={detailContract.createdAt}
                  />
                </div>
              </div>
            )}

            {/* Legal Footer */}
            <div className="space-y-1 border-t border-border pt-4 text-2xs text-muted-foreground">
              <p>
                <strong>Legal Notice:</strong> This document serves as a binding Statement of Work (SOW) and
                verifiable payment invoice under the FreelanceXchain Escrow Protocol. Milestone funds are held
                trustlessly in decentralized escrow contracts until deliverables are approved by the client or
                resolved via the platform dispute registry.
              </p>
              <p>
                Generated automatically on {formatDate(new Date().toISOString())} via FreelanceXchain. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
