'use client';

import { useId, useState } from 'react';
import { Loader2, Paperclip, Send } from 'lucide-react';
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
import { getApiErrorMessage } from '@/lib/auth-contract';
import { proposalsApi } from '@/lib/api';
import {
  ProposalFormValidationError,
  submitProposal,
  type ProposalSubmissionForm,
} from '@/lib/proposal-submission';

interface ProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
  project: {
    id: string;
    title: string;
    budget: number;
  } | null;
}

const EMPTY_FORM: ProposalSubmissionForm = {
  proposedRate: '',
  estimatedDuration: '',
  files: [],
};

export function ProposalDialog({ open, onOpenChange, onSubmitted, project }: ProposalDialogProps) {
  const fieldId = useId();
  const [form, setForm] = useState<ProposalSubmissionForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!submitting) {
      if (!nextOpen) setForm(EMPTY_FORM);
      onOpenChange(nextOpen);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) return;

    setSubmitting(true);
    try {
      await submitProposal(proposalsApi, project.id, form);
      toast.success('Proposal submitted successfully');
      onSubmitted?.();
      setForm(EMPTY_FORM);
      onOpenChange(false);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a proposal</DialogTitle>
          <DialogDescription>
            {project ? `Send your offer for “${project.title}”.` : 'Send your offer for this project.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-rate`}>Proposed rate (USD)</Label>
              <Input
                id={`${fieldId}-rate`}
                type="number"
                min="1"
                step="0.01"
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
            <Label htmlFor={`${fieldId}-files`}>Proposal attachments</Label>
            <Input
              id={`${fieldId}-files`}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.zip,.rar,.7z,.json,.xml,.mp4,.webm,.mov"
              onChange={(event) => setForm((current) => ({
                ...current,
                files: Array.from(event.target.files ?? []),
              }))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Attach 1–5 files, up to 10 MB each and 25 MB total.
            </p>
            {form.files.length > 0 && (
              <ul className="space-y-1 text-sm" aria-label="Selected proposal files">
                {form.files.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="flex items-center gap-2 text-muted-foreground">
                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {submitting ? 'Submitting…' : 'Submit Proposal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
