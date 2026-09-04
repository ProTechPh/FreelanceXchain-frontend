'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FreelanceXchainIcon } from '@/components/ui/freelancexchain-logo';
import { SidebarNav } from './SidebarNav';
import { TOUR_COMPACT_CARD_MAX_HEIGHT, stepOpensNav } from '@/lib/onboarding-tour';
import { useIsBelowLarge } from '@/hooks/use-media-query';
import { useTourStore } from '@/stores/tourStore';
import type { UserRole } from '@/types';

/**
 * Dashboard navigation below `lg`.
 *
 * The sidebar was previously `h-screen sticky` at every breakpoint with no
 * small-screen treatment at all, so the whole dashboard was unusable on a phone.
 * This renders the same `SidebarNav` inside a drawer, and closes on navigation
 * so the user is never left staring at the menu they just used.
 */
export function MobileNav({ role }: { role: UserRole | undefined }) {
  const [open, setOpen] = useState(false);
  const isBelowLarge = useIsBelowLarge();
  const tourWantsNav = useTourStore((state) => state.isRunning && stepOpensNav(state.activeRole, state.stepIndex));
  const tourCardHeight = useTourStore((state) => state.cardHeight);
  // Only below `lg`. Above it the drawer does not exist and the tour rings the
  // real sidebar instead, so forcing this open would conjure a second nav.
  const forcedOpen = isBelowLarge && tourWantsNav;

  return (
    <Sheet
      open={forcedOpen || open}
      // `modal` traps focus and marks everything outside the drawer
      // `aria-hidden`, which would swallow the tour card describing it. While the
      // tour is driving, the tour's own overlay is what blocks the page.
      modal={forcedOpen ? false : true}
      onOpenChange={(next) => {
        if (forcedOpen) return;
        setOpen(next);
      }}
    >
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation menu"
            data-tour="nav-trigger"
            className="lg:hidden"
          />
        }
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent
        side="left"
        data-tour="nav-drawer"
        // While the tour is driving, the drawer stops just above the step card
        // instead of running under it -- a nav list sliced off mid-item reads as
        // a rendering bug rather than as the thing being pointed at.
        style={
          forcedOpen
            ? {
                top: 0,
                // The card's real height once it has been measured; the cap it
                // is allowed to grow to for the frame before that.
                bottom: tourCardHeight
                  ? `calc(${tourCardHeight}px + 0.75rem)`
                  : `calc(${TOUR_COMPACT_CARD_MAX_HEIGHT} + 0.75rem)`,
                height: 'auto',
              }
            : undefined
        }
        // The tour card carries the only close control; two of them side by side
        // just invites closing the drawer the step is describing.
        showCloseButton={!forcedOpen}
        className={cn(
          'w-[min(280px,85vw)] p-0 sm:max-w-[280px]',
          // Shortened for the tour, the nav scrolls. Fading its last rows says
          // "there is more below" where a hard slice through an icon just looks
          // like a rendering fault.
          forcedOpen &&
            'rounded-br-2xl [&_nav]:[mask-image:linear-gradient(to_bottom,black_calc(100%-1.75rem),transparent)]',
        )}
      >
        <SheetHeader className="h-16 shrink-0 justify-center border-b border-border px-4">
          {/* The drawer needs an accessible name; the visible logo is a link, so
              the title is kept separate rather than wrapping it. */}
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex w-fit items-center gap-2.5 rounded-md text-lg font-extrabold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <FreelanceXchainIcon size={28} />
            <span>
              Freelance<span className="font-black text-primary">X</span>chain
            </span>
          </Link>
        </SheetHeader>
        <SidebarNav role={role} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
