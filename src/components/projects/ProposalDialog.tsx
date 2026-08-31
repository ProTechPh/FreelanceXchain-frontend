'use client';

import { useId, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Paperclip, Send, ShieldAlert, Sparkles, Wand2, Check, RefreshCw, Eye, Edit3, X, FileText, Layers } from 'lucide-react';
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
import { getApiErrorMessage } from '@/lib/auth-contract';
import { proposalsApi, matchingApi, type AIProposalResult } from '@/lib/api';
import {
  ProposalFormValidationError,
  submitProposal,
  type ProposalSubmissionForm,
} from '@/lib/proposal-submission';
import { useAuthStore } from '@/stores/authStore';

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

const EMPTY_FORM: ProposalSubmissionForm = {
  proposedRate: '',
  estimatedDuration: '',
  files: [],
};

export function sanitizeMarkdownText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // Single quotes / apostrophes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // Double quotes
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-') // Hyphens & dashes
    .replace(/[\u2022\u2023\u25E6\u2043]/g, '-') // Bullet characters
    .replace(/[\u2026]/g, '...')                 // Ellipsis
    .replace(/[\u00A0\u2000-\u200B]/g, ' ')      // Non-breaking / special spaces
    .replace(/([1-9])\uFE0F?\u20E3/g, '$1.')     // Keycap emoji numbers like 1️⃣ -> 1.
    .replace(/[\uFE00-\uFE0F]/g, '');            // Variation selectors
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
${milestones.map((m, i) => `${i + 1}. **${m.title}** ($${m.amount.toLocaleString()} - ${m.durationDays} days)\n   ${m.description}`).join('\n\n')}

