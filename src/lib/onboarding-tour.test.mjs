import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TOUR_VERSION,
  clampStepIndex,
  getStepProgressLabel,
  getTourAutoStart,
  getTourSteps,
  isDashboardHome,
  isTourCompleted,
  isTourRole,
  markCompleted,
  resolveStepTarget,
  setTourAutoStart,
  shouldAutoStartTour,
  stepOpensNav,
} from './onboarding-tour.ts';

const baseAutoStart = {
  hasHydrated: true,
  authHasHydrated: true,
  isAuthenticated: true,
  userId: 'freelancer-1',
  role: 'freelancer',
  emailVerification: true,
  autoStartByDefault: true,
  progressByUser: {},
  pathname: '/dashboard/freelancer',
  isRunning: false,
};

test('each participant role gets its own step list', () => {
  const freelancer = getTourSteps('freelancer');
  const employer = getTourSteps('employer');

  assert.equal(freelancer.length, 9);
  assert.equal(employer.length, 9);
  assert.notDeepEqual(freelancer, employer);
});

test('the feature lists stay short enough to read on a phone', () => {
  for (const role of ['freelancer', 'employer']) {
    for (const step of getTourSteps(role)) {
      if (!step.items) continue;
      assert.ok(step.items.length >= 2 && step.items.length <= 3, `${role}/${step.id} lists ${step.items.length} features`);
      for (const item of step.items) {
        assert.ok(item.length > 0, `${role}/${step.id} has an empty list item`);
        assert.ok(item.length <= 62, `${role}/${step.id} item is ${item.length} chars: ${item}`);
      }
    }
  }
});

test('both roles are taught the same concepts in the same order', () => {
  // An employer and a freelancer looking at the same contract must reach the
  // same conclusion, which starts with being taught the same shape of product.
  assert.deepEqual(
    getTourSteps('freelancer').map((step) => step.target ?? null),
    getTourSteps('employer').map((step) => step.target ?? null),
  );
});

test('administrators have no participant workflow to be taught', () => {
  assert.deepEqual(getTourSteps('admin'), []);
  assert.deepEqual(getTourSteps(undefined), []);
  assert.equal(isTourRole('admin'), false);
});

test('every step carries copy, and every anchored step names a target', () => {
  for (const role of ['freelancer', 'employer']) {
    for (const step of getTourSteps(role)) {
      assert.ok(step.id, `${role} step is missing an id`);
      assert.ok(step.title.length > 0, `${role}/${step.id} is missing a title`);
      assert.ok(step.body.length > 0, `${role}/${step.id} is missing a body`);
      if (step.side) {
        assert.ok(step.target, `${role}/${step.id} names a side but has no target`);
      }
    }
  }
});

test('step ids are unique within a role', () => {
  for (const role of ['freelancer', 'employer']) {
    const ids = getTourSteps(role).map((step) => step.id);
    assert.equal(new Set(ids).size, ids.length, `${role} has duplicate step ids`);
  }
});

test('the opening step is centred rather than anchored', () => {
  assert.equal(getTourSteps('freelancer')[0].target, undefined);
  assert.equal(getTourSteps('employer')[0].target, undefined);
});

test('the navigation step points at the open drawer on a phone', () => {
  const step = getTourSteps('freelancer').find((item) => item.id === 'navigation');

  // Below `lg` the sidebar is not in the layout at all, so the step opens the
  // drawer and rings that instead of the button that opened it.
  assert.equal(resolveStepTarget(step, false), '[data-tour="nav"]');
  assert.equal(resolveStepTarget(step, true), '[data-tour="nav-drawer"]');
});

test('only the navigation step asks for the drawer', () => {
  for (const role of ['freelancer', 'employer']) {
    const steps = getTourSteps(role);
    const opening = steps.filter((step) => step.opensNav).map((step) => step.id);
    assert.deepEqual(opening, ['navigation'], `${role} opens the drawer on ${opening.join(', ')}`);
    assert.equal(stepOpensNav(role, steps.findIndex((step) => step.id === 'navigation')), true);
    assert.equal(stepOpensNav(role, 0), false);
  }
});

