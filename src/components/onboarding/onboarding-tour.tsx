'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  BUBBLE_GAP,
  VIEWPORT_PADDING,
  computeBubblePlacement,
  TOUR_COMPACT_CARD_MAX_HEIGHT,
  getSpotlightHole,
  getStepProgressLabel,
  isDashboardHome,
  getTourSteps,
  isTargetVisible,
  resolveStepTarget,
  shouldAutoStartTour,
  type Rect,
  type Size,
  type SpotlightHole,
} from '@/lib/onboarding-tour';
import { useIsBelowLarge } from '@/hooks/use-media-query';
import { useAuthStore } from '@/stores/authStore';
import { useTourStore } from '@/stores/tourStore';
import { Button } from '@/components/ui/button';

/** Breathing room between the target's edge and the spotlight ring. */
const RING_PADDING = 6;
/** Desktop bubble width. The mobile card is full-bleed and ignores this. */
const BUBBLE_WIDTH = 340;
/** Fallback corner radius when the target reports none. Matches `--radius-md`. */
const FALLBACK_RADIUS = 8;
/** Minimum gap between the docked mobile card and the spotlight above it. */
const CARD_CLEARANCE = 12;
/** Never squeeze the target's area below this, however tall the card gets. */
const MIN_TARGET_AREA = 140;
/** Fallback for the sticky TopBar's height (`h-16`) if it cannot be measured. */
const FALLBACK_TOPBAR_HEIGHT = 64;
/** How long to keep looking for a target that has not mounted yet. */
const TARGET_WAIT_MS = 1500;
/** `--ease-out`, written for JS. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function readViewport(): Size {
  // `clientWidth` excludes the scrollbar. `innerWidth` would let the overlay
  // overhang by the scrollbar's width and widen the page.
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  };
}

/** How much of the top of the screen the sticky dashboard header occupies. */
function readStickyHeaderHeight(): number {
  const header = document.querySelector('header');
  if (!header) return 0;
  const { position } = getComputedStyle(header);
  if (position !== 'sticky' && position !== 'fixed') return 0;
  return header.getBoundingClientRect().height || FALLBACK_TOPBAR_HEIGHT;
}

function readRadius(element: Element): number {
  const raw = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius);
  return Number.isFinite(raw) ? raw : FALLBACK_RADIUS;
}

/**
 * The running tour.
 *
 * Split from `OnboardingTour` so every hook in here — measurement, focus
 * management, key handling — only runs while the tour is actually on screen.
 * Nothing of this is in the DOM otherwise, which matters: the responsive e2e
 * suite hit-tests the centre point of the navigation button on every route, and
 * a stray full-screen layer would own it.
 */
