'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import type { Contract, Milestone, Transaction, ContractFundInfo } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatAmount, formatDate } from '@/lib/format';

export interface ContractInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
  milestones: Milestone[];
  transactions?: Transaction[];
  fundInfo?: ContractFundInfo | null;
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
}: ContractInvoiceDialogProps) {
  const [docMode, setDocMode] = useState<DocumentMode>('combined');
  const [copied, setCopied] = useState(false);

  const contractTitle = contract.project?.title || contract.title || `Contract #${contract.id.slice(0, 8)}`;
  const invoiceNumber = `INV-${contract.id.slice(0, 8).toUpperCase()}`;
  const sowNumber = `SOW-${contract.id.slice(0, 8).toUpperCase()}`;

  const clientName = contract.employer?.name || contract.employer?.companyName || 'Employer / Client';
  const clientOrg = contract.employer?.companyName || contract.employer?.industry || 'Client Organization';
  const clientWallet = fundInfo?.employerWallet || 'Connected Client Wallet';

  const freelancerName = contract.freelancer?.name || 'Freelancer / Contractor';
  const freelancerTitle = contract.freelancer?.bio
    ? `${contract.freelancer.bio.slice(0, 45)}…`
    : 'Web3 Independent Specialist';
  const freelancerWallet = fundInfo?.freelancerWallet || 'Connected Contractor Wallet';

  const completedMilestones = milestones.filter((m) => ['approved', 'completed'].includes(m.status));
  const releasedTotal = completedMilestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const remainingTotal = Math.max(0, contract.totalAmount - releasedTotal);

  const handleCopyId = () => {
    void navigator.clipboard.writeText(invoiceNumber);
    setCopied(true);
    toast.success('Document reference copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Wide modal — !sm:max-w-none overrides the sm:max-w-sm default in DialogContent */}
      <DialogContent className="flex !max-w-[min(56rem,calc(100vw-2rem))] w-full flex-col overflow-hidden p-0">
        {/* ── Controls (hidden when printing) ── */}
        <div className="no-print shrink-0 space-y-3 border-b border-border px-5 py-4 sm:px-7">
          <DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                  <FileText className="size-5 text-primary" />
                  PDF Invoice &amp; Statement of Work
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs">
                  Official tax-ready invoice and binding service agreement for this contract.
                </DialogDescription>
              </div>

              {/* Action buttons */}
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyId}>
                  {copied ? <Check className="mr-1.5 size-3.5 text-success" /> : <Copy className="mr-1.5 size-3.5" />}
                  {copied ? 'Copied' : invoiceNumber}
                </Button>
                <Button variant="default" size="sm" onClick={handlePrint} className="gap-1.5">
                  <Printer className="size-4" />
                  Print / Save PDF
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg border border-border bg-muted/40 p-1 text-xs">
            {([
              ['combined', 'Full SOW & Invoice'],
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
        <div className="max-h-[70vh] overflow-y-auto">
          <div
            id="printable-contract-document"
            className="space-y-6 bg-card p-5 text-card-foreground sm:p-8"
          >
            {/* Document Header */}
            <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                    FX
                  </div>
                  <span className="text-xl font-black tracking-tight text-foreground">FreelanceXchain</span>
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
                  {docMode === 'combined' && 'Statement of Work & Invoice'}
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
                <p className="text-sm font-bold text-foreground">{clientName}</p>
                <p className="text-muted-foreground">{clientOrg}</p>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="size-3 shrink-0" />
                  <span className="font-mono">ID: {contract.employerId.slice(0, 14)}…</span>
                </div>
                <div className="flex items-start gap-1 text-muted-foreground">
                  <Wallet className="mt-0.5 size-3 shrink-0" />
                  <span className="break-all font-mono">{truncateAddr(clientWallet)}</span>
                </div>
              </div>

              {/* Contractor — border-l on sm+, border-t on mobile */}
              <div className="space-y-2 border-t border-border p-4 sm:border-l sm:border-t-0">
                <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground">
                  <User className="size-3.5 shrink-0" />
                  Contractor / Service Provider
                </div>
                <p className="text-sm font-bold text-foreground">{freelancerName}</p>
                <p className="text-muted-foreground">{freelancerTitle}</p>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="size-3 shrink-0" />
                  <span className="font-mono">ID: {contract.freelancerId.slice(0, 14)}…</span>
                </div>
                <div className="flex items-start gap-1 text-muted-foreground">
                  <Wallet className="mt-0.5 size-3 shrink-0" />
                  <span className="break-all font-mono">{truncateAddr(freelancerWallet)}</span>
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
                    {milestones.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-muted-foreground">
                          Single contract payment upon deliverable sign-off.
                        </td>
                      </tr>
                    ) : (
                      milestones.map((milestone, idx) => (
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
                            {formatAmount(milestone.amount)}
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
                  <span className="font-semibold tabular-nums">{formatAmount(contract.baseAmount)}</span>
                </div>
                {contract.rushFee > 0 && (
                  <div className="flex w-full max-w-xs justify-between text-muted-foreground">
                    <span>Rush Acceleration Fee:</span>
                    <span className="font-semibold tabular-nums">{formatAmount(contract.rushFee)}</span>
                  </div>
                )}
                <div className="flex w-full max-w-xs justify-between border-t border-border pt-1.5 text-sm font-bold text-foreground">
                  <span>Total Contract Value:</span>
                  <span className="tabular-nums text-primary">{formatAmount(contract.totalAmount)}</span>
                </div>
                <div className="flex w-full max-w-xs justify-between text-muted-foreground">
                  <span>Released to Contractor:</span>
                  <span className="font-semibold tabular-nums text-success">{formatAmount(releasedTotal)}</span>
                </div>
                <div className="flex w-full max-w-xs justify-between text-muted-foreground">
                  <span>Remaining in Escrow:</span>
                  <span className="font-semibold tabular-nums">{formatAmount(remainingTotal)}</span>
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
              </div>

              {transactions.length > 0 && (
                <div className="space-y-1 border-t border-border pt-2">
                  <span className="font-semibold text-foreground">Recorded On-Chain Transactions:</span>
                  <div className="space-y-1">
                    {transactions.slice(0, 3).map((tx) => (
                      <div key={tx.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 font-mono text-2xs">
                        <span className="truncate max-w-[260px] text-muted-foreground">
                          Tx: {tx.transaction_hash || tx.id}
                        </span>
                        <span className="shrink-0 uppercase text-foreground">
                          {tx.type} • {formatAmount(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
