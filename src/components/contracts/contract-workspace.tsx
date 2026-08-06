'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, FileText, LoaderCircle, ShieldCheck } from 'lucide-react';
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
import { getStatusColor } from '@/lib/status-styles';
import { getTransactionDetailRoute } from '@/lib/transaction-view';
import { validateReviewDraft, type ReviewDraft } from '@/lib/review-form';
import { useAuthStore } from '@/stores/authStore';
import type { Contract, ContractFundInfo, ContractPaymentStatus, Dispute, Milestone, RefundRequest, RushUpgradeRequest, Transaction, UserRole } from '@/types';
import { ContractNegotiationPanel } from '@/components/contracts/contract-negotiation-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;
const initialReview: ReviewDraft = { rating: 5, comment: '', workQuality: 5, communication: 5, professionalism: 5, wouldWorkAgain: true };

export function ContractWorkspace({ contractId, role }: { contractId: string; role: ParticipantRole }) {
  const user = useAuthStore((state) => state.user);
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
    return <div className="flex min-h-64 items-center justify-center" role="status"><LoaderCircle className="size-8 animate-spin text-primary" /></div>;
  }

  if (!contract || !user) {
    return <Card><CardContent className="py-12 text-center text-muted-foreground">Contract unavailable.</CardContent></Card>;
  }

  const contractPermissions = getContractPermissions(contract.status, role, user.kycStatus);
  const isVerified = user.kycStatus === 'approved' || user.kycStatus === 'completed';
  const verificationPath = `/dashboard/${role}/verification`;

  const runAction = async (id: string, action: () => Promise<unknown>, success: string) => {
    setActionId(id);
    try {
      await action();
      toast.success(success);
      await loadWorkspace();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'The contract action could not be completed.'));
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
          <h1 className="text-2xl font-bold">{contract.project?.title || contract.title || 'Contract'}</h1>
          <p className="mt-1 text-muted-foreground">Contract #{contract.id.slice(0, 8)}</p>
        </div>
        <Badge className={getStatusColor(contract.status)}>{contract.status.replace('_', ' ')}</Badge>
      </div>

      {!isVerified && ['pending', 'active', 'completed'].includes(contract.status) && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm"><ShieldCheck className="size-5 text-amber-500" />Identity verification is required before contract mutations.</p>
            <Button asChild size="sm" variant="outline"><Link href={verificationPath}>Complete verification</Link></Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div><p className="text-muted-foreground">Base amount</p><p className="font-semibold">${contract.baseAmount.toLocaleString()}</p></div>
            <div><p className="text-muted-foreground">Rush fee</p><p className="font-semibold">${contract.rushFee.toLocaleString()}</p></div>
            <div><p className="text-muted-foreground">Total</p><p className="font-semibold text-primary">${contract.totalAmount.toLocaleString()}</p></div>
            <div><p className="text-muted-foreground">Escrow</p><p className="truncate font-mono text-xs">{contract.escrowAddress || 'Not funded'}</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {role === 'employer' && contract.status === 'pending' && !user.walletAddress && (
              <Button asChild variant="outline"><Link href="/dashboard/employer/settings">Connect wallet before funding</Link></Button>
            )}
            {contractPermissions.canFund && user.walletAddress && (
              <Button
                disabled={actionId === 'fund'}
                onClick={() => runAction('fund', () => contractsApi.fund(contract.id), 'Contract funded and activated.')}
              >
                {actionId === 'fund' ? 'Funding…' : 'Fund contract securely'}
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
                  <div><p className="text-muted-foreground">Total</p><p className="font-semibold">${paymentStatus.totalAmount.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Released</p><p className="font-semibold text-green-500">${paymentStatus.releasedAmount.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Pending</p><p className="font-semibold text-amber-500">${paymentStatus.pendingAmount.toLocaleString()}</p></div>
                </div>
                <div><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Release progress</span><span>{paymentStatus.totalAmount > 0 ? Math.round((paymentStatus.releasedAmount / paymentStatus.totalAmount) * 100) : 0}%</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-green-500" style={{ width: `${paymentStatus.totalAmount > 0 ? Math.min(100, (paymentStatus.releasedAmount / paymentStatus.totalAmount) * 100) : 0}%` }} /></div></div>
                <p className="text-xs text-muted-foreground">{paymentStatus.milestones.length} milestone{paymentStatus.milestones.length === 1 ? '' : 's'} tracked by the payment service.</p>
              </>
            ) : <p className="text-sm text-muted-foreground">Payment status is temporarily unavailable.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{role === 'employer' ? 'Funding prerequisites' : 'Escrow funding'}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {role === 'employer' && fundInfo ? <><div><p className="text-muted-foreground">Freelancer wallet</p><p className="truncate font-mono text-xs">{fundInfo.freelancerWallet}</p></div><div><p className="text-muted-foreground">Platform custodian</p><p className="truncate font-mono text-xs">{fundInfo.platformWallet}</p></div><p className="text-xs text-muted-foreground">The backend will fund {fundInfo.milestoneDescriptions.length} milestone{fundInfo.milestoneDescriptions.length === 1 ? '' : 's'}. No browser-side escrow deployment is required.</p></> : <p className="text-muted-foreground">{contract.escrowAddress ? 'This contract is funded through the platform-managed escrow shown above.' : role === 'employer' ? 'Funding details are unavailable until both participant wallets are ready.' : 'The employer has not funded this contract yet.'}</p>}
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
                  <Badge className={getStatusColor(milestone.status)}>{milestone.status.replace('_', ' ')}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <span><span className="text-muted-foreground">Amount:</span> ${milestone.amount.toLocaleString()}</span>
                  <span><span className="text-muted-foreground">Due:</span> {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'Not set'}</span>
                </div>
                {milestone.rejectionReason && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Revision requested: {milestone.rejectionReason}</p>}
                {(milestone.deliverableFiles ?? []).length > 0 && (
                  <ul className="space-y-2" aria-label="Deliverable files">
                    {(milestone.deliverableFiles ?? []).map((file) => (
                      <li key={file.url}><a href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline"><FileText className="size-4" />{file.filename}</a></li>
                    ))}
                  </ul>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
          <CardContent>
            {transactions.length === 0 ? <p className="text-sm text-muted-foreground">No transactions recorded.</p> : (
              <ul className="space-y-3">{transactions.map((transaction) => <li key={transaction.id} className="border-b border-border pb-3 text-sm last:border-0"><Link href={getTransactionDetailRoute(role, transaction.id)} className="flex items-center justify-between rounded-md outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"><div><p className="font-medium">{transaction.type.replaceAll('_', ' ')}</p><p className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleString()}</p></div><div className="text-right"><p>${transaction.amount.toLocaleString()}</p><Badge variant="secondary">{transaction.status}</Badge></div></Link></li>)}</ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Disputes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {disputes.length === 0 ? <p className="text-sm text-muted-foreground">No disputes for this contract.</p> : disputes.map((dispute) => <div key={dispute.id} className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm"><AlertTriangle className="mt-0.5 size-4 text-amber-500" /><div><p className="font-medium">{dispute.reason}</p><p className="text-muted-foreground">{dispute.status.replace('_', ' ')}</p></div></div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
