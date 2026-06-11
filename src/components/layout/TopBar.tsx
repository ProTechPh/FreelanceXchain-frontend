'use client';

import Link from 'next/link';
import { Bell, MessageSquare, Wallet, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect } from 'react';

export function TopBar() {
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = mounted && user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : 'U';

  const truncatedAddress = mounted && user?.wallet_address
    ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
    : null;

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects, freelancers..."
              className="w-full h-9 pl-4 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Link href={`/dashboard/${user?.role || 'freelancer'}/notifications`}>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </Link>

          {/* Messages */}
          <Link href={`/dashboard/${user?.role || 'freelancer'}/messages`}>
            <Button variant="ghost" size="icon">
              <MessageSquare className="w-5 h-5" />
            </Button>
          </Link>

          {/* Wallet */}
          {truncatedAddress && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">{truncatedAddress}</span>
            </div>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <Avatar className="w-7 h-7">
                <AvatarImage src={user?.name ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}` : undefined} />
                <AvatarFallback className="text-xs gradient-primary text-white">{initials}</AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = `/dashboard/${user?.role || 'freelancer'}/profile`} className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = `/dashboard/${user?.role || 'freelancer'}/settings`} className="flex items-center gap-2 cursor-pointer">
                <Settings className="w-4 h-4" /> Settings
              </DropdownMenuItem>
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
