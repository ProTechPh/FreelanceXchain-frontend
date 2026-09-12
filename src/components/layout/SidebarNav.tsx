'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { usePlan } from '@/hooks/use-plan';
import { getNavSections, isNavItemActive, type NavItem } from './nav-config';
import type { UserRole } from '@/types';

interface SidebarNavProps {
  role: UserRole | undefined;
  collapsed?: boolean;
  /** Called after a link is followed — used to close the mobile drawer. */
  onNavigate?: () => void;
}

function NavLink({
  item,
  active,
  collapsed,
  showProBadge,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  /** Upsell marker: only for a Pro route the viewer cannot use yet. */
  showProBadge: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      // aria-current is what tells assistive tech which page you are on; the
      // colour change alone never conveyed that.
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium lg:min-h-[36px] lg:py-2',
        'transition-colors duration-fast ease-out outline-none',
        'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      <item.icon
        className={cn('size-5 shrink-0', active ? 'text-sidebar-primary' : 'text-current')}
        aria-hidden="true"
      />
      <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
      {showProBadge && !collapsed && (
        <Badge variant="secondary" className="ml-auto">
          Pro
        </Badge>
      )}
    </Link>
  );

  // Collapsed items keep an accessible name through the label's sr-only span;
  // the tooltip is the sighted-pointer equivalent. The badge has no room when
  // collapsed, so the tooltip carries the marker instead.
  return collapsed ? (
    <Tooltip content={showProBadge ? `${item.label} (Pro)` : item.label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

export function SidebarNav({ role, collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const sections = getNavSections(role);
  // Read once here rather than per item.
  const { isPro, isResolved } = usePlan();

  return (
    <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          {collapsed ? (
            <div className="mx-auto my-1 h-px w-6 bg-sidebar-border" aria-hidden="true" />
          ) : (
            <p className="px-3 pb-1 text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
              {section.title}
            </p>
          )}
          {section.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isNavItemActive(pathname, item.href)}
              collapsed={collapsed}
              // Withheld until the session resolves, so the sidebar does not
              // flicker Free→Pro on every page load.
              showProBadge={Boolean(item.pro) && isResolved && !isPro}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}

    </nav>
  );
}
