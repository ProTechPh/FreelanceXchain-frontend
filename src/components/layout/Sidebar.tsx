import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  FolderKanban,
  FileText,
  Users,
  AlertTriangle,
  Bell,
  Shield,
  Sparkles,
  Settings,
  Briefcase,
  BarChart3,
  CheckSquare
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('freelancer' | 'employer' | 'admin')[];
}

const freelancerNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Skill Analysis', href: '/skill-analysis', icon: BarChart3 },
  { label: 'AI Recommendations', href: '/recommendations', icon: Sparkles },
  { label: 'My Proposals', href: '/proposals', icon: FileText },
  { label: 'My Contracts', href: '/contracts', icon: Briefcase },
  { label: 'Disputes', href: '/disputes', icon: AlertTriangle },
  { label: 'Browse Projects', href: '/projects', icon: FolderKanban },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const employerNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Create Project', href: '/projects/new', icon: FileText },
  { label: 'My Projects', href: '/projects/manage', icon: FolderKanban },
  { label: 'My Contracts', href: '/contracts', icon: Briefcase },
  { label: 'Disputes', href: '/disputes', icon: AlertTriangle },
  { label: 'Browse Freelancers', href: '/freelancers', icon: Users },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'KYC Reviews', href: '/admin/kyc', icon: Shield },
  { label: 'Disputes', href: '/admin/disputes', icon: AlertTriangle },
  { label: 'Skills Management', href: '/admin/skills', icon: CheckSquare },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();

  const navItems = user?.role === 'admin'
    ? adminNav
    : user?.role === 'employer'
      ? employerNav
      : freelancerNav;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 dark:border-white/5 transition-transform duration-300 lg:translate-x-0',
          'bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="p-4 space-y-1 overflow-y-auto h-full scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden',
                  isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-primary-600/5 border-l-2 border-primary-500" />
                )}
                <Icon className={clsx("w-5 h-5 relative z-10", isActive ? "text-primary-400" : "group-hover:text-primary-400 transition-colors")} />
                <span className="font-medium relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
