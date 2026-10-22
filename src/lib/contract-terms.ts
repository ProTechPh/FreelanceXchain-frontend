/**
 * Client-side mirror of the backend negotiation rules (FreelanceXchain-api
 * src/utils/contract-terms.ts) so the offer builder can show errors before a
 * round-trip. The server always re-validates; money math runs in 0.0001 ETH units.
 */
import type { ContractOffer, ContractOfferInput, OfferMilestoneDraft } from '@/types';

export const MAX_OFFER_MILESTONES = 20;

/** Contract amounts carry up to 4 decimals of ETH (0.0001 ETH ≈ ₱15); math runs in integer units. */
export const AMOUNT_DECIMALS = 4;
const UNITS_PER_ETH = 10 ** AMOUNT_DECIMALS;

export function toUnits(amount: number): number {
  return Math.round((Number.isFinite(amount) ? amount : 0) * UNITS_PER_ETH);
}

export function fromUnits(units: number): number {
  return units / UNITS_PER_ETH;
}

/** Round an ETH amount to the contract precision (used after peso → ETH conversion). */
export function roundEth(amount: number): number {
  return fromUnits(toUnits(amount));
}

/** The freelancer's floor at contract precision (rounded up should a rate carry more decimals). */
export function floorToUnits(floor: number): number {
  return fromUnits(Math.ceil(floor * UNITS_PER_ETH - 1e-6));
}

/** Lowest base amount an offer may use: half the freelancer's proposed rate, rounded up (mirrors the API). */
export function minimumBaseAmount(proposedRate: number): number {
  return fromUnits(Math.ceil(toUnits(floorToUnits(proposedRate)) * 0.5));
}

function hasAtMostDecimals(value: number, decimals: number = AMOUNT_DECIMALS): boolean {
  const scale = 10 ** decimals;
  return Math.abs(value * scale - Math.round(value * scale)) < 1e-6;
}

export function computeOfferTotals(input: {
  baseAmount: number;
  additionalPay?: number;
  isRush: boolean;
  rushFeePercentage?: number;
}): { rushFee: number; totalAmount: number } {
  const pct = input.isRush ? input.rushFeePercentage ?? 0 : 0;
  const rushFeeUnits = pct > 0 ? Math.round(toUnits(input.baseAmount) * pct / 100) : 0;
  const totalUnits = toUnits(input.baseAmount) + toUnits(input.additionalPay ?? 0) + rushFeeUnits;
  return { rushFee: fromUnits(rushFeeUnits), totalAmount: fromUnits(totalUnits) };
}

export function milestoneSum(milestones: Array<Pick<OfferMilestoneDraft, 'amount'>>): number {
  return fromUnits(milestones.reduce((sum, m) => sum + toUnits(m.amount), 0));
}

export type OfferDraftErrors = Record<string, string>;