test('a role with no tour never asks for the drawer', () => {
  assert.equal(stepOpensNav('admin', 0), false);
  assert.equal(stepOpensNav('freelancer', 99), false);
});

test('a step with no mobile variant keeps its desktop target on a phone', () => {
  const step = getTourSteps('freelancer').find((item) => item.id === 'wallet');

  assert.equal(resolveStepTarget(step, true), '[data-tour="wallet"]');
});

test('a centred step resolves to no target at any width', () => {
  const step = getTourSteps('freelancer')[0];

  assert.equal(resolveStepTarget(step, false), null);
  assert.equal(resolveStepTarget(step, true), null);
  assert.equal(resolveStepTarget(undefined, false), null);
});

test('the tour auto-starts for a new participant on their dashboard home', () => {
  assert.equal(shouldAutoStartTour(baseAutoStart), true);
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, role: 'employer', pathname: '/dashboard/employer' }), true);
});

test('a trailing slash still counts as the dashboard home', () => {
  assert.equal(isDashboardHome('/dashboard/freelancer/', 'freelancer'), true);
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, pathname: '/dashboard/freelancer/' }), true);
});

test('the tour does not auto-start away from the dashboard home', () => {
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, pathname: '/dashboard/freelancer/contracts' }), false);
  assert.equal(isDashboardHome('/dashboard/freelancer/contracts', 'freelancer'), false);
  assert.equal(isDashboardHome('/dashboard/employer', 'freelancer'), false);
});

test('the tour never auto-starts behind the email verification gate', () => {
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, emailVerification: false }), false);
  // An account whose provider does not report the flag is not gated, so it runs.
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, emailVerification: undefined }), true);
});

test('the tour waits for both stores to rehydrate', () => {
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, hasHydrated: false }), false);
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, authHasHydrated: false }), false);
});

test('the tour does not auto-start for signed-out visitors or administrators', () => {
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, isAuthenticated: false }), false);
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, role: 'admin', pathname: '/dashboard/admin' }), false);
});

test('a completed tour is not offered again, and the account preference can turn it off', () => {
  const completed = markCompleted({}, 'freelancer-1', 'freelancer');
  const disabled = setTourAutoStart({}, 'freelancer-1', 'freelancer', false);

  assert.equal(shouldAutoStartTour({ ...baseAutoStart, progressByUser: completed }), false);
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, progressByUser: disabled }), false);
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, isRunning: true }), false);
});

test('completion is recorded per account and role', () => {
  const completed = markCompleted({}, 'freelancer-1', 'freelancer');

  assert.deepEqual(completed, {
    'freelancer-1': { freelancer: { completedVersion: TOUR_VERSION } },
  });
  assert.equal(isTourCompleted(completed, 'freelancer-1', 'freelancer'), true);
  assert.equal(isTourCompleted(completed, 'freelancer-2', 'freelancer'), false);
  assert.equal(isTourCompleted(completed, 'freelancer-1', 'employer'), false);
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, progressByUser: completed, userId: 'freelancer-2' }), true);
});

test('a completion recorded against an older version is offered again', () => {
  const stale = { 'freelancer-1': { freelancer: { completedVersion: TOUR_VERSION - 1 } } };

  assert.equal(isTourCompleted(stale, 'freelancer-1', 'freelancer'), false);
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, progressByUser: stale }), true);
});

test('administrators are treated as already done so nothing tries to run for them', () => {
  assert.equal(isTourCompleted({}, 'admin-1', 'admin'), true);
  assert.deepEqual(markCompleted({}, 'admin-1', 'admin'), {});
});

test('auto-start preferences do not leak between accounts with the same role', () => {
  const preferences = setTourAutoStart({}, 'freelancer-1', 'freelancer', false);

  assert.equal(getTourAutoStart(preferences, 'freelancer-1', 'freelancer'), false);
  assert.equal(getTourAutoStart(preferences, 'freelancer-2', 'freelancer'), true);
  assert.equal(getTourAutoStart(preferences, 'freelancer-1', 'employer'), true);
});