---
Submitted via FreelanceXchain Decentralized Platform with Smart Contract Escrow Protection.
`;

  const cleanContent = sanitizeMarkdownText(rawContent);
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(cleanContent);
  const blob = new Blob([utf8Bytes], { type: 'text/markdown; charset=utf-8' });
  return new File([blob], `Proposal_${safeTitle || 'Brief'}.md`, { type: 'text/markdown; charset=utf-8' });
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

  const [form, setForm] = useState<ProposalSubmissionForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiProposal, setAiProposal] = useState<AIProposalResult | null>(null);
  const [customNotes, setCustomNotes] = useState('');
  const [showCustomNotes, setShowCustomNotes] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [editableCoverLetter, setEditableCoverLetter] = useState('');

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

      // Auto-fill proposed rate & estimated duration
      setForm((current) => {
        const autoFile = createProposalDocumentFile(
          project.title,
          cleanCoverLetter,
          (data.highlights || []).map(sanitizeMarkdownText),
          data.proposedMilestones || []
        );

        // Keep any user-uploaded files, replace or prepend the auto-generated brief
        const otherFiles = current.files.filter((f) => !f.name.startsWith('Proposal_'));
        const updatedFiles = [autoFile, ...otherFiles].slice(0, 5);

        return {
          ...current,
          proposedRate: String(data.proposedRate || project.budget || ''),
          estimatedDuration: String(data.estimatedDuration || 14),
          files: updatedFiles,
        };
      });

      toast.success('AI Proposal drafted based on your portfolio & reputation!');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to generate AI proposal. You can still fill it manually.'));
    } finally {
      setGeneratingAI(false);
    }
  }, [project]);

  useEffect(() => {
    if (open && initialGenerateAI && project && !aiProposal && !generatingAI) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void handleGenerateAI();
    }
  }, [open, initialGenerateAI, project, aiProposal, generatingAI, handleGenerateAI]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!submitting && !generatingAI) {
      if (!nextOpen) {
        setForm(EMPTY_FORM);
        setAiProposal(null);
        setCustomNotes('');
        setShowCustomNotes(false);
        setEditableCoverLetter('');
      }
      onOpenChange(nextOpen);
    }
  };

  const handleCoverLetterChange = (newText: string) => {
    const cleanText = sanitizeMarkdownText(newText);
    setEditableCoverLetter(cleanText);
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
          files: [updatedFile, ...otherFiles].slice(0, 5),
        };
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;

    setSubmitting(true);
    try {
      const submissionForm: ProposalSubmissionForm = {
        ...form,
        coverLetter: editableCoverLetter ? sanitizeMarkdownText(editableCoverLetter) : undefined,
      };
      await submitProposal(proposalsApi, project.id, submissionForm);
      toast.success('Proposal submitted successfully!');
      onSubmitted?.();
      handleOpenChange(false);
    } catch (error) {
      const message = error instanceof ProposalFormValidationError
        ? error.message
        : getApiErrorMessage(error, 'Failed to submit proposal');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:w-full sm:max-w-2xl">
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
            {project ? `Send your proposal for “${project.title}”.` : 'Send your offer for this project.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
        {!isKycApproved && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-xs text-warning space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <ShieldAlert className="size-4 text-warning shrink-0" />
              <span>Identity Verification (KYC) Required</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Smart contract payments and escrow protection require a verified identity before submitting proposals.
            </p>
            <Button asChild size="sm" variant="outline" className="text-xs h-8">
              <Link href="/dashboard/freelancer/verification">
                Complete Verification Now →
              </Link>
            </Button>
          </div>
        )}

        {/* AI Proposal Generator Banner */}
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
          </div>

          {/* Optional notes for AI customization */}
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

        {/* AI Proposal Preview & Highlights if generated */}
        {aiProposal && (
          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-3 sm:p-4">
            {/* Highlights pills */}
            {aiProposal.highlights && aiProposal.highlights.length > 0 && (
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

            {/* Proposal Pitch Tabs & Editor */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-b border-border/80 pb-2">
                <span className="text-2xs font-semibold text-foreground uppercase tracking-wider sm:text-xs">
                  Generated Proposal Pitch
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
                  <Markdown content={editableCoverLetter} className="text-xs sm:text-sm" />
                </div>
              ) : (
                <Textarea
                  value={editableCoverLetter}
                  onChange={(e) => handleCoverLetterChange(e.target.value)}
                  rows={8}
                  className="max-h-52 min-h-40 font-mono text-2xs leading-relaxed sm:max-h-none sm:text-xs"
                  placeholder="Customize your proposal pitch here..."
                />
              )}
            </div>

            {/* Proposed Milestones plan */}
            {aiProposal.proposedMilestones && aiProposal.proposedMilestones.length > 0 && (
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
                      <p className="text-xs font-medium text-primary">${m.amount.toLocaleString()} USDC</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-rate`}>Proposed rate (USD)</Label>
              <Input
                id={`${fieldId}-rate`}
                type="number"
                min="0.0001"
                step="any"
                inputMode="decimal"
                value={form.proposedRate}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  proposedRate: event.target.value,
                }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-duration`}>Estimated duration (days)</Label>
              <Input
                id={`${fieldId}-duration`}
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.estimatedDuration}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  estimatedDuration: event.target.value,
                }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <Label htmlFor={`${fieldId}-files`}>Proposal attachments</Label>
              {form.files.some((f) => f.name.startsWith('Proposal_')) && (
                <span className="flex items-center gap-1 text-2xs font-medium text-success">
                  <Check className="size-3 shrink-0" /> AI brief document attached automatically
                </span>
              )}
            </div>
            <Input
              id={`${fieldId}-files`}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.zip,.rar,.7z,.json,.xml,.mp4,.webm,.mov,.md,.txt"
              className="text-xs file:text-xs"
              onChange={(event) => {
                const newFiles = Array.from(event.target.files ?? []);
                setForm((current) => {
                  const autoBrief = current.files.filter((f) => f.name.startsWith('Proposal_'));
                  return {
                    ...current,
                    files: [...autoBrief, ...newFiles].slice(0, 5),
                  };
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Attach 1–5 files (up to 10 MB each, 25 MB total).
            </p>
            {form.files.length > 0 && (
              <ul className="space-y-1 text-sm" aria-label="Selected proposal files">
                {form.files.map((file, idx) => (
                  <li key={`${file.name}-${idx}`} className="flex items-center justify-between gap-2 rounded-md bg-secondary/30 px-2.5 py-1 text-2xs text-muted-foreground sm:text-xs">
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      {file.name.startsWith('Proposal_') ? (
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate font-medium text-foreground">{file.name}</span>
                      {file.name.startsWith('Proposal_') && (
                        <Badge variant="secondary" className="text-2xs py-0 px-1 text-primary">Auto-Generated</Badge>
                      )}
                    </span>
                    <button
                      type="button"
                      className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setForm((c) => ({ ...c, files: c.files.filter((_, i) => i !== idx) }))}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
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
            loadingText="Submitting Proposal…"
            disabled={!isKycApproved || submitting || generatingAI || form.files.length === 0}
          >
            <Send className="size-4" aria-hidden="true" />
            {isKycApproved ? 'Submit proposal' : 'Verification required'}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