export type OfferDraftValidation = {
  valid: boolean;
  errors: OfferDraftErrors;
  totals: { rushFee: number; totalAmount: number; allocated: number; remaining: number };
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Field errors keyed like `baseAmount`, `deadline`, `milestones.0.amount`, `milestones` (sum). */
export function validateOfferDraft(
  draft: ContractOfferInput,
  floor: number,
  options: { now?: Date; maxMilestones?: number } = {},
): OfferDraftValidation {
  const errors: OfferDraftErrors = {};
  const today = todayIso(options.now);
  const maxMilestones = options.maxMilestones ?? MAX_OFFER_MILESTONES;
  const totals = computeOfferTotals(draft);
  const allocated = milestoneSum(draft.milestones);
  const remaining = fromUnits(toUnits(totals.totalAmount) - toUnits(allocated));

  if (!(draft.baseAmount > 0) || !hasAtMostDecimals(draft.baseAmount)) {
    errors.baseAmount = 'Enter a base amount greater than 0 with at most 4 decimals.';
  } else if (toUnits(draft.baseAmount) < toUnits(minimumBaseAmount(floor))) {
    errors.baseAmount = `The base amount can't go below half of the freelancer's rate (${minimumBaseAmount(floor)} ETH).`;
  }
  if (draft.additionalPay < 0 || !hasAtMostDecimals(draft.additionalPay)) {
    errors.additionalPay = 'Additional pay must be 0 or more, with at most 4 decimals.';
  }
  if (draft.isRush && (!(draft.rushFeePercentage > 0) || draft.rushFeePercentage > 100 || !hasAtMostDecimals(draft.rushFeePercentage, 2))) {
    errors.rushFeePercentage = 'Rush fee must be between 0.01% and 100%.';
  }
  if (!DATE.test(draft.deadline)) {
    errors.deadline = 'Choose a deadline.';
  } else if (draft.deadline < today) {
    errors.deadline = "The deadline can't be in the past.";
  }

  if (draft.milestones.length === 0) {
    errors.milestones = 'Add at least one milestone.';
  } else if (draft.milestones.length > maxMilestones) {
    errors.milestones = `Use at most ${maxMilestones} milestones.`;
  }

  let previousDue = '';
  draft.milestones.forEach((m, i) => {
    if (!m.title.trim()) errors[`milestones.${i}.title`] = 'Add a title.';
    if ((m.description ?? '').length > 2000) errors[`milestones.${i}.description`] = 'Keep the description under 2000 characters.';
    if (!(m.amount > 0) || !hasAtMostDecimals(m.amount)) {
      errors[`milestones.${i}.amount`] = 'Enter an amount above 0 with at most 4 decimals.';
    }
    if (!DATE.test(m.dueDate)) {
      errors[`milestones.${i}.dueDate`] = 'Choose a due date.';
    } else if (m.dueDate < today) {
      errors[`milestones.${i}.dueDate`] = "The due date can't be in the past.";
    } else if (DATE.test(draft.deadline) && m.dueDate > draft.deadline) {
      errors[`milestones.${i}.dueDate`] = "The due date can't be after the deadline.";
    } else if (previousDue && m.dueDate < previousDue) {
      errors[`milestones.${i}.dueDate`] = 'Due dates must be in order.';
    }
    if (DATE.test(m.dueDate)) previousDue = m.dueDate;
  });

  if (!errors.milestones && draft.milestones.length > 0 && remaining !== 0) {
    errors.milestones = remaining > 0
      ? `Allocate ${remaining} ETH more across the milestones.`
      : `Milestones exceed the total by ${Math.abs(remaining)} ETH.`;
  }

  return { valid: Object.keys(errors).length === 0, errors, totals: { ...totals, allocated, remaining } };
}

/** Spread `total` across milestones proportionally to their current amounts (evenly when all are 0). */
export function autoBalanceMilestones<T extends Pick<OfferMilestoneDraft, 'amount'>>(milestones: T[], total: number): T[] {
  if (milestones.length === 0) return milestones;
  const totalUnits = toUnits(total);
  const weights = milestones.map(m => Math.max(0, toUnits(m.amount)));
  const weightSum = weights.reduce((s, w) => s + w, 0);
  let allocated = 0;
  return milestones.map((m, i) => {
    if (i === milestones.length - 1) return { ...m, amount: fromUnits(totalUnits - allocated) };
    const share = weightSum > 0 ? Math.round(totalUnits * weights[i]! / weightSum) : Math.floor(totalUnits / milestones.length);
    allocated += share;
    return { ...m, amount: fromUnits(share) };
  });
}

export type OfferChange = 'baseAmount' | 'additionalPay' | 'rush' | 'deadline' | 'milestones';

/** Which parts of an offer changed compared with the previous one (for highlighting counters). */
export function diffOffers(previous: ContractOffer | null | undefined, next: ContractOffer): Set<OfferChange> {
  const changes = new Set<OfferChange>();
  if (!previous) return changes;
  if (toUnits(previous.baseAmount) !== toUnits(next.baseAmount)) changes.add('baseAmount');
  if (toUnits(previous.additionalPay) !== toUnits(next.additionalPay)) changes.add('additionalPay');
  if (previous.isRush !== next.isRush || toUnits(previous.rushFeePercentage) !== toUnits(next.rushFeePercentage)) changes.add('rush');
  if (previous.deadline !== next.deadline) changes.add('deadline');
  const key = (o: ContractOffer) => JSON.stringify(o.milestones.map(m => [m.title, m.description, toUnits(m.amount), m.dueDate]));
  if (key(previous) !== key(next)) changes.add('milestones');
  return changes;
}

/** Starting draft for the builder: the open offer if any, otherwise the posting template at the floor rate. */
export function draftFromOffer(offer: ContractOffer | null, fallback: {
  floor: number;
  deadline: string | null;
  isRush: boolean;
  rushFeePercentage: number;
  milestones: OfferMilestoneDraft[];
}, now: Date = new Date()): ContractOfferInput {
  if (offer) {
    return {
      baseAmount: offer.baseAmount,
      additionalPay: offer.additionalPay,
      isRush: offer.isRush,
      rushFeePercentage: offer.rushFeePercentage,
      deadline: offer.deadline,
      milestones: offer.milestones.map(m => ({ title: m.title, description: m.description, amount: m.amount, dueDate: m.dueDate })),
    };
  }
  const today = todayIso(now);
  const deadline = fallback.deadline && fallback.deadline.slice(0, 10) >= today ? fallback.deadline.slice(0, 10) : '';
  const baseAmount = floorToUnits(fallback.floor);
  const totals = computeOfferTotals({ baseAmount, isRush: fallback.isRush, rushFeePercentage: fallback.rushFeePercentage });
  const milestones = fallback.milestones.length > 0
    ? fallback.milestones.map(m => ({ title: m.title, description: m.description ?? '', amount: m.amount, dueDate: (m.dueDate ?? '').slice(0, 10) }))
    : [{ title: 'Agreed deliverables', description: '', amount: totals.totalAmount, dueDate: deadline }];
  return {
    baseAmount,
    additionalPay: 0,
    isRush: fallback.isRush,
    rushFeePercentage: fallback.isRush ? fallback.rushFeePercentage : 0,
    deadline,
    milestones: autoBalanceMilestones(milestones, totals.totalAmount),
  };
}
