'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Eye, Paperclip, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  contractsApi,
  milestonesApi,
  paymentsApi,
  refundsApi,
  reviewsApi,
  rushUpgradesApi,
  transactionsApi,
} from '@/lib/api';
import {
  getContractPermissions,
  getMilestonePermissions,
  normalizeMilestone,
} from '@/lib/contract-workflow';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { StatusBadge } from '@/components/ui/status-badge';
import { hasApprovedKyc } from '@/lib/kyc-eligibility';
import { formatAmount } from '@/lib/format';
import { formatFileSize, safeAttachmentUrl } from '@/lib/attachment-presentation';
import { AttachmentPreviewDialog, type AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';
import { getTransactionDetailRoute } from '@/lib/transaction-view';
import { validateReviewDraft, type ReviewDraft } from '@/lib/review-form';
import { deployEscrowFromWallet } from '@/lib/wallet';
import { useAuthStore } from '@/stores/authStore';
import type { Contract, ContractFundInfo, ContractPaymentStatus, Dispute, Milestone, RefundRequest, RushUpgradeRequest, Transaction, UserRole } from '@/types';
import { ContractNegotiationPanel } from '@/components/contracts/contract-negotiation-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import { ContractPaymentHistory } from '@/components/contracts/contract-payment-history';
import { qk } from '@/lib/query-keys';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;
const initialReview: ReviewDraft = { rating: 5, comment: '', workQuality: 5, communication: 5, professionalism: 5, wouldWorkAgain: true };

export function ContractWorkspace({ contractId, role }: { contractId: string; role: ParticipantRole }) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [contract, setContract] = useState<Contract | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [rushRequests, setRushRequests] = useState<RushUpgradeRequest[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [fundInfo, setFundInfo] = useState<ContractFundInfo | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<ContractPaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [reviewEligibility, setReviewEligibility] = useState<{ canRate: boolean; reason?: string } | null>(null);
  const [review, setReview] = useState<ReviewDraft>(initialReview);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreviewTarget | null>(null);

  const loadWorkspace = useCallback(async () => {
    try {
      const contractResponse = await contractsApi.get(contractId);
      const loadedContract = contractResponse.data;
      setContract(loadedContract);

      const [milestoneResult, transactionResult, disputeResult, rushResult, refundResult, paymentResult, fundInfoResult] = await Promise.allSettled([
        milestonesApi.listForContract(contractId),
        transactionsApi.getForContract(contractId),
        contractsApi.getDisputes(contractId),
        rushUpgradesApi.list(contractId),
        refundsApi.list(contractId),
        paymentsApi.getStatus(contractId),
        role === 'employer' ? contractsApi.getFundInfo(contractId) : Promise.resolve(null),
      ]);

      const rawMilestones = milestoneResult.status === 'fulfilled'
        ? milestoneResult.value.data
        : loadedContract.milestones ?? [];
      setMilestones(rawMilestones.map(normalizeMilestone));
      setTransactions(transactionResult.status === 'fulfilled' ? transactionResult.value.data : []);
      setDisputes(disputeResult.status === 'fulfilled' ? disputeResult.value.data : []);
      setRushRequests(rushResult.status === 'fulfilled' ? rushResult.value.data : []);
      setRefunds(refundResult.status === 'fulfilled' ? refundResult.value.data : []);
      setPaymentStatus(paymentResult.status === 'fulfilled' ? paymentResult.value.data : null);
      setFundInfo(
        fundInfoResult.status === 'fulfilled' && fundInfoResult.value
          ? fundInfoResult.value.data
          : null,
      );

      if (loadedContract.status === 'completed') {
        const rateeId = role === 'employer' ? loadedContract.freelancerId : loadedContract.employerId;
        try {
          const { data } = await reviewsApi.canReview(loadedContract.id, rateeId);
          setReviewEligibility(data);
        } catch {
          setReviewEligibility(null);
        }
      } else {
        setReviewEligibility(null);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load this contract.'));
    } finally {
      setLoading(false);
    }
  }, [contractId, role]);

  useEffect(() => {
    // The workspace state is populated from authenticated backend resources after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadWorkspace();
  }, [loadWorkspace]);

  if (loading) {
    return <DetailSkeleton label="Loading contract" />;
  }

  if (!contract || !user) {
    return <Card><CardContent className="py-12 text-center text-muted-foreground">Contract unavailable.</CardContent></Card>;
  }

  const contractPermissions = getContractPermissions(contract.status, role, user.kycStatus);
  const isVerified = hasApprovedKyc(user.kycStatus);
  const verificationPath = `/dashboard/${role}/verification`;

  const runAction = async (id: string, action: () => Promise<unknown>, success: string) => {
    setActionId(id);
    try {
      await action();
      toast.success(success);
      // The ledger is a React Query resource, so refreshing the useState-backed
      // workspace is not enough to pick up the new payment row.
      void queryClient.invalidateQueries({ queryKey: qk.contractPayments(contractId) });
      await loadWorkspace();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'The contract action could not be completed.'));
    } finally {
      setActionId(null);
    }
  };

  const handleFundContract = async () => {
    setActionId('fund');
    try {
      await contractsApi.fund(contract.id);
      toast.success('Contract funded and activated.');
      void queryClient.invalidateQueries({ queryKey: qk.contractPayments(contractId) });
      await loadWorkspace();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Funding transaction failed or was rejected.'));
    } finally {
      setActionId(null);
    }
  };

  const submitMilestone = (milestone: Milestone) => {
    const selectedFiles = files[milestone.id] ?? [];
    if (selectedFiles.length === 0) {
      toast.error('Select at least one deliverable file.');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('files', file));
    formData.append('notes', notes[milestone.id] ?? '');
    void runAction(
      milestone.id,
      () => milestonesApi.submitWithFiles(milestone.id, formData),
      'Milestone submitted for review.',
    );
  };

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateReviewDraft(review);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setActionId('review');
    try {
      await reviewsApi.submit({ ...review, contractId: contract.id, comment: review.comment.trim() });
      setReviewEligibility({ canRate: false, reason: 'You have reviewed this contract.' });
      setReview(initialReview);
      toast.success('Review submitted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to submit this review.'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" className="-ml-3"><Link href={`/dashboard/${role}/contracts`}><ArrowLeft className="mr-2 size-4" />Back to contracts</Link></Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{contract.project?.title || contract.title || 'Contract'}</h1>
          <p className="mt-1 text-muted-foreground">Contract #{contract.id.slice(0, 8)}</p>
        </div>
        <StatusBadge status={contract.status} domain="contract" />
      </div>

      {!isVerified && ['pending', 'active', 'completed'].includes(contract.status) && (
        <Card className="border-warning-border bg-warning-subtle">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm"><ShieldCheck className="size-5 text-warning" />Identity verification is required before contract mutations.</p>
            <Button asChild size="sm" variant="outline"><Link href={verificationPath}>Complete verification</Link></Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div><p className="text-muted-foreground">Base amount</p><p className="font-semibold">{formatAmount(contract.baseAmount)}</p></div>
            <div><p className="text-muted-foreground">Rush fee</p><p className="font-semibold">{formatAmount(contract.rushFee)}</p></div>
            <div><p className="text-muted-foreground">Total</p><p className="font-semibold text-primary">{formatAmount(contract.totalAmount)}</p></div>
            <div><p className="text-muted-foreground">Escrow</p><p className="truncate font-mono text-xs">{contract.escrowAddress || 'Not funded'}</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {role === 'employer' && contract.status === 'pending' && !user.walletAddress && (
              <Button asChild variant="outline"><Link href="/dashboard/employer/settings">Connect wallet before funding</Link></Button>
            )}
            {contractPermissions.canFund && user.walletAddress && (
              <Button
                disabled={actionId === 'fund'}
                onClick={() => void handleFundContract()}
              >
                {actionId === 'fund' ? 'Deploying & Funding…' : 'Fund contract securely'}
              </Button>
            )}
            {contractPermissions.canCancel && (
              <Button
                variant="destructive"
                disabled={actionId === 'cancel'}
                onClick={() => {
                  if (window.confirm('Cancel this pending contract?')) {
                    void runAction('cancel', () => contractsApi.cancel(contract.id), 'Contract cancelled.');
                  }
                }}
              >Cancel contract</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Payment status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {paymentStatus ? (
              <>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-muted-foreground">Total</p><p className="font-semibold">{formatAmount(paymentStatus.totalAmount)}</p></div>
                  <div><p className="text-muted-foreground">Released</p><p className="font-semibold text-success">{formatAmount(paymentStatus.releasedAmount)}</p></div>
                  <div><p className="text-muted-foreground">Pending</p><p className="font-semibold text-warning">{formatAmount(paymentStatus.pendingAmount)}</p></div>
                </div>
                <div><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Release progress</span><span>{paymentStatus.totalAmount > 0 ? Math.round((paymentStatus.releasedAmount / paymentStatus.totalAmount) * 100) : 0}%</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-success" style={{ width: `${paymentStatus.totalAmount > 0 ? Math.min(100, (paymentStatus.releasedAmount / paymentStatus.totalAmount) * 100) : 0}%` }} /></div></div>
                <p className="text-xs text-muted-foreground">{paymentStatus.milestones.length} milestone{paymentStatus.milestones.length === 1 ? '' : 's'} tracked by the payment service.</p>
              </>
            ) : <p className="text-sm text-muted-foreground">Payment status is temporarily unavailable.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{role === 'employer' ? 'Funding prerequisites' : 'Escrow funding'}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {role === 'employer' && fundInfo ? (
              <>
                <div><p className="text-muted-foreground">Freelancer wallet</p><p className="truncate font-mono text-xs">{fundInfo.freelancerWallet}</p></div>
                <div><p className="text-muted-foreground">Platform arbiter</p><p className="truncate font-mono text-xs">{fundInfo.arbiterWallet || 'Configured'}</p></div>
                <p className="text-xs text-muted-foreground">Funding will prompt MetaMask to deposit {formatAmount(contract.totalAmount)} directly from your wallet into the secure smart contract escrow on the blockchain.</p>
              </>
            ) : (
              <p className="text-muted-foreground">{contract.escrowAddress ? 'This contract is funded through the secure smart contract escrow shown above.' : role === 'employer' ? 'Funding details are unavailable until both participant wallets are ready.' : 'The employer has not funded this contract yet.'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ContractNegotiationPanel
        contract={contract}
        role={role}
        currentUserId={user.id}
        kycStatus={user.kycStatus}
        rushRequests={rushRequests}
        refunds={refunds}
        onRefresh={loadWorkspace}
      />

      {contract.status === 'completed' && reviewEligibility && (
        <Card>
          <CardHeader><CardTitle>Contract review</CardTitle></CardHeader>
          <CardContent>
            {reviewEligibility.canRate && isVerified ? (
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitReview}>
                {([
                  ['rating', 'Overall rating'],
                  ['workQuality', 'Work quality'],
                  ['communication', 'Communication'],
                  ['professionalism', 'Professionalism'],
                ] as const).map(([field, label]) => (
                  <div key={field} className="space-y-2"><Label htmlFor={`review-${field}`}>{label}</Label><select id={`review-${field}`} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={review[field]} onChange={(event) => setReview((current) => ({ ...current, [field]: Number(event.target.value) }))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>)}</select></div>
                ))}
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="review-comment">Comment</Label><Textarea id="review-comment" rows={4} value={review.comment} onChange={(event) => setReview((current) => ({ ...current, comment: event.target.value }))} /></div>
                <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={review.wouldWorkAgain} onChange={(event) => setReview((current) => ({ ...current, wouldWorkAgain: event.target.checked }))} />I would work with this person again</label>
                <Button className="sm:w-fit" type="submit" disabled={actionId === 'review'}>{actionId === 'review' ? 'Submitting…' : 'Submit review'}</Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">{reviewEligibility.reason || (isVerified ? 'A review is not available for this contract.' : 'Complete identity verification to submit a review.')}</p>
            )}
          </CardContent>
        </Card>
      )}

      <section className="space-y-3" aria-labelledby="milestones-title">
        <h2 id="milestones-title" className="text-xl font-semibold">Milestones</h2>
        {milestones.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">No milestones found.</CardContent></Card>}
        {milestones.map((milestone) => {
          const permissions = getMilestonePermissions(milestone.status, role, user.kycStatus, contract.status);
          return (
            <Card key={milestone.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div><CardTitle className="text-base">{milestone.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p></div>
                  <StatusBadge status={milestone.status} domain="milestone" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <span><span className="text-muted-foreground">Amount:</span> {milestone.amount.toLocaleString()} ETH</span>
                  <span><span className="text-muted-foreground">Due:</span> {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'Not set'}</span>
                </div>
                {milestone.rejectionReason && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Revision requested: {milestone.rejectionReason}</p>}
                {(milestone.deliverableFiles ?? []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Deliverable Files ({(milestone.deliverableFiles ?? []).length})
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(milestone.deliverableFiles ?? []).map((file) => {
                        const url = safeAttachmentUrl(file.url);
                        return (
                          <div
                            key={`${file.filename}-${file.url}`}
                            className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Paperclip className="size-4 text-primary shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium truncate text-foreground">{file.filename}</p>
                                {file.size ? (
                                  <p className="text-3xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {url ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs px-2 hover:text-primary hover:bg-primary/10"
                                  onClick={() =>
                                    setPreviewAttachment({
                                      filename: file.filename,
                                      url: file.url,
                                      size: file.size,
                                      mimeType: file.mimeType,
                                    })
                                  }
                                >
                                  <Eye className="size-3 mr-1" /> View
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">Unavailable</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {permissions.canSubmit && (
                  <div className="space-y-3 rounded-lg border border-border p-4">
                    <div className="space-y-2"><Label htmlFor={`files-${milestone.id}`}>Deliverable files</Label><Input id={`files-${milestone.id}`} type="file" multiple onChange={(event) => setFiles((current) => ({ ...current, [milestone.id]: Array.from(event.target.files ?? []) }))} /></div>
                    <div className="space-y-2"><Label htmlFor={`notes-${milestone.id}`}>Submission notes</Label><textarea id={`notes-${milestone.id}`} className="min-h-24 w-full rounded-lg border border-input bg-transparent p-3 text-sm" value={notes[milestone.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [milestone.id]: event.target.value }))} /></div>
                    <Button disabled={actionId === milestone.id} onClick={() => submitMilestone(milestone)}>Submit milestone</Button>
                  </div>
                )}

                {permissions.canApprove && (
                  <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-end">
                    <Button disabled={actionId === milestone.id} onClick={() => runAction(milestone.id, () => milestonesApi.approve(milestone.id), 'Milestone approved and payment released.')}>Approve and release</Button>
                    <div className="flex-1 space-y-2"><Label htmlFor={`reject-${milestone.id}`}>Revision reason</Label><Input id={`reject-${milestone.id}`} value={rejectionReasons[milestone.id] ?? ''} onChange={(event) => setRejectionReasons((current) => ({ ...current, [milestone.id]: event.target.value }))} /></div>
                    <Button variant="outline" disabled={actionId === milestone.id || !(rejectionReasons[milestone.id] ?? '').trim()} onClick={() => runAction(milestone.id, () => milestonesApi.reject(milestone.id, rejectionReasons[milestone.id]!), 'Revision requested.')}>Request revision</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <ContractPaymentHistory contractId={contractId} userId={user.id} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Blockchain transactions</CardTitle></CardHeader>
          <CardContent>
            {transactions.length === 0 ? <p className="text-sm text-muted-foreground">No transactions recorded.</p> : (
              <ul className="space-y-3">
                {transactions.map((transaction) => (
                  <li key={transaction.id} className="border-b border-border pb-3 text-sm last:border-0">
                    <Link href={getTransactionDetailRoute(role, transaction.id)} className="flex items-center justify-between rounded-md outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">
                      <div>
                        <p className="font-medium capitalize">{transaction.type.replaceAll('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleString()}</p>
                        {transaction.transaction_hash && (
                          <p className="font-mono text-xs text-primary/80 truncate max-w-[200px]">
                            {transaction.transaction_hash.slice(0, 10)}…{transaction.transaction_hash.slice(-8)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p>{transaction.amount.toLocaleString()} ETH</p>
                        <Badge variant="secondary" className="capitalize">{transaction.status}</Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Disputes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {disputes.length === 0 ? <p className="text-sm text-muted-foreground">No disputes for this contract.</p> : disputes.map((dispute) => <Link key={dispute.id} href={`/dashboard/${role}/disputes/${dispute.id}`} className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary/30"><AlertTriangle className="mt-0.5 size-4 text-warning" /><div><p className="font-medium">{dispute.reason}</p><p className="text-muted-foreground">{dispute.status.replace('_', ' ')}</p></div></Link>)}
          </CardContent>
        </Card>
      </div>

      <AttachmentPreviewDialog
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
        attachment={previewAttachment}
      />
    </div>
  );
}