function TourOverlay() {
  const { stepIndex, activeRole, next, back, skip } = useTourStore();
  // Published so `MobileNav` can end the drawer exactly above this card.
  const publishCardHeight = useTourStore((state) => state.setCardHeight);
  const steps = useMemo(() => getTourSteps(activeRole), [activeRole]);
  const step = steps[stepIndex];
  const isMobile = useIsBelowLarge();
  const reduceMotion = useReducedMotion();
  const maskId = useId();

  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [targetRadius, setTargetRadius] = useState(FALLBACK_RADIUS);
  const [cardHeight, setCardHeight] = useState(0);
  const [ready, setReady] = useState(false);

  const selector = resolveStepTarget(step, isMobile);
  const total = steps.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  const measure = useCallback(() => {
    const nextViewport = readViewport();
    setViewport(nextViewport);

    const element = selector ? document.querySelector(selector) : null;
    if (!element) {
      // A target can legitimately be absent — the wallet banner disappears once
      // a wallet is connected. The step degrades to a centred card.
      setTargetRect(null);
      return;
    }

    const box = element.getBoundingClientRect();
    const rect: Rect = { top: box.top, left: box.left, width: box.width, height: box.height };
    setTargetRect(isTargetVisible(rect, nextViewport) ? rect : null);
    setTargetRadius(readRadius(element));
  }, [selector]);

  // Re-measure on anything that can move the target under us. Scroll is captured
  // so that scrolling inside any ancestor — the sidebar's own `overflow-y-auto`
  // nav, for one — is picked up, not just the document.
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(document.documentElement);

    // A target need not exist yet: the navigation step opens the drawer, and the
    // drawer mounts and animates in over the next few frames. Keep looking until
    // it has a size worth measuring, and start observing it the moment it shows
    // up, rather than measuring once against nothing.
    const deadline = Date.now() + TARGET_WAIT_MS;
    let settleFrame = 0;
    let observed: Element | null = null;

    const settle = () => {
      const element = selector ? document.querySelector(selector) : null;
      if (element && element !== observed) {
        if (observed) observer.unobserve(observed);
        observer.observe(element);
        observed = element;
      }
      schedule();

      const settled = element ? element.getBoundingClientRect().height > 0 : !selector;
      if (!settled && Date.now() < deadline) {
        settleFrame = requestAnimationFrame(settle);
      }
    };

    settle();
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    window.addEventListener('scroll', schedule, { capture: true, passive: true });

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(settleFrame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      window.removeEventListener('scroll', schedule, { capture: true });
      observer.disconnect();
    };
  }, [measure, selector]);

  // Bring the target into the part of the screen the card is not covering.
  //
  // `scrollIntoView({ block: 'center' })` centres against the whole viewport,
  // which on a phone puts the target squarely behind the docked card. This
  // centres it in the free area above the card instead, and re-runs when the
  // card's measured height changes -- a step with a longer feature list pushes
  // the ceiling up, and the correction has to follow it.
  useEffect(() => {
    if (!selector) return;
    const element = document.querySelector(selector);
    if (!element) return;

    const { height: viewportHeight } = readViewport();
    // The ring is drawn around the target, not on it, so the space to keep clear
    // is the target plus its padding -- otherwise the bottom of the ring lands
    // behind the card even when the element itself does not.
    const reserved = isMobile ? cardHeight + CARD_CLEARANCE + RING_PADDING : 0;
    // Never reserve so much that there is nowhere left to put the target.
    const ceiling = Math.max(MIN_TARGET_AREA, viewportHeight - reserved);

    const box = element.getBoundingClientRect();
    // Sticky chrome -- the TopBar and everything in it -- is already where it
    // is going to be. Scrolling "to" it would move the page underneath while the
    // element stayed put, which is both pointless and visibly wrong.
    if (box.top >= 0 && box.bottom <= ceiling) return;

    // A target taller than the free area gets its top pinned just below the
    // sticky header, rather than sliding underneath it.
    const floor = readStickyHeaderHeight();
    const desiredTop = Math.max(floor, (ceiling - box.height) / 2);
    const delta = box.top - desiredTop;
    if (Math.abs(delta) < 4) return;

    window.scrollBy({ top: delta, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [selector, isMobile, cardHeight, reduceMotion]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const update = () => {
      const measured = card.getBoundingClientRect().height;
      setCardHeight(measured);
      publishCardHeight(measured);
      setReady(true);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(card);
    return () => observer.disconnect();
  }, [stepIndex, isMobile, publishCardHeight]);

  // Focus goes to the card itself, not to a control inside it: with
  // `aria-labelledby`/`aria-describedby` that is what makes a screen reader
  // announce the step's title and body on arrival.
  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      const target = returnFocusRef.current;
      if (target?.isConnected) {
        target.focus();
        return;
      }
      // The launcher can be gone by now (a closed menu, another route). The
      // dashboard's main region is already `tabIndex={-1}` for the skip link.
      document.getElementById('dashboard-content')?.focus();
    };
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    // On a short screen -- a phone in landscape, most obviously -- the body is
    // taller than the room it has. A new step has to start at the top of its own
    // text, and `preventScroll` stops the browser deciding otherwise.
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    card.focus({ preventScroll: true });
  }, [stepIndex]);

  const hole: SpotlightHole | null = getSpotlightHole(targetRect, viewport, RING_PADDING, targetRadius);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      skip();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (!isFirst) back();
      return;
    }

    if (event.key !== 'Tab') return;

    // Contain Tab inside the card: everything behind the scrim is inert for the
    // duration of the tour, so letting focus reach it would strand the user.
    const focusable = Array.from(cardRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
      (element) => element.offsetParent !== null,
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === cardRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!step) return null;

  const placement =
    hole && !isMobile
      ? computeBubblePlacement(
          hole,
          { width: BUBBLE_WIDTH, height: cardHeight || 220 },
          viewport,
          step.side ?? 'bottom',
          BUBBLE_GAP,
          VIEWPORT_PADDING,
        )
      : null;

  const progress = getStepProgressLabel(stepIndex, total);
  const motionTransition = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT };

  // The drawer step shows a tall panel, so the card gives back room rather than
  // covering most of what it is asking the reader to look at. Driven by the step
  // rather than by the measured height on purpose: the drawer sizes itself
  // against this card, so deriving it from the measurement would let the two
  // chase each other frame by frame.
  const compactCard = isMobile && step.opensNav === true;

  const cardPositionClass = isMobile
    ? 'fixed inset-x-0 bottom-0 rounded-t-2xl border-t border-border'
    : placement
      ? 'fixed rounded-xl ring-1 ring-foreground/10'
      : 'fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl ring-1 ring-foreground/10 sm:max-w-md';

  const cardStyle = isMobile
    ? compactCard
      ? { maxHeight: TOUR_COMPACT_CARD_MAX_HEIGHT }
      : undefined
    : placement
      ? { top: placement.top, left: placement.left, width: placement.width }
      : undefined;

  return (
    // `overflow-hidden` is the structural guarantee behind the responsive
    // contract: nothing this layer draws can widen the document, whatever the
    // measured rects say.
    <div data-tour-overlay="" className="pointer-events-none fixed inset-0 z-60 overflow-hidden">
      {/* Pointer sink. The spotlit control is deliberately not clickable during
          the tour -- following a nav link mid-tour would unmount every remaining
          target. It carries no role and no handler; Esc and the explicit
          controls are the ways out. */}
      <div className="pointer-events-auto absolute inset-0" aria-hidden="true" />

      <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
        <defs>
          {/* `white` and `black` here are mask luminance, not theme colours: a
              mask reads brightness, so white keeps the scrim and black cuts it. */}
          <mask id={maskId}>
            <rect x={0} y={0} width="100%" height="100%" fill="white" />
            {hole && (
              <motion.rect
                initial={false}
                animate={{ x: hole.left, y: hole.top, width: hole.width, height: hole.height, rx: hole.radius }}
                transition={motionTransition}
                fill="black"
              />
            )}
          </mask>
        </defs>

        <rect width="100%" height="100%" className="fill-tour-scrim" mask={`url(#${maskId})`} />

        {/* The ring carries the emphasis; the scrim alone would not read as
            "this one" for anyone who cannot distinguish the dimming. */}
        {hole && (
          <motion.rect
            initial={false}
            animate={{ x: hole.left, y: hole.top, width: hole.width, height: hole.height, rx: hole.radius }}
            transition={motionTransition}
            data-tour-spotlight=""
            className="fill-none stroke-primary"
            strokeWidth={2}
          />
        )}
      </svg>

      <div
        ref={cardRef}
        role="dialog"
        // Deliberately not `true`: the page outside is not `aria-hidden`, and it
        // must not be -- the whole point is that the highlighted control stays
        // perceivable. Claiming modality here would hide the very thing the step
        // is talking about.
        aria-modal="false"
        tabIndex={-1}
        aria-labelledby={`${maskId}-progress ${maskId}-title`}
        aria-describedby={`${maskId}-body`}
        onKeyDown={handleKeyDown}
        style={cardStyle}
        data-ready={ready}
        data-tour-card=""
        className={cn(
          // Header and footer are pinned and the middle scrolls, so the step
          // title and the Next button stay on screen even on a phone held
          // sideways, where the card is most of the viewport.
          'pointer-events-auto flex flex-col overflow-hidden bg-popover text-popover-foreground shadow-lg outline-none duration-100 lg:max-h-[70dvh]',
          'max-h-[58dvh]',
          // Present from the first render so focus and key handling work, but
          // not shown until it has been measured and placed. Opacity, not
          // `invisible`: `visibility: hidden` would drop it from the tab order
          // and make `.focus()` a no-op, which is what this exists to preserve.
          'data-[ready=false]:opacity-0',
          'animate-in fade-in-0 zoom-in-95',
          cardPositionClass,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 p-4 pb-2 sm:p-5 sm:pb-2">
          <div className="flex min-w-0 flex-col gap-1">
            <p
              id={`${maskId}-progress`}
              className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {progress}
            </p>
            <h2 id={`${maskId}-title`} className="text-base font-extrabold tracking-tight text-foreground sm:text-lg">
              {step.title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="End the tour"
            className="-mr-1 -mt-1 shrink-0"
            onClick={skip}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div ref={bodyRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pb-1 sm:px-5">
          <p id={`${maskId}-body`} className="text-sm leading-relaxed text-muted-foreground">
            {step.body}
          </p>

          {step.items && (
            <ul className="flex flex-col gap-1.5">
              {step.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sighted users get the dots; the same fact reaches everyone else
            through the progress label, which names the dialog. */}
        <div className="flex shrink-0 items-center gap-1.5 px-4 pt-3 sm:px-5" aria-hidden="true">
          {steps.map((item, index) => (
            <span
              key={item.id}
              className={cn(
                'h-1.5 rounded-full transition-all duration-base ease-out',
                index === stepIndex ? 'w-5 bg-primary' : 'w-1.5 bg-border-strong',
              )}
            />
          ))}
        </div>

        <div
          // Notched phones put a home indicator under the docked card.
          style={isMobile ? { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' } : undefined}
          className="flex shrink-0 flex-col-reverse gap-2 p-4 pt-3 sm:flex-row sm:items-center sm:justify-between sm:p-5 sm:pt-3"
        >
          <Button variant="ghost" size="sm" onClick={skip}>
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={back} disabled={isFirst} className="flex-1 sm:flex-initial">
              Back
            </Button>
            <Button size="sm" onClick={next} className="flex-1 sm:flex-initial">
              {isLast ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mounts the onboarding tour and decides when it should offer itself.
 *
 * Rendered once by `DashboardLayout`, so every participant route has it without
 * each page opting in.
 */
export function OnboardingTour({ suppressed = false }: { suppressed?: boolean }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authHasHydrated = useAuthStore((state) => state.hasHydrated);

  const isRunning = useTourStore((state) => state.isRunning);
  const hasHydrated = useTourStore((state) => state.hasHydrated);
  const autoStart = useTourStore((state) => state.autoStart);
  const completedByRole = useTourStore((state) => state.completedByRole);
  const start = useTourStore((state) => state.start);
  const pendingRole = useTourStore((state) => state.pendingRole);
  const pendingStepId = useTourStore((state) => state.pendingStepId);
  const clearPending = useTourStore((state) => state.clearPending);

  const role = user?.role;

  // A replay requested from another route picks itself up once the dashboard
  // home -- where the anchors live -- has actually rendered.
  useEffect(() => {
    if (!pendingRole || suppressed) return;
    if (!isDashboardHome(pathname, pendingRole)) return;
    start(pendingRole, pendingStepId ?? undefined);
    clearPending();
  }, [pendingRole, pendingStepId, pathname, suppressed, start, clearPending]);

  useEffect(() => {
    if (suppressed) return;
    if (
      shouldAutoStartTour({
        hasHydrated,
        authHasHydrated,
        isAuthenticated,
        role,
        // `suppressed` is the authoritative gate; this stays as a second guard
        // for callers that do not pass it.
        emailVerification: user?.emailVerification,
        autoStart,
        completedByRole,
        pathname,
        isRunning,
      })
    ) {
      start(role);
    }
  }, [
    suppressed,
    hasHydrated,
    authHasHydrated,
    isAuthenticated,
    role,
    user?.emailVerification,
    autoStart,
    completedByRole,
    pathname,
    isRunning,
    start,
  ]);

  if (!isRunning) return null;

  return <TourOverlay />;
}