test('a disabled application default suppresses unconfigured accounts', () => {
  assert.equal(getTourAutoStart({}, 'freelancer-1', 'freelancer', false), false);
  assert.equal(shouldAutoStartTour({ ...baseAutoStart, autoStartByDefault: false }), false);
});

test('the step index is clamped to the available steps', () => {
  assert.equal(clampStepIndex(-3, 6), 0);
  assert.equal(clampStepIndex(99, 6), 5);
  assert.equal(clampStepIndex(2, 6), 2);
  assert.equal(clampStepIndex(Number.NaN, 6), 0);
  assert.equal(clampStepIndex(1, 0), 0);
});

test('progress is announced in words, not just dots', () => {
  assert.equal(getStepProgressLabel(0, 6), 'Step 1 of 6');
  assert.equal(getStepProgressLabel(5, 6), 'Step 6 of 6');
  assert.equal(getStepProgressLabel(0, 0), '');
});

/* Geometry ---------------------------------------------------------------- */

const phone = { width: 320, height: 568 };
const desktop = { width: 1440, height: 900 };

test('there is no hole to cut without a visible target', async () => {
  const { getSpotlightHole } = await import('./onboarding-tour.ts');

  assert.equal(getSpotlightHole(null, phone, 6, 8), null);
  // What a `hidden lg:flex` sidebar measures as on a phone.
  assert.equal(getSpotlightHole({ top: 0, left: 0, width: 0, height: 0 }, phone, 6, 8), null);
});

test('the hole is padded around the target and inherits its corner radius', async () => {
  const { getSpotlightHole } = await import('./onboarding-tour.ts');

  assert.deepEqual(getSpotlightHole({ top: 100, left: 60, width: 200, height: 48 }, phone, 6, 8), {
    top: 94,
    left: 54,
    width: 212,
    height: 60,
    radius: 14,
  });
});

test('the hole never escapes the viewport, however the target sits', async () => {
  const { getSpotlightHole } = await import('./onboarding-tour.ts');
  const targets = [
    { top: 0, left: 0, width: 44, height: 44 },
    { top: -10, left: -20, width: 120, height: 40 },
    { top: 40, left: 260, width: 200, height: 60 },
    { top: 540, left: 10, width: 300, height: 60 },
    { top: 0, left: 0, width: 1000, height: 900 },
  ];

  for (const viewport of [phone, { width: 280, height: 480 }, desktop]) {
    for (const target of targets) {
      const hole = getSpotlightHole(target, viewport, 6, 8);
      if (!hole) continue;
      assert.ok(hole.top >= 0 && hole.left >= 0, 'hole starts off-viewport');
      assert.ok(hole.left + hole.width <= viewport.width, 'hole is wider than the viewport');
      assert.ok(hole.top + hole.height <= viewport.height, 'hole is taller than the viewport');
      assert.ok(hole.width > 0 && hole.height > 0, 'hole collapsed');
    }
  }
});

test('a corner radius can never exceed half the hole, so it cannot invert', async () => {
  const { getSpotlightHole } = await import('./onboarding-tour.ts');

  // A pill-shaped badge: a large radius on a short control.
  const pill = getSpotlightHole({ top: 40, left: 40, width: 60, height: 20 }, phone, 4, 999);
  assert.equal(pill.radius, (20 + 4 * 2) / 2);

  // A square-cornered target stays square.
  const square = getSpotlightHole({ top: 40, left: 40, width: 100, height: 60 }, phone, 0, 0);
  assert.equal(square.radius, 0);
});

test('a target scrolled out of view leaves nothing to spotlight', async () => {
  const { getSpotlightHole } = await import('./onboarding-tour.ts');

  assert.equal(getSpotlightHole({ top: -200, left: 10, width: 100, height: 40 }, phone, 6, 8), null);
});

test('the bubble takes its preferred side when there is room', async () => {
  const { computeBubblePlacement } = await import('./onboarding-tour.ts');
  const target = { top: 100, left: 600, width: 200, height: 40 };

  const placement = computeBubblePlacement(target, { width: 320, height: 200 }, desktop, 'bottom');

  assert.equal(placement.side, 'bottom');
  assert.equal(placement.top, 100 + 40 + 14);
});

