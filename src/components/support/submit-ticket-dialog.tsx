'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supportTicketsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_SUBJECT_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MIN_SUBJECT_LENGTH,
  TICKET_CATEGORY_LABELS,
  TICKET_CATEGORY_ORDER,
} from '@/lib/support-tickets';
import type { SupportTicket, SupportTicketCategory } from '@/types';

type SubmitTicketDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the created ticket, so the caller can show it without refetching. */
  onSubmitted: (ticket: SupportTicket) => void;
};

/**
 * The ticket form.
 *
 * Mirrors RateAppDialog in ../feedback: reset on the way out rather than on the
 * way in, so every close path leaves a clean form behind and nobody returns to
 * find last week's half-typed complaint waiting.
 */
export function SubmitTicketDialog({ open, onOpenChange, onSubmitted }: SubmitTicketDialogProps) {
  const [category, setCategory] = useState<SupportTicketCategory | ''>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const close = (created?: SupportTicket) => {
    onOpenChange(false);
    setCategory('');
    setSubject('');
    setDescription('');
    if (created) onSubmitted(created);
  };

  const trimmedSubject = subject.trim();
  const trimmedDescription = description.trim();
  const canSubmit =
    category !== '' &&
    trimmedSubject.length >= MIN_SUBJECT_LENGTH &&
    trimmedDescription.length >= MIN_DESCRIPTION_LENGTH;

  const handleSubmit = async () => {
    if (category === '') return;
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      // The response is the stored ticket, so the list can show it directly —
      // re-reading it would cost another round trip for a row we already hold.
      const { data } = await supportTicketsApi.submit({
        subject: trimmedSubject,
        description: trimmedDescription,
        category,
      });
      toast.success('Ticket submitted. We will reply here and notify you.');
      close(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not submit your ticket. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const descriptionRemaining = MAX_DESCRIPTION_LENGTH - description.length;
  const descriptionShort = trimmedDescription.length > 0 && trimmedDescription.length < MIN_DESCRIPTION_LENGTH;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Escape, the backdrop and the X all mean "cancel" — but not mid-send,
        // where closing would hide a request the user cannot tell the fate of.
        if (!next && !submitting) close();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a ticket</DialogTitle>
          <DialogDescription>
            Tell us what went wrong and we will reply on this page. Your name and email are visible
            to the FreelanceXchain team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="ticket-category">What is this about?</Label>
            <Select
              value={category}
              onValueChange={(value) => {
                if (value) setCategory(value as SupportTicketCategory);
              }}
            >
              <SelectTrigger id="ticket-category" disabled={submitting}>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {TICKET_CATEGORY_ORDER.map((value) => (
                  <SelectItem key={value} value={value}>
                    {TICKET_CATEGORY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input
              id="ticket-subject"
              placeholder="Payout from an approved milestone has not arrived"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={MAX_SUBJECT_LENGTH}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">What happened?</Label>
            <Textarea
              id="ticket-description"
              placeholder="Include anything that would help us find it — dates, a contract or project name, and what you expected to happen instead."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              maxLength={MAX_DESCRIPTION_LENGTH}
              disabled={submitting}
            />
            <div className="flex items-start justify-between gap-3 text-xs">
              {/* The floor is enforced server-side, so say so before the send
                  rather than bouncing a filled-in form back. */}
              <p className={descriptionShort ? 'text-warning' : 'text-muted-foreground'}>
                {descriptionShort
                  ? `A few more details, please — at least ${MIN_DESCRIPTION_LENGTH} characters.`
                  : 'The more specific, the faster we can answer.'}
              </p>
              {descriptionRemaining < 400 && (
                <p className="shrink-0 text-muted-foreground">{descriptionRemaining} left</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => close()} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
            loadingText="Sending…"
          >
            Submit ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
