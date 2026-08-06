'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare, Wallet, LogOut, User, Settings, ChevronDown, Search, Shield, Bookmark, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect } from 'react';
import { notificationsApi } from '@/lib/api';
import { subscribeToNotificationStream } from '@/lib/sse';

const participantAccountItems = [
  { label: 'Profile', path: 'profile', icon: User },
  { label: 'Verification', path: 'verification', icon: Shield },
  { label: 'Notifications', path: 'notifications', icon: Bell },
  { label: 'Saved', path: 'saved', icon: Bookmark },
  { label: 'Activity', path: 'activity', icon: History },
  { label: 'Settings', path: 'settings', icon: Settings },
] as const;

export function TopBar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void notificationsApi.getUnreadCount().then(({ data }) => {
      if (active) setUnreadNotifications(data.count);
    }).catch(() => {
      // Notification counts are non-blocking navigation chrome.
    });
    const unsubscribe = subscribeToNotificationStream(() => {
      if (active) setUnreadNotifications((count) => count + 1);
    });
    const handleCountChange = (event: Event) => {
      const delta = (event as CustomEvent<{ delta?: number }>).detail?.delta;
      if (typeof delta === 'number') setUnreadNotifications((count) => Math.max(0, count + delta));
    };
    window.addEventListener('notification-count-change', handleCountChange);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener('notification-count-change', handleCountChange);
    };
  }, [user]);

  const initials = mounted && user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : 'U';

  const truncatedAddress = mounted && user?.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : null;

  const participantRole = user?.role === 'freelancer' || user?.role === 'employer' ? user.role : null;
  const hasParticipantDashboard = participantRole !== null;
  const searchTarget = user?.role === 'employer' ? '/freelancers' : '/projects';
  const searchLabel = user?.role === 'employer' ? 'Search freelancers' : 'Search projects';

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = searchQuery.trim();
    router.push(keyword ? `${searchTarget}?keyword=${encodeURIComponent(keyword)}` : searchTarget);
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-6">
        <div className="max-w-md flex-1">
          {hasParticipantDashboard && (
            <form className="relative" role="search" onSubmit={submitSearch}>
              <label htmlFor="dashboard-marketplace-search" className="sr-only">{searchLabel}</label>
              <input
                id="dashboard-marketplace-search"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`${searchLabel}…`}
                className="h-9 w-full rounded-lg border border-border bg-secondary pl-4 pr-10 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button type="submit" className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground" aria-label={searchLabel}>
                <Search className="size-4" aria-hidden="true" />
              </button>
            </form>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          {user && (
            <Link href={`/dashboard/${user.role}/notifications`} aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}>
              <Button variant="ghost" size="icon" className="relative" tabIndex={-1}>
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
              </Button>
            </Link>
          )}

          {/* Messages */}
          {hasParticipantDashboard && (
            <Link href={`/dashboard/${user?.role || 'freelancer'}/messages`}>
              <Button variant="ghost" size="icon">
                <MessageSquare className="w-5 h-5" />
              </Button>
            </Link>
          )}

          {/* Wallet */}
          {truncatedAddress && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">{truncatedAddress}</span>
            </div>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Open account menu" className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs gradient-primary text-white">{initials}</AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              {hasParticipantDashboard && (
                <>
                  <DropdownMenuSeparator />
                  {participantAccountItems.map((item) => (
                    <DropdownMenuItem
                      key={item.path}
                      onClick={() => router.push(`/dashboard/${participantRole}/${item.path}`)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <item.icon className="w-4 h-4" /> {item.label}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="flex items-center gap-2 cursor-pointer text-destructive">
                <LogOut className="w-4 h-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
