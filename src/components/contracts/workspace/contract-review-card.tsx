'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ReviewDraft } from '@/lib/review-form';

interface ContractReviewCardProps {
  reviewEligibility: { canRate: boolean; reason?: string };
  isVerified: boolean;
  review: ReviewDraft;
  actionId: string | null;
  onReviewChange: (review: ReviewDraft) => void;
  onSubmitReview: (e: React.FormEvent) => void;
}

export function ContractReviewCard({
  reviewEligibility,
  isVerified,
  review,
  actionId,
  onReviewChange,
  onSubmitReview,
}: ContractReviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract review</CardTitle>
      </CardHeader>
      <CardContent>
        {reviewEligibility.canRate && isVerified ? (
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmitReview}>
            {([
              ['rating', 'Overall rating'],
              ['workQuality', 'Work quality'],
              ['communication', 'Communication'],
              ['professionalism', 'Professionalism'],
            ] as const).map(([field, label]) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`review-${field}`}>{label}</Label>
                <select
                  id={`review-${field}`}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={review[field]}
                  onChange={(event) =>
                    onReviewChange({ ...review, [field]: Number(event.target.value) })
                  }
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} star{value === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="review-comment">Comment</Label>
              <Textarea
                id="review-comment"
                rows={4}
                maxLength={2000}
                value={review.comment}
                onChange={(event) => onReviewChange({ ...review, comment: event.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={review.wouldWorkAgain}
                onChange={(event) =>
                  onReviewChange({ ...review, wouldWorkAgain: event.target.checked })
                }
              />
              I would work with this person again
            </label>
            <Button className="sm:w-fit" type="submit" disabled={actionId === 'review'}>
              {actionId === 'review' ? 'Submitting…' : 'Submit review'}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            {reviewEligibility.reason ||
              (isVerified
                ? 'A review is not available for this contract.'
                : 'Complete identity verification to submit a review.')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
