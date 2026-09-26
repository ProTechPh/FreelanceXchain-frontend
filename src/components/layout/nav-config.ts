import { Activity, AlertTriangle, BarChart3, Bell, BrainCircuit, ClipboardList, CreditCard, FileText, FolderOpen, Image, LayoutDashboard, LifeBuoy, MessageSquare, PlusCircle, Search, Shield, Sparkles, Star, Tags, Users, Wallet } from 'lucide-react';

import { getDashboardMessageRoute } from '../../lib/dashboard-message-route.ts';
import { isNavItemActive } from '../../lib/nav-active.ts';
import type { AdminPermission, UserRole } from '../../types/index.ts';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /**
   * Marks a route whose main content is Pro-only. Rendered as an upsell badge
   * that disappears once the viewer is entitled — never shown to admins.
   */
  pro?: boolean;
  /**
   * Granular permission required for an admin to view this nav item.
   * If omitted or undefined, accessible to all admins.
   */
  permission?: AdminPermission;
}

export interface NavSection {
  /** Rendered as a group heading; also the aria-label for the group. */
  title: string;
  items: NavItem[];
}

// Grouped rather than flat: the freelancer and admin lists had grown past ten
// undifferentiated links, which is where a sidebar stops being scannable.
// The two participant roles use parallel groupings on purpose — an employer and
// a freelancer should be able to describe the app to each other.
const freelancerNav: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/freelancer', icon: LayoutDashboard },
      { label: 'Messages', href: getDashboardMessageRoute('freelancer'), icon: MessageSquare },
    ],
  },
  {
    title: 'Find work',
    items: [
      { label: 'Browse projects', href: '/dashboard/freelancer/projects', icon: Search },
      { label: 'Recommended', href: '/dashboard/freelancer/recommendations', icon: Sparkles, pro: true },
      { label: 'My proposals', href: '/dashboard/freelancer/proposals', icon: FileText },
    ],
  },
  {
    title: 'Work',
    items: [
      { label: 'Contracts', href: '/dashboard/freelancer/contracts', icon: FolderOpen },
      { label: 'Earnings', href: '/dashboard/freelancer/earnings', icon: Wallet },
      { label: 'Disputes', href: '/dashboard/freelancer/disputes', icon: AlertTriangle },
    ],
  },
  {
    title: 'Profile',
    items: [
      { label: 'Portfolio', href: '/dashboard/freelancer/portfolio', icon: Image },
      { label: 'Reputation', href: '/dashboard/freelancer/reputation', icon: Star },
      { label: 'Skill analysis', href: '/dashboard/freelancer/skill-analysis', icon: BrainCircuit, pro: true },
      { label: 'Plan & billing', href: '/dashboard/freelancer/billing', icon: CreditCard },
    ],
  },
];

const employerNav: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/employer', icon: LayoutDashboard },
      { label: 'Messages', href: getDashboardMessageRoute('employer'), icon: MessageSquare },
    ],
  },
  {
    title: 'Hiring',
    items: [
      { label: 'My projects', href: '/dashboard/employer/projects', icon: FolderOpen },
      { label: 'Post a project', href: '/dashboard/employer/projects/new', icon: PlusCircle },
    ],
  },
  {
    title: 'Work',
    items: [
      { label: 'Contracts', href: '/dashboard/employer/contracts', icon: FileText },
      { label: 'Transactions', href: '/dashboard/employer/transactions', icon: Wallet },
      { label: 'Disputes', href: '/dashboard/employer/disputes', icon: AlertTriangle },
    ],
  },
  {
    title: 'Profile',
    items: [
      { label: 'Reputation', href: '/dashboard/employer/reputation', icon: Star },
      { label: 'Plan & billing', href: '/dashboard/employer/billing', icon: CreditCard },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
      { label: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
      { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3, permission: 'analytics:view' },
      { label: 'App feedback', href: '/dashboard/admin/feedback', icon: Star, permission: 'analytics:view' },
    ],
  },
  {
    title: 'Moderation',
    items: [
      { label: 'Users', href: '/dashboard/admin/users', icon: Users, permission: 'users:view' },
      { label: 'KYC review', href: '/dashboard/admin/kyc', icon: Shield, permission: 'kyc:view' },
      { label: 'Disputes', href: '/dashboard/admin/disputes', icon: AlertTriangle, permission: 'disputes:view' },
      { label: 'Skills', href: '/dashboard/admin/skills', icon: Tags, permission: 'skills:manage' },
      { label: 'Support tickets', href: '/dashboard/admin/support-tickets', icon: LifeBuoy, permission: 'support:manage' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'System health', href: '/dashboard/admin/system', icon: Activity, permission: 'system:view' },
      { label: 'Audit logs', href: '/dashboard/admin/audit-logs', icon: ClipboardList, permission: 'audit:view' },
    ],
  },
];

export function getNavSections(role: UserRole | undefined, permissions?: AdminPermission[]): NavSection[] {
  if (role === 'admin') {
    const isSuperAdmin =
      permissions === undefined ||
      (permissions as string[]).includes('*') ||
      permissions.includes('admin:manage');

    if (isSuperAdmin) {
      return adminNav;
    }

    return adminNav
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.permission || permissions.includes(item.permission)),
      }))
      .filter((section) => section.items.length > 0);
  }
  if (role === 'employer') return employerNav;
  return freelancerNav;
}


export { isNavItemActive };
