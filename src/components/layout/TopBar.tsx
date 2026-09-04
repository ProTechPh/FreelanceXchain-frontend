'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare, LogOut, User, Settings, ChevronDown, Compass, Search, Shield, Bookmark, History } from 'lucide-react';
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
import { useState, useEffect, useRef } from 'react';
import { notificationsApi } from '@/lib/api';
import { subscribeToNotificationStream } from '@/lib/sse';
import { WalletHeaderButton } from '@/components/wallet/wallet-header-button';
import { useStartTour } from '@/components/onboarding/tour-launcher';

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
  const { startTour, canStartTour } = useStartTour();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (searchOpen) mobileSearchRef.current?.focus();
  }, [searchOpen]);

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
    setSearchOpen(false);
    router.push(keyword ? `${searchTarget}?keyword=${encodeURIComponent(keyword)}` : searchTarget);
  };

  // The same field is needed in two places -- inline in the bar at `sm` and up,
  // and in a full-width row beneath the bar on phones, where it cannot share the
  // row with the menu button without colliding with it. Only one of the two is
  // ever visible, but both are in the DOM, so each needs its own id.
  const renderSearch = (id: string, ref?: React.Ref<HTMLInputElement>) => (
    <form className="relative w-full" role="search" onSubmit={submitSearch}>
      <label htmlFor={id} className="sr-only">{searchLabel}</label>
      <Input
        id={id}
        ref={ref}
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
  );

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
          <MobileNav role={user?.role} />
          {hasParticipantDashboard && (
            <>
              {/* On a phone the field cannot sit beside the menu button: the two
                  overlap and the menu stops being tappable. Below `sm` it is a
                  toggle that opens the field in its own row instead. */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label={searchLabel}
                aria-expanded={searchOpen}
                aria-controls="dashboard-search-row"
                onClick={() => setSearchOpen((open) => !open)}
              >
                <Search className="size-5" aria-hidden="true" />
              </Button>
              <div className="hidden min-w-0 flex-1 sm:block sm:max-w-md">
                {renderSearch('dashboard-marketplace-search')}
              </div>
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          {user && (
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link
                href={`/dashboard/${user.role}/notifications`}
                data-tour="notifications"
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

          {/* Messages -- also in the sidebar/drawer nav, so it yields the space
              on phones rather than crowding the bar. */}
          {hasParticipantDashboard && (
            <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
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
              data-tour="account"
              aria-label="Open account menu"
              className="flex h-9 cursor-pointer items-center gap-1 rounded-md px-1 outline-none transition-colors duration-fast hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:gap-2 sm:px-2"
            >
              <Avatar className="size-7">
                <AvatarFallback className="text-xs gradient-primary">{initials}</AvatarFallback>
              </Avatar>
              <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(14rem,calc(100vw-2rem))]">
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
                  {canStartTour && (
                    <DropdownMenuItem
                      onClick={() => startTour()}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Compass className="size-4" aria-hidden="true" /> Product tour
                    </DropdownMenuItem>
                  )}
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

      {/* Phone-only search row. The bar keeps its 64px height until the field is
          actually asked for, so nothing is displaced in the common case. */}
      {hasParticipantDashboard && searchOpen && (
        <div id="dashboard-search-row" className="border-t border-border px-4 py-2 sm:hidden">
          {renderSearch('dashboard-marketplace-search-mobile', mobileSearchRef)}
        </div>
      )}
    </header>
  );
}
