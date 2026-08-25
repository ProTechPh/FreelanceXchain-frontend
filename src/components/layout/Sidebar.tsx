'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { getDashboardMessageRoute } from '@/lib/dashboard-message-route';
import {
  LayoutDashboard,
  Search,
  FileText,
  FolderOpen,
  Wallet,
  Star,
  Image,
  MessageSquare,
  Shield,
  Users,
  AlertTriangle,
  BarChart3,
  Activity,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  PlusCircle,
  ClipboardList,
  Mail,
  Bell,
  BrainCircuit,
  Tags,
  Sparkles,
} from 'lucide-react';
import { FreelanceXchainIcon, FreelanceXchainLogo } from '@/components/ui/freelancexchain-logo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const freelancerNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/freelancer', icon: LayoutDashboard },
  { label: 'Browse Projects', href: '/dashboard/freelancer/projects', icon: Search },
  { label: 'Recommended', href: '/dashboard/freelancer/recommendations', icon: Sparkles },
  { label: 'My Proposals', href: '/dashboard/freelancer/proposals', icon: FileText },
  { label: 'Contracts', href: '/dashboard/freelancer/contracts', icon: FolderOpen },
  { label: 'Disputes', href: '/dashboard/freelancer/disputes', icon: AlertTriangle },
  { label: 'Earnings', href: '/dashboard/freelancer/earnings', icon: Wallet },
  { label: 'Reputation', href: '/dashboard/freelancer/reputation', icon: Star },
  { label: 'Skill Analysis', href: '/dashboard/freelancer/skill-analysis', icon: BrainCircuit },
  { label: 'Portfolio', href: '/dashboard/freelancer/portfolio', icon: Image },
  { label: 'Messages', href: getDashboardMessageRoute('freelancer'), icon: MessageSquare },
];

const employerNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/employer', icon: LayoutDashboard },
  { label: 'My Projects', href: '/dashboard/employer/projects', icon: FolderOpen },
  { label: 'Post Project', href: '/dashboard/employer/projects/new', icon: PlusCircle },
  { label: 'Contracts', href: '/dashboard/employer/contracts', icon: FileText },
  { label: 'Transactions', href: '/dashboard/employer/transactions', icon: Wallet },
  { label: 'Disputes', href: '/dashboard/employer/disputes', icon: AlertTriangle },
  { label: 'Reputation', href: '/dashboard/employer/reputation', icon: Star },
  { label: 'Messages', href: getDashboardMessageRoute('employer'), icon: MessageSquare },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
  { label: 'Users', href: '/dashboard/admin/users', icon: Users },
  { label: 'Email', href: '/dashboard/admin/email', icon: Mail },
  { label: 'Disputes', href: '/dashboard/admin/disputes', icon: AlertTriangle },
  { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
  { label: 'System Health', href: '/dashboard/admin/system', icon: Activity },
  { label: 'KYC Review', href: '/dashboard/admin/kyc', icon: Shield },
  { label: 'Skills', href: '/dashboard/admin/skills', icon: Tags },
  { label: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: ClipboardList },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const navItems = user?.role === 'admin'
    ? adminNav
    : user?.role === 'employer'
    ? employerNav
    : freelancerNav;

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 sticky top-0',
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
            <FreelanceXchainIcon size={32} />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-foreground flex items-center">
              Freelance<span className="text-[#10B981] font-black px-0.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">X</span>chain
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-sidebar-primary/10 text-sidebar-primary glow-sm-primary'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-sidebar-primary')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full h-9 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-sidebar-foreground/60" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-sidebar-foreground/60" />
          )}
        </button>
      </div>
    </aside>
  );
}