test('the bubble flips to the opposite side when the preferred one does not fit', async () => {
  const { computeBubblePlacement } = await import('./onboarding-tour.ts');
  // Sitting near the bottom, so there is no room below.
  const target = { top: 800, left: 600, width: 200, height: 40 };

  const placement = computeBubblePlacement(target, { width: 320, height: 200 }, desktop, 'bottom');

  assert.equal(placement.side, 'top');
  assert.equal(placement.top, 800 - 14 - 200);
});

test('a sidebar target puts the bubble to its right', async () => {
  const { computeBubblePlacement } = await import('./onboarding-tour.ts');
  const target = { top: 64, left: 0, width: 260, height: 700 };

  const placement = computeBubblePlacement(target, { width: 340, height: 220 }, desktop, 'right');

  assert.equal(placement.side, 'right');
  assert.equal(placement.left, 260 + 14);
});

test('the bubble never leaves the viewport, whichever side it lands on', async () => {
  const { computeBubblePlacement, VIEWPORT_PADDING } = await import('./onboarding-tour.ts');
  const bubble = { width: 296, height: 210 };
  const sides = ['top', 'bottom', 'left', 'right'];
  const targets = [
    { top: 0, left: 0, width: 44, height: 44 },
    { top: 524, left: 276, width: 44, height: 44 },
    { top: 260, left: 138, width: 44, height: 44 },
    { top: 8, left: 268, width: 44, height: 44 },
    { top: 500, left: 0, width: 320, height: 68 },
  ];

  for (const viewport of [phone, { width: 280, height: 480 }, desktop]) {
    for (const target of targets) {
      for (const side of sides) {
        const placement = computeBubblePlacement(target, bubble, viewport, side);
        assert.ok(placement.left >= VIEWPORT_PADDING - 0.001, `left ${placement.left} escaped on ${side}`);
        assert.ok(placement.top >= VIEWPORT_PADDING - 0.001, `top ${placement.top} escaped on ${side}`);
        assert.ok(
          placement.left + placement.width <= viewport.width - VIEWPORT_PADDING + 0.001,
          `bubble overflows right on ${side} at ${viewport.width}px`,
        );
        assert.ok(
          placement.top + placement.height <= viewport.height - VIEWPORT_PADDING + 0.001,
          `bubble overflows bottom on ${side} at ${viewport.width}px`,
        );
      }
    }
  }
});

test('a bubble larger than the screen is shrunk to fit rather than overflowing', async () => {
  const { computeBubblePlacement, VIEWPORT_PADDING } = await import('./onboarding-tour.ts');
  const tiny = { width: 200, height: 200 };

  const placement = computeBubblePlacement({ top: 90, left: 80, width: 40, height: 40 }, { width: 320, height: 300 }, tiny, 'bottom');

  assert.equal(placement.left, VIEWPORT_PADDING);
  assert.equal(placement.top, VIEWPORT_PADDING);
  assert.equal(placement.width, tiny.width - VIEWPORT_PADDING * 2);
  assert.equal(placement.height, tiny.height - VIEWPORT_PADDING * 2);
});

test('the ring grows around the target without inverting', async () => {
  const { expandRect } = await import('./onboarding-tour.ts');

  assert.deepEqual(expandRect({ top: 20, left: 30, width: 100, height: 40 }, 6), {
    top: 14,
    left: 24,
    width: 112,
    height: 52,
  });
  assert.deepEqual(expandRect({ top: 0, left: 0, width: 0, height: 0 }, -10), {
    top: 10,
    left: 10,
    width: 0,
    height: 0,
  });
});

test('a zero-sized or off-screen target is not treated as visible', async () => {
  const { isTargetVisible } = await import('./onboarding-tour.ts');

  assert.equal(isTargetVisible(null, phone), false);
  // What a `hidden lg:flex` sidebar measures as on a phone.
  assert.equal(isTargetVisible({ top: 0, left: 0, width: 0, height: 0 }, phone), false);
  assert.equal(isTargetVisible({ top: 600, left: 10, width: 100, height: 40 }, phone), false);
  assert.equal(isTargetVisible({ top: 10, left: 10, width: 100, height: 40 }, phone), true);
});
