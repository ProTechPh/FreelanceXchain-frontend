import { Activity, AlertTriangle, BarChart3, Bell, BrainCircuit, ClipboardList, FileText, FolderOpen, Image, LayoutDashboard, Mail, MessageSquare, PlusCircle, Search, Shield, Sparkles, Star, Tags, Users, Wallet } from 'lucide-react';

import { getDashboardMessageRoute } from '@/lib/dashboard-message-route';
import { isNavItemActive } from '@/lib/nav-active';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
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
      { label: 'Recommended', href: '/dashboard/freelancer/recommendations', icon: Sparkles },
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
      { label: 'Skill analysis', href: '/dashboard/freelancer/skill-analysis', icon: BrainCircuit },
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
    items: [{ label: 'Reputation', href: '/dashboard/employer/reputation', icon: Star }],
  },
];

const adminNav: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
      { label: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
      { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Moderation',
    items: [
      { label: 'Users', href: '/dashboard/admin/users', icon: Users },
      { label: 'KYC review', href: '/dashboard/admin/kyc', icon: Shield },
      { label: 'Disputes', href: '/dashboard/admin/disputes', icon: AlertTriangle },
      { label: 'Skills', href: '/dashboard/admin/skills', icon: Tags },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Email', href: '/dashboard/admin/email', icon: Mail },
      { label: 'System health', href: '/dashboard/admin/system', icon: Activity },
      { label: 'Audit logs', href: '/dashboard/admin/audit-logs', icon: ClipboardList },
    ],
  },
];

export function getNavSections(role: UserRole | undefined): NavSection[] {
  if (role === 'admin') return adminNav;
  if (role === 'employer') return employerNav;
  return freelancerNav;
}


export { isNavItemActive };
