'use client';

import { useId, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Paperclip, Send, ShieldAlert, Sparkles, Wand2, Check, RefreshCw, Eye, Edit3, X, FileText, Layers, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Markdown } from '@/components/ui/markdown';
import { Alert } from '@/components/ui/alert';
import { Field, useField } from '@/components/ui/field';
import { reportFailure } from '@/lib/report-failure';
import { formatAmount } from '@/lib/format';
import { formatFileSize } from '@/lib/attachment-presentation';
import { cn } from '@/lib/utils';
import { matchingApi, type AIProposalResult } from '@/lib/api';
import { UpgradeButton } from '@/components/billing/upgrade-button';
import { usePlan } from '@/hooks/use-plan';
import { useRateApp } from '@/components/feedback/rate-app-provider';
import {
  MAX_COVER_LETTER_LENGTH,
  MAX_DURATION_DAYS,
  MAX_FILE_COUNT,
  MAX_PROPOSED_RATE,
  MIN_PROPOSED_RATE,
} from '@/lib/proposal-submission';
import {
  DOCUMENT_ACCEPT_STRING,
} from '@/lib/file-validation';
import { useAuthStore } from '@/stores/authStore';
import { useProposalForm } from '@/hooks/use-proposal-form';

interface ProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
  project: {
    id: string;
    title: string;
    budget: number;
  } | null;
  initialGenerateAI?: boolean;
}

export function sanitizeMarkdownText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-')
    .replace(/[\u2022\u2023\u25E6\u2043]/g, '-')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u00A0\u2000-\u200B]/g, ' ')
    .replace(/([1-9])\uFE0F?\u20E3/g, '$1.')
    .replace(/[\uFE00-\uFE0F]/g, '');
}

function createProposalDocumentFile(
  projectTitle: string,
  coverLetter: string,
  highlights: string[],
  milestones: Array<{ title: string; description: string; amount: number; durationDays: number }>
): File {
  const safeTitle = projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const rawContent = `# Proposal: ${projectTitle}
Generated on: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

## Key Qualifications & Highlights
${highlights.map((h) => `- ${h}`).join('\n')}

## Proposal & Technical Strategy
${coverLetter}

## Proposed Milestones & Delivery Schedule
${milestones.map((m, i) => `${i + 1}. **${m.title}** (${formatAmount(m.amount)} - ${m.durationDays} days)\n   ${m.description}`).join('\n\n')}

---
Submitted via FreelanceXchain Decentralized Platform with Smart Contract Escrow Protection.
`;

  const cleanContent = sanitizeMarkdownText(rawContent);
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(cleanContent);
  const blob = new Blob([utf8Bytes], { type: 'text/markdown; charset=utf-8' });
  return new File([blob], `Proposal_${safeTitle || 'Brief'}.md`, { type: 'text/markdown; charset=utf-8' });
}

function FieldInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...useField()} {...props} />;
}

