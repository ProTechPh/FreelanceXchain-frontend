export type ReviewDraft = {
  rating: number;
  comment: string;
  workQuality: number;
  communication: number;
  professionalism: number;
  wouldWorkAgain: boolean;
};

function validRating(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function validateReviewDraft(draft: ReviewDraft): string | null {
  if (!validRating(draft.rating)) return 'Overall rating must be between 1 and 5.';
  if (!draft.comment.trim()) return 'Add a comment about the completed contract.';
  if (![draft.workQuality, draft.communication, draft.professionalism].every(validRating)) {
    return 'Category ratings must be between 1 and 5.';
  }
  return null;
}
