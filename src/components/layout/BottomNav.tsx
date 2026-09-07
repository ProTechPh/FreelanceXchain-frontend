'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  BarChart3,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNavItemActive } from '@/lib/nav-active';
import type { UserRole } from '@/types';

interface BottomNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

function getBottomNavItems(role: UserRole | undefined): BottomNavItem[] {
  if (role === 'freelancer') {
    return [
      { label: 'Home', href: '/dashboard/freelancer', icon: LayoutDashboard },
      { label: 'Projects', href: '/dashboard/freelancer/projects', icon: Search },
      { label: 'Proposals', href: '/dashboard/freelancer/proposals', icon: FileText },
      { label: 'Contracts', href: '/dashboard/freelancer/contracts', icon: FolderOpen },
      { label: 'Messages', href: '/dashboard/freelancer/messages', icon: MessageSquare },
    ];
  }

  if (role === 'employer') {
    return [
      { label: 'Home', href: '/dashboard/employer', icon: LayoutDashboard },
      { label: 'Projects', href: '/dashboard/employer/projects', icon: FolderOpen },
      { label: 'Post', href: '/dashboard/employer/projects/new', icon: PlusCircle },
      { label: 'Contracts', href: '/dashboard/employer/contracts', icon: FileText },
      { label: 'Messages', href: '/dashboard/employer/messages', icon: MessageSquare },
    ];
  }

  if (role === 'admin') {
    return [
      { label: 'Home', href: '/dashboard/admin', icon: LayoutDashboard },
      { label: 'KYC', href: '/dashboard/admin/kyc', icon: Shield },
      { label: 'Disputes', href: '/dashboard/admin/disputes', icon: AlertTriangle },
      { label: 'Users', href: '/dashboard/admin/users', icon: Users },
      { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
    ];
  }

  return [];
}

export function BottomNav({ role }: { role: UserRole | undefined }) {
  const pathname = usePathname();
  const items = getBottomNavItems(role);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-1 text-2xs transition-colors duration-fast outline-none touch-manipulation focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset min-h-[44px]',
                active
                  ? 'font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full transition-colors',
                  active && 'bg-primary/10'
                )}
              >
                <Icon
                  className={cn(
                    'size-4.5 shrink-0 transition-transform duration-fast',
                    active ? 'scale-110 text-primary' : 'text-muted-foreground'
                  )}
                  aria-hidden="true"
                />
              </div>
              <span className="text-[10px] leading-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