export function ProposalDialog({
  open,
  onOpenChange,
  onSubmitted,
  project,
  initialGenerateAI = false,
}: ProposalDialogProps) {
  const user = useAuthStore((state) => state.user);
  const isKycApproved = user?.kycStatus === 'approved';
  const fieldId = useId();

  const {
    form,
    setForm,
    fieldError,
    setFieldError,
    submitting,
    handleSubmit: submitForm,
    handleRateChange,
    handleDurationChange,
    handleFilesChange,
    handleRemoveFile,
    updateFormWithAI,
    resetForm,
  } = useProposalForm({
    projectId: project?.id ?? '',
    projectTitle: project?.title ?? '',
    projectBudget: project?.budget ?? 0,
    onSubmitted,
  });

  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiProposal, setAiProposal] = useState<AIProposalResult | null>(null);
  const [customNotes, setCustomNotes] = useState('');
  const [showCustomNotes, setShowCustomNotes] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [editableCoverLetter, setEditableCoverLetter] = useState('');
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const blockedReason = !isKycApproved
    ? 'Complete identity verification first — go to Verification in your dashboard.'
    : null;

  const { isPro } = usePlan();
  const proBlockedReason = !isPro ? 'Drafting with AI is a Pro feature.' : null;

  const { requestRatingPrompt } = useRateApp();

  const handleGenerateAI = useCallback(async (notes?: string) => {
    if (!project) return;
    setGeneratingAI(true);
    try {
      const res = await matchingApi.generateProposal(project.id, notes?.trim() || undefined);
      const data = res.data;
      const cleanCoverLetter = sanitizeMarkdownText(data.coverLetter);
      setAiProposal({
        ...data,
        coverLetter: cleanCoverLetter,
        highlights: (data.highlights || []).map(sanitizeMarkdownText),
      });
      setEditableCoverLetter(cleanCoverLetter);

      const autoFile = createProposalDocumentFile(
        project.title,
        cleanCoverLetter,
        (data.highlights || []).map(sanitizeMarkdownText),
        data.proposedMilestones || []
      );

      updateFormWithAI({
        proposedRate: data.proposedRate || project.budget || 0,
        estimatedDuration: data.estimatedDuration || 14,
        files: [autoFile],
      });

      toast.success('AI Proposal drafted based on your portfolio & reputation!');
      requestRatingPrompt('ai_proposal_draft', project.id);
    } catch (error) {
      reportFailure(error, 'draft your proposal with AI');
    } finally {
      setGeneratingAI(false);
    }
  }, [project, requestRatingPrompt, updateFormWithAI]);

  useEffect(() => {
    if (open && initialGenerateAI && isPro && project && !aiProposal && !generatingAI) {
      let mounted = true;

      async function run() {
        if (!mounted) return;
        await handleGenerateAI();
      }

      run().catch(console.error);

      return () => {
        mounted = false;
      };
    }
  }, [open, initialGenerateAI, isPro, project, aiProposal, generatingAI, handleGenerateAI]);

  const isDirty = Boolean(
    editableCoverLetter.trim() ||
    form.proposedRate ||
    form.estimatedDuration ||
    form.files.length > 0 ||
    customNotes.trim() ||
    aiProposal
  );

  const resetAndClose = () => {
    resetForm();
    setAiProposal(null);
    setCustomNotes('');
    setShowCustomNotes(false);
    setEditableCoverLetter('');
    setConfirmDiscardOpen(false);
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting || generatingAI) return;
    if (!nextOpen && isDirty) {
      setConfirmDiscardOpen(true);
      return;
    }
    if (!nextOpen) {
      resetAndClose();
      return;
    }
    onOpenChange(nextOpen);
  };

  const handleCoverLetterChange = (newText: string) => {
    const cleanText = sanitizeMarkdownText(newText);
    setEditableCoverLetter(cleanText);
    setFieldError((current) => (current?.field === 'coverLetter' ? null : current));
    if (project && aiProposal) {
      const updatedFile = createProposalDocumentFile(
        project.title,
        cleanText,
        aiProposal.highlights,
        aiProposal.proposedMilestones || []
      );
      setForm((current) => {
        const otherFiles = current.files.filter((f) => !f.name.startsWith('Proposal_'));
        return {
          ...current,
          files: [updatedFile, ...otherFiles].slice(0, MAX_FILE_COUNT),
        };
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;
    const success = await submitForm(editableCoverLetter ? sanitizeMarkdownText(editableCoverLetter) : undefined);
    if (success) {
      // The proposal is sent, so nothing here is a draft any more: clear the AI
      // state too and close without the discard prompt.
      resetAndClose();
      requestRatingPrompt('proposal_submitted', project.id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh] sm:w-full sm:max-w-2xl">
        <DialogHeader className="shrink-0 gap-1.5 border-b border-border/60 px-4 pt-4 pr-12 pb-3 text-left sm:px-5 sm:pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg font-bold sm:text-xl">Submit Proposal</DialogTitle>
            {aiProposal && (
              <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20 text-xs py-0.5">
                <Sparkles className="size-3" /> AI Tailored
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs break-words sm:text-sm">
            {project ? `Send your proposal for "${project.title}".` : 'Send your offer for this project.'}
          </DialogDescription>
        </DialogHeader>

        {/* findProposalFormError owns validation and shows it under each field;
            native bubbles would pre-empt it with differently worded messages. */}
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
        {!isKycApproved && (
          <Alert
            tone="warning"
            live={false}
            title="Your identity isn't verified yet"
            description="You need a verified identity to submit proposals and receive escrow payments. It takes about 2 minutes."
            action={(
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link href="/dashboard/freelancer/verification">Verify now — takes ~2 min</Link>
              </Button>
            )}
          />
        )}

        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3 space-y-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                <Sparkles className="size-4 text-primary animate-pulse" />
                <span>AI Proposal Assistant</span>
              </div>
              <p className="text-2xs text-muted-foreground sm:text-xs">
                Automatically drafts a tailored pitch using your <strong>portfolio projects</strong>, <strong>verified skills</strong>, and <strong>on-chain reputation</strong>.
              </p>
            </div>
            {isPro ? (
              <Button
                type="button"
                variant={aiProposal ? 'outline' : 'gradient'}
                size="sm"
                loading={generatingAI}
                loadingText="Analyzing & Drafting…"
                disabled={generatingAI || submitting}
                onClick={() => void handleGenerateAI(customNotes)}
                className="w-full shrink-0 font-medium sm:w-auto"
              >
                {aiProposal ? (
                  <>
                    <RefreshCw className="size-3.5 mr-1.5" /> Regenerate
                  </>
                ) : (
                  <>
                    <Wand2 className="size-3.5 mr-1.5" /> Draft with AI (1-Click)
                  </>
                )}
              </Button>
            ) : (
              <span
                title={proBlockedReason ?? undefined}
                className="w-full shrink-0 sm:w-auto"
              >
                <UpgradeButton
                  source="ai-proposal"
                  size="sm"
                  label="Upgrade to draft with AI"
                  className="w-full font-medium"
                />
              </span>
            )}
          </div>

          <div>
            {!showCustomNotes ? (
              <button
                type="button"
                className="text-xs text-primary hover:underline flex items-center gap-1"
                onClick={() => setShowCustomNotes(true)}
              >
                + Add specific instructions for the AI
              </button>
            ) : (
              <div className="space-y-2 pt-2">
                <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1 text-2xs text-muted-foreground sm:text-xs">
                  <span className="min-w-0 flex-1">Custom instructions (e.g. mention specific availability, discount, or focus):</span>
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCustomNotes(false)}
                  >
                    Hide
                  </button>
                </div>
                <Input
                  placeholder="e.g. I can start immediately and have 4 years DEX experience..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card/60 p-3 sm:p-4">
          {aiProposal && aiProposal.highlights && aiProposal.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {aiProposal.highlights.map((highlight, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="h-auto max-w-full shrink items-start gap-1.5 overflow-visible rounded-lg px-2.5 py-1 text-2xs leading-snug font-medium break-words whitespace-normal sm:text-xs"
                >
                  <Check className="mt-0.5 size-3 shrink-0 text-success" />
                  <span className="min-w-0">{highlight}</span>
                </Badge>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-b border-border/80 pb-2">
              <span className="text-2xs font-semibold text-foreground uppercase tracking-wider sm:text-xs">
                {aiProposal ? 'Generated Proposal Pitch' : 'Proposal Cover Letter / Pitch'}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setViewMode('preview')}
                >
                  <Eye className="size-3 mr-1" /> Preview
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setViewMode('edit')}
                >
                  <Edit3 className="size-3 mr-1" /> Edit Pitch
                </Button>
              </div>
            </div>

            {viewMode === 'preview' ? (
              <div className="max-h-52 overflow-y-auto overscroll-contain rounded-lg border border-border/50 bg-background/50 p-3 text-sm sm:max-h-60">
                <Markdown content={editableCoverLetter || '_No cover letter written yet._'} className="text-xs sm:text-sm" />
              </div>
            ) : (
              <div>
                <Textarea
                  value={editableCoverLetter}
                  onChange={(e) => handleCoverLetterChange(e.target.value)}
                  rows={8}
                  className="max-h-52 min-h-40 font-mono text-2xs leading-relaxed sm:max-h-none sm:text-xs"
                  placeholder="Introduce yourself, your experience, and outline your approach for this project..."
                  maxLength={MAX_COVER_LETTER_LENGTH}
                  aria-invalid={fieldError?.field === 'coverLetter' || undefined}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {editableCoverLetter.length.toLocaleString('en-US')} / {MAX_COVER_LETTER_LENGTH.toLocaleString('en-US')}
                </p>
              </div>
            )}
            {fieldError?.field === 'coverLetter' && (
              <p role="alert" className="mt-1 flex items-start gap-1.5 text-xs font-medium text-destructive">
                <ShieldAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {fieldError.message}
              </p>
            )}
          </div>

          {aiProposal?.proposedMilestones && aiProposal.proposedMilestones.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/80">
              <div className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground uppercase tracking-wider sm:text-xs">
                <Layers className="size-3.5 shrink-0" />
                <span>Proposed Milestone Execution Plan</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {aiProposal.proposedMilestones.map((m, idx) => (
                  <div key={idx} className="rounded-lg border border-border/60 bg-background/40 p-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{m.title}</span>
                      <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-2xs">{m.durationDays}d</Badge>
                    </div>
                    <p className="line-clamp-2 text-2xs text-muted-foreground break-words">{m.description}</p>
                    <p className="text-xs font-medium text-primary">{formatAmount(m.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Proposed rate (USD)"
              htmlFor={`${fieldId}-rate`}
              description={project ? `Client budget: ${formatAmount(project.budget)}` : undefined}
              error={fieldError?.field === 'proposedRate' ? fieldError.message : null}
              required
            >
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground" aria-hidden="true">
                  $
                </span>
                <FieldInput
                  type="number"
                  min={MIN_PROPOSED_RATE}
                  max={MAX_PROPOSED_RATE}
                  step="any"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="pl-7 pr-14 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={form.proposedRate}
                  onChange={(event) => handleRateChange(event.target.value)}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground" aria-hidden="true">
                  USD
                </span>
              </div>
            </Field>

            <Field
              label="Estimated duration (days)"
              htmlFor={`${fieldId}-duration`}
              description="Whole days from kickoff to final delivery."
              error={fieldError?.field === 'estimatedDuration' ? fieldError.message : null}
              required
            >
              <div className="relative">
                <FieldInput
                  type="number"
                  min="1"
                  max={MAX_DURATION_DAYS}
                  step="1"
                  inputMode="numeric"
                  placeholder="14"
                  className="pr-14 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={form.estimatedDuration}
                  onChange={(event) => handleDurationChange(event.target.value)}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground" aria-hidden="true">
                  days
                </span>
              </div>
            </Field>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
              <Label htmlFor={`${fieldId}-files`}>
                Proposal attachments <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                {form.files.length} of {MAX_FILE_COUNT} attached
              </span>
            </div>

            {form.files.length > 0 && (
              <ul className="space-y-2" aria-label="Selected proposal files">
                {form.files.map((file, idx) => {
                  const isBrief = file.name.startsWith('Proposal_');
                  const Icon = isBrief ? FileText : Paperclip;
                  return (
                    <li
                      key={`${file.name}-${idx}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-md',
                          isBrief ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                        )}
                        aria-hidden="true"
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{file.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {isBrief ? 'AI brief · generated from your pitch' : formatFileSize(file.size)}
                        </span>
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => handleRemoveFile(idx)}
                      >
                        <X className="size-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}

            {form.files.length < MAX_FILE_COUNT && (
              <label
                htmlFor={`${fieldId}-files`}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 transition-colors hover:border-primary/50 hover:bg-primary/5 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/50',
                  fieldError?.field === 'files' ? 'border-destructive' : 'border-border',
                )}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFilesChange(event.dataTransfer.files);
                }}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground" aria-hidden="true">
                  <Upload className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {form.files.length === 0 ? 'Choose files' : 'Add more files'}
                    <span className="font-normal text-muted-foreground"> or drag them here</span>
                  </span>
                  <span id={`${fieldId}-files-hint`} className="block text-xs text-muted-foreground">
                    PDF, Word, Excel, PowerPoint, text, CSV or images · up to 10 MB each, 25 MB total
                  </span>
                </span>
                <input
                  id={`${fieldId}-files`}
                  type="file"
                  multiple
                  accept={DOCUMENT_ACCEPT_STRING}
                  className="sr-only"
                  aria-describedby={`${fieldId}-files-hint`}
                  aria-invalid={fieldError?.field === 'files' || undefined}
                  onChange={(event) => {
                    handleFilesChange(event.target.files);
                    // Allow picking the same file again after removing it.
                    event.target.value = '';
                  }}
                />
              </label>
            )}

            {fieldError?.field === 'files' && (
              <p
                id={`${fieldId}-files-error`}
                role="alert"
                className="flex items-start gap-1.5 text-xs font-medium text-destructive"
              >
                <ShieldAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {fieldError.message}
              </p>
            )}
          </div>

        </div>
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 gap-2 px-4 py-3 sm:px-5">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => handleOpenChange(false)}
            disabled={submitting || generatingAI}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            className="w-full sm:w-auto"
            loading={submitting}
            loadingText="Submitting proposal…"
            disabled={!isKycApproved || submitting || generatingAI}
            title={blockedReason ?? undefined}
          >
            <Send className="size-4" aria-hidden="true" />
            {isKycApproved ? 'Submit proposal' : 'Identity verification required'}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Discard unsaved proposal?</DialogTitle>
          <DialogDescription>
            You have unsaved changes in your proposal pitch. If you exit now, your draft will be discarded.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDiscardOpen(false)}>
            Keep Editing
          </Button>
          <Button variant="destructive" onClick={resetAndClose}>
            Discard Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
