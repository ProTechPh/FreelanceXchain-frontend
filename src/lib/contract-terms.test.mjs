import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeOfferTotals,
  milestoneSum,
  validateOfferDraft,
  autoBalanceMilestones,
  diffOffers,
  draftFromOffer,
  todayIso,
  floorToUnits,
  minimumBaseAmount,
  roundEth,
} from './contract-terms.ts';

const now = new Date('2026-10-19T12:00:00Z');
const draft = (overrides = {}) => ({
  baseAmount: 2,
  additionalPay: 0.5,
  isRush: false,
  rushFeePercentage: 0,
  deadline: '2026-12-31',
  milestones: [
    { title: 'Design', description: '', amount: 1, dueDate: '2026-11-15' },
    { title: 'Build', description: '', amount: 1.5, dueDate: '2026-12-15' },
  ],
  ...overrides,
});

test('totals include the rush fee on the base amount only', () => {
  assert.deepEqual(computeOfferTotals({ baseAmount: 1.5, additionalPay: 0.2, isRush: true, rushFeePercentage: 25 }), { rushFee: 0.375, totalAmount: 2.075 });
  assert.deepEqual(computeOfferTotals({ baseAmount: 1, isRush: false, rushFeePercentage: 50 }), { rushFee: 0, totalAmount: 1 });
  assert.equal(milestoneSum([{ amount: 0.1 }, { amount: 0.2 }]), 0.3);
  assert.equal(todayIso(now), '2026-10-19');
});

test('a valid draft passes and reports totals', () => {
  const result = validateOfferDraft(draft(), 2, { now });
  assert.equal(result.valid, true);
  assert.equal(result.totals.totalAmount, 2.5);
  assert.equal(result.totals.remaining, 0);
});

test('the base amount can go down to half the freelancer rate but not below', () => {
  assert.equal(validateOfferDraft(draft({ baseAmount: 1.99, additionalPay: 0.51 }), 2, { now }).errors.baseAmount, undefined);
  assert.equal(validateOfferDraft(draft({ baseAmount: 1, additionalPay: 1.5 }), 2, { now }).errors.baseAmount, undefined);
  const result = validateOfferDraft(draft({ baseAmount: 0.9999, additionalPay: 1.5001 }), 2, { now });
  assert.equal(result.valid, false);
  assert.equal(result.errors.baseAmount, "The base amount can't go below half of the freelancer's rate (1 ETH).");
});

test('the minimum base amount is half the rate, rounded up to 4 decimals', () => {
  assert.equal(minimumBaseAmount(2), 1);
  assert.equal(minimumBaseAmount(0.1294), 0.0647);
  assert.equal(minimumBaseAmount(0.1535), 0.0768);
  assert.equal(minimumBaseAmount(0.0001), 0.0001);
});

test('unallocated or over-allocated totals are reported on milestones', () => {
  assert.match(validateOfferDraft(draft({ additionalPay: 1 }), 2, { now }).errors.milestones, /Allocate 0.5 ETH more/);
  assert.match(validateOfferDraft(draft({ additionalPay: 0 }), 2, { now }).errors.milestones, /exceed the total by 0.5/);
});

test('field-level errors for dates, titles, amounts and rush', () => {
  const result = validateOfferDraft(draft({
    isRush: true,
    rushFeePercentage: 0,
    additionalPay: -1,
    deadline: '2020-01-01',
    milestones: [
      { title: '', amount: 0, dueDate: '' },
      { title: 'B', amount: 1, dueDate: '2020-01-01', description: 'x'.repeat(2001) },
    ],
  }), 2, { now });
  assert.equal(result.valid, false);
  for (const key of ['rushFeePercentage', 'additionalPay', 'deadline', 'milestones.0.title', 'milestones.0.amount', 'milestones.0.dueDate', 'milestones.1.dueDate', 'milestones.1.description']) {
    assert.ok(result.errors[key], `expected error for ${key}`);
  }
  const order = validateOfferDraft(draft({ milestones: [
    { title: 'A', amount: 1, dueDate: '2026-12-20' },
    { title: 'B', amount: 1.5, dueDate: '2026-12-01' },
  ] }), 2, { now });
  assert.match(order.errors['milestones.1.dueDate'], /in order/);
  const late = validateOfferDraft(draft({ milestones: [{ title: 'A', amount: 2.5, dueDate: '2027-02-01' }] }), 2, { now });
  assert.match(late.errors['milestones.0.dueDate'], /after the deadline/);
  assert.match(validateOfferDraft(draft({ milestones: [] }), 2, { now }).errors.milestones, /at least one/);
  assert.match(validateOfferDraft(draft(), 2, { now, maxMilestones: 1 }).errors.milestones, /at most 1/);
  assert.match(validateOfferDraft(draft({ baseAmount: 0 }), 0, { now }).errors.baseAmount, /greater than 0/);
});

