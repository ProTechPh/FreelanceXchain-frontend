'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { FreelanceXchainIcon } from '@/components/ui/freelancexchain-logo';
import { SidebarNav } from './SidebarNav';
import { SidebarUserCard } from './SidebarUserCard';

/**
 * Desktop dashboard sidebar.
 *
 * Hidden below `lg`; on small screens the same navigation is rendered inside the
 * drawer opened from the TopBar, so there is exactly one nav config and one set
 * of link styles for both.
 */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex',
        'transition-[width] duration-base ease-out',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      <div className={cn('flex h-16 shrink-0 items-center border-b border-sidebar-border px-4', collapsed && 'justify-center px-0')}>
        <Link
          href="/"
          aria-label="FreelanceXchain home"
          className="group flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <FreelanceXchainIcon size={30} />
          {!collapsed && (
            <span className="flex items-center text-lg font-extrabold tracking-tight text-foreground">
              Freelance<span className="font-black text-primary">X</span>chain
            </span>
          )}
        </Link>
      </div>

      <SidebarNav role={user?.role} collapsed={collapsed} />

      <div className="shrink-0 border-t border-sidebar-border p-2">
        <SidebarUserCard collapsed={collapsed} />
      </div>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
          <Button
            variant="ghost"
            size={collapsed ? 'icon-sm' : 'sm'}
            className={cn('w-full', collapsed && 'mx-auto w-9')}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="size-4" aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </Tooltip>
      </div>
    </aside>
  );
}
