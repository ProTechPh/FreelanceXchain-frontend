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
import { StarRating } from '@/components/ui/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { appRatingsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import {
  MAX_COMMENT_LENGTH,
  validateAppRatingDraft,
  type AppRatingSource,
} from '@/lib/app-rating-prompt';

type RateAppDialogProps = {
  open: boolean;
  source: AppRatingSource;
  contextId?: string | undefined;
  onOpenChange: (open: boolean) => void;
  /** Called when the dialog closes without a submission. */
  onDismiss: () => void;
  onSubmitted: () => void;
};

export function RateAppDialog({
  open,
  source,
  contextId,
  onOpenChange,
  onDismiss,
  onSubmitted,
}: RateAppDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset on the way out rather than on the way in. Every close path funnels
  // through here, so the next opening is always a fresh answer — a half-typed
  // comment from last month is not something anyone wants to find waiting.
  const close = (submitted: boolean) => {
    onOpenChange(false);
    setRating(0);
    setComment('');
    if (submitted) onSubmitted();
    else onDismiss();
  };

  const handleSubmit = async () => {
    const error = validateAppRatingDraft({ rating, comment });
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    try {
      const trimmed = comment.trim();
      await appRatingsApi.submit({
        rating,
        ...(trimmed ? { comment: trimmed } : {}),
        source,
        ...(contextId ? { contextId } : {}),
      });
      toast.success('Thanks — that helps.');
      close(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not send your rating. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX_COMMENT_LENGTH - comment.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Escape, the backdrop and the X all mean the same thing as "Not now".
        if (!next && !submitting) close(false);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How is FreelanceXchain working for you?</DialogTitle>
          <DialogDescription>
            This is about the platform itself, not the person you worked with. Your name is visible
            to the FreelanceXchain team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Your rating</Label>
            <StarRating
              value={rating}
              onChange={setRating}
              size="lg"
              showLabel
              aria-label="Rate FreelanceXchain"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-rating-comment">
              Anything you want to add? <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="app-rating-comment"
              placeholder="What worked well, or what got in your way?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={MAX_COMMENT_LENGTH}
              disabled={submitting}
            />
            {/* Only worth showing once it is close enough to matter. */}
            {remaining < 200 && (
              <p className="text-right text-xs text-muted-foreground">{remaining} characters left</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)} disabled={submitting}>
            Not now
          </Button>
          <Button
            variant="gradient"
            onClick={handleSubmit}
            disabled={rating === 0}
            loading={submitting}
            loadingText="Sending…"
          >
            Send feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