test('auto-balance keeps proportions and exact totals', () => {
  const balanced = autoBalanceMilestones([{ amount: 1 }, { amount: 3 }], 2);
  assert.deepEqual(balanced.map(m => m.amount), [0.5, 1.5]);
  assert.deepEqual(autoBalanceMilestones([{ amount: 0 }, { amount: 0 }, { amount: 0 }], 1).map(m => m.amount), [0.3333, 0.3333, 0.3334]);
  assert.deepEqual(autoBalanceMilestones([], 1), []);
});

test('diffOffers highlights what changed', () => {
  const base = { baseAmount: 2, additionalPay: 0, isRush: false, rushFeePercentage: 0, deadline: '2026-12-31', milestones: [{ title: 'A', description: '', amount: 2, dueDate: '2026-12-01' }] };
  assert.equal(diffOffers(null, base).size, 0);
  const changes = diffOffers(base, { ...base, baseAmount: 3, isRush: true, deadline: '2027-01-01', milestones: [{ ...base.milestones[0], amount: 3 }], additionalPay: 1 });
  assert.deepEqual([...changes].sort(), ['additionalPay', 'baseAmount', 'deadline', 'milestones', 'rush']);
});

test('builder drafts start from the open offer or the posting template', () => {
  const offer = { baseAmount: 3, additionalPay: 1, isRush: true, rushFeePercentage: 10, deadline: '2026-12-01', milestones: [{ title: 'A', description: 'd', amount: 4.3, dueDate: '2026-11-01' }] };
  assert.deepEqual(draftFromOffer(offer, { floor: 1, deadline: null, isRush: false, rushFeePercentage: 0, milestones: [] }, now).milestones[0].amount, 4.3);
  const fromTemplate = draftFromOffer(null, {
    floor: 2, deadline: '2026-12-31T00:00:00Z', isRush: true, rushFeePercentage: 10,
    milestones: [{ title: 'A', amount: 1, dueDate: '2026-11-01T00:00:00Z' }, { title: 'B', amount: 1, dueDate: '2026-12-01' }],
  }, now);
  assert.equal(fromTemplate.deadline, '2026-12-31');
  assert.deepEqual(fromTemplate.milestones.map(m => m.amount), [1.1, 1.1]);
  const empty = draftFromOffer(null, { floor: 2, deadline: '2020-01-01', isRush: false, rushFeePercentage: 25, milestones: [] }, now);
  assert.equal(empty.deadline, '');
  assert.equal(empty.rushFeePercentage, 0);
  assert.equal(empty.milestones[0].amount, 2);
});

test('4-decimal proposed rates are the exact floor', () => {
  assert.equal(floorToUnits(0.1534), 0.1534);
  assert.equal(floorToUnits(0.15345), 0.1535);
  assert.equal(validateOfferDraft(draft({ baseAmount: 0.15, additionalPay: 2.35 }), 0.1534, { now }).errors.baseAmount, undefined);
  assert.match(validateOfferDraft(draft({ baseAmount: 0.0766, additionalPay: 2.4234 }), 0.1534, { now }).errors.baseAmount, /0.0767 ETH/);
  assert.equal(draftFromOffer(null, { floor: 0.1534, deadline: '2026-12-31', isRush: false, rushFeePercentage: 0, milestones: [] }, now).baseAmount, 0.1534);
  assert.equal(roundEth(22336.5 / 155000), 0.1441);
});
