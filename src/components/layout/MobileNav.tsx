'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';

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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Open navigation menu" className="lg:hidden" />
        }
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 sm:max-w-[280px]">
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
