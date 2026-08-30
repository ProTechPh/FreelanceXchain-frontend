'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare, LogOut, User, Settings, ChevronDown, Search, Shield, Bookmark, History } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { MobileNav } from './MobileNav';
import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect } from 'react';
import { notificationsApi } from '@/lib/api';
import { subscribeToNotificationStream } from '@/lib/sse';
import { WalletHeaderButton } from '@/components/wallet/wallet-header-button';

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
  const userId = user?.id;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!userId) return;
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
  }, [userId]);

  const initials = mounted && user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : 'U';

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
    <header className="sticky top-0 z-40 h-16 shrink-0 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <MobileNav role={user?.role} />
          {hasParticipantDashboard && (
            <form className="relative w-full max-w-[180px] sm:max-w-md" role="search" onSubmit={submitSearch}>
              <label htmlFor="dashboard-marketplace-search" className="sr-only">{searchLabel}</label>
              <Input
                id="dashboard-marketplace-search"
                inputSize="sm"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`${searchLabel}…`}
                className="pr-10"
              />
              <button
                type="submit"
                aria-label={searchLabel}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground outline-none transition-colors duration-fast hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
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
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link
                href={`/dashboard/${user.role}/notifications`}
                aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
              >
                <Bell className="size-5" aria-hidden="true" />
                {unreadNotifications > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-2xs font-semibold text-destructive-foreground"
                  >
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {/* Messages */}
          {hasParticipantDashboard && (
            <Button asChild variant="ghost" size="icon">
              <Link href={`/dashboard/${user?.role || 'freelancer'}/messages`} aria-label="Messages">
                <MessageSquare className="size-5" aria-hidden="true" />
              </Link>
            </Button>
          )}

          {/* Wallet */}
          {hasParticipantDashboard && <WalletHeaderButton />}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open account menu"
              className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 outline-none transition-colors duration-fast hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <Avatar className="size-7">
                <AvatarFallback className="text-xs gradient-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* The menu is a fixed width, so an address longer than it must
                  ellipsize rather than clip mid-character. `title` keeps the full
                  value reachable on hover. */}
              <div className="min-w-0 px-3 py-2">
                <p className="truncate text-sm font-medium" title={user?.name || 'User'}>
                  {user?.name || 'User'}
                </p>
                <p className="truncate text-xs text-muted-foreground" title={user?.email}>
                  {user?.email}
                </p>
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
                      <item.icon className="size-4" aria-hidden="true" /> {item.label}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="flex items-center gap-2 cursor-pointer text-destructive">
                <LogOut className="size-4" aria-hidden="true" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
