'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SwipeAction {
  label: string;
  icon: LucideIcon;
  /** Surface + foreground token pair for the revealed panel, e.g. `bg-destructive text-destructive-foreground`. */
  className: string;
  onCommit: () => void;
}

interface SwipeActionsProps {
  /** Revealed by swiping left → right. */
  startAction?: SwipeAction;
  /** Revealed by swiping right → left. */
  endAction?: SwipeAction;
  children: ReactNode;
  className?: string;
  /** Turns off the swipe (e.g. while the list is in selection mode). Long-press still works. */
  disabled?: boolean;
  /** Fired after a ~500ms press without movement — the touch way into selection mode. */
  onLongPress?: () => void;
}

const LONG_PRESS_MS = 500;

/** Far enough that an allowed direction never meets its constraint. */
const FREE = 100_000;

/**
 * Swipe-to-act row. A gesture is a shortcut, never the only way in — every
 * action passed here must also be reachable from a visible or screen-reader
 * button in the row itself (WCAG 2.5.1, pointer gestures).
 *
 * Renders an `<li>` so it can drop straight into a list; the foreground is
 * opaque (`bg-card`) so the action panels only show where the row has moved.
 */
export function SwipeActions({ startAction, endAction, children, className, disabled = false, onLongPress }: SwipeActionsProps) {
  const rootRef = useRef<HTMLLIElement>(null);
  const x = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const thresholdRef = useRef(120);
  const draggedRef = useRef(false);
  const pressRef = useRef<{ timer: number; x: number; y: number } | null>(null);
  const [armed, setArmed] = useState<'start' | 'end' | null>(null);
  const [committing, setCommitting] = useState(false);

  const startOpacity = useTransform(x, (value) => (value > 0 ? 1 : 0));
  const endOpacity = useTransform(x, (value) => (value < 0 ? 1 : 0));

  useMotionValueEvent(x, 'change', (value) => {
    const next = value >= thresholdRef.current ? 'start' : value <= -thresholdRef.current ? 'end' : null;
    if (next === armed) return;
    if (next && typeof navigator !== 'undefined') navigator.vibrate?.(8);
    setArmed(next);
  });

  const commit = async (action: SwipeAction, direction: 1 | -1) => {
    setCommitting(true);
    const width = rootRef.current?.offsetWidth ?? 400;
    if (!reduceMotion) {
      await animate(x, direction * width, { duration: 0.22, ease: [0.16, 1, 0.3, 1] });
      if (rootRef.current) {
        await animate(rootRef.current, { height: 0, opacity: 0 }, { duration: 0.18, ease: [0.65, 0, 0.35, 1] });
      }
    }
    action.onCommit();
  };

  const handleDragEnd = (_event: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    // Let the click that ends a drag through the capture handler first.
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);

    const offset = info.offset.x;
    const flung = Math.abs(info.velocity.x) > 650 && Math.abs(offset) > thresholdRef.current / 2;
    const past = Math.abs(offset) >= thresholdRef.current || flung;

    if (past && offset > 0 && startAction) return void commit(startAction, 1);
    if (past && offset < 0 && endAction) return void commit(endAction, -1);
    void animate(x, 0, reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 40 });
  };

  const renderPanel = (action: SwipeAction, side: 'start' | 'end') => {
    const Icon = action.icon;
    const isArmed = armed === side;
    return (
      <motion.div
        style={{ opacity: side === 'start' ? startOpacity : endOpacity }}
        className={cn(
          'absolute inset-0 flex items-center gap-2.5 px-6 text-sm font-semibold',
          side === 'start' ? 'justify-start' : 'justify-end',
          action.className,
        )}
      >
        <motion.span
          animate={{ scale: isArmed ? 1.12 : 0.88 }}
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 600, damping: 30 }}
          className={cn(
            'flex size-9 items-center justify-center rounded-full bg-current/15',
            side === 'end' && 'order-last',
          )}
        >
          <Icon className="size-5" />
        </motion.span>
        <span>{action.label}</span>
      </motion.div>
    );
  };

  const cancelPress = () => {
    if (pressRef.current) window.clearTimeout(pressRef.current.timer);
    pressRef.current = null;
  };

  const startPress = (event: ReactPointerEvent) => {
    if (!onLongPress || event.pointerType === 'mouse' || event.button !== 0) return;
    cancelPress();
    const timer = window.setTimeout(() => {
      pressRef.current = null;
      // Swallow the click that ends this press so it doesn't also open the row.
      draggedRef.current = true;
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 400);
      if (typeof navigator !== 'undefined') navigator.vibrate?.(12);
      onLongPress();
    }, LONG_PRESS_MS);
    pressRef.current = { timer, x: event.clientX, y: event.clientY };
  };

  const movePress = (event: ReactPointerEvent) => {
    const press = pressRef.current;
    if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8) cancelPress();
  };

  const canDrag = !disabled && !committing && Boolean(startAction || endAction);

  return (
    <li ref={rootRef} className={cn('relative overflow-hidden', className)}>
      <div aria-hidden="true">
        {startAction && renderPanel(startAction, 'start')}
        {endAction && renderPanel(endAction, 'end')}
      </div>
      <motion.div
        drag={canDrag ? 'x' : false}
        dragDirectionLock
        dragMomentum={false}
        dragConstraints={{ left: endAction ? -FREE : 0, right: startAction ? FREE : 0 }}
        dragElastic={0.12}
        style={{ x }}
        onPointerDown={startPress}
        onPointerMove={movePress}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onDragStart={() => {
          cancelPress();
          draggedRef.current = true;
          thresholdRef.current = Math.min((rootRef.current?.offsetWidth ?? 300) * 0.4, 160);
        }}
        onDragEnd={handleDragEnd}
        onClickCapture={(event) => {
          // A drag that starts on the row's link must not also navigate.
          if (!draggedRef.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        // No iOS link-preview callout: a long press here means "select".
        className={cn('relative bg-card', onLongPress && '[-webkit-touch-callout:none]', armed && 'select-none')}
      >
        {/* Native link dragging would hijack a mouse swipe on desktop. */}
        <div onDragStart={(event) => event.preventDefault()}>{children}</div>
      </motion.div>
    </li>
  );
}
