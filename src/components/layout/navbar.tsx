"use client"

import { Menu as List, Search as MagnifyingGlass, Zap as Lightning, Users, Newspaper } from 'lucide-react';
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import Link from "next/link";
import { FreelanceXchainLogo } from "@/components/ui/freelancexchain-logo";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.JSX.Element;
  items?: MenuItem[];
}

interface NavbarProps {
  menu?: MenuItem[];
  auth?: {
    login: { text: string; url: string };
    signup: { text: string; url: string };
  };
}

const Logo = () => (
  <Link href="/" className="group flex items-center shrink-0">
    <FreelanceXchainLogo iconSize={32} />
  </Link>
);

export default function Navbar({
  menu = [
    { title: "Features", url: "/#features" },
    { title: "Ecosystem", url: "/#ecosystem" },
    { title: "Compare", url: "/#compare" },
    { title: "Reviews", url: "/#reviews" },
    { title: "FAQ", url: "/#faq" },
    { title: "Projects", url: "/projects" },
    { title: "Talent", url: "/freelancers" },
    { title: "Crypto News", url: "/news" },
  ],
  auth = {
    login: { text: "Sign in", url: "/login" },
    signup: { text: "Get Started", url: "/register" },
  },
}: NavbarProps) {
  const [openSearch, setOpenSearch] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = React.useState('');

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (url.startsWith("/#") || url.startsWith("#")) {
      const hash = url.replace("/#", "").replace("#", "");
      const target = document.getElementById(hash);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = target.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
        window.history.pushState(null, "", `#${hash}`);
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none flex justify-center">
      <div className="pointer-events-auto max-w-7xl w-full mx-auto px-4 sm:px-5 h-14 rounded-full bg-card/90 backdrop-blur-md border border-border/80 shadow-md shadow-black/5 flex items-center justify-between gap-2 lg:gap-4">

        {/* Logo — always visible */}
        <Logo />

        {/* Desktop nav links — hidden below lg, compact on lg */}
        <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {menu.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              onClick={(e) => handleSmoothScroll(e, item.url)}
              className="px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer whitespace-nowrap"
            >
              {item.title}
            </Link>
          ))}
        </div>

        {/* Desktop auth — hidden below sm */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Open search dialog" className="rounded-full h-8 w-8 shrink-0" onClick={() => setOpenSearch(true)}>
            <MagnifyingGlass className="size-3.5" strokeWidth={2.5} />
          </Button>
          <Link href={auth.login.url} className="shrink-0">
            <Button variant="ghost" size="sm" className="rounded-full text-xs font-bold px-3">{auth.login.text}</Button>
          </Link>
          <Link href={auth.signup.url} className="shrink-0">
            <Button size="sm" className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-4 hover:bg-primary/90 shadow-sm whitespace-nowrap">{auth.signup.text}</Button>
          </Link>
        </div>

        {/* Mobile right actions — visible below sm */}
        <div className="flex sm:hidden items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Open search dialog" className="rounded-full h-8 w-8" onClick={() => setOpenSearch(true)}>
            <MagnifyingGlass className="size-3.5" strokeWidth={2.5} />
          </Button>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full text-sm hover:bg-muted transition-colors" aria-label="Open menu">
              <List className="size-4" strokeWidth={2.5} />
            </SheetTrigger>

            <SheetContent side="right" className="w-full max-w-sm overflow-y-auto px-6">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center">
                  <FreelanceXchainLogo iconSize={32} />
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6">
                <div className="flex w-full flex-col divide-y divide-border/40">
                  {menu.map((item) => (
                    <Link
                      key={item.title}
                      href={item.url}
                      onClick={(e) => handleSmoothScroll(e, item.url)}
                      className="flex items-center py-3 text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
                  <Link href={auth.login.url} className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">{auth.login.text}</Button>
                  </Link>
                  <Link href={auth.signup.url} className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-primary text-primary-foreground">{auth.signup.text}</Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search dialog */}
      <CommandDialog open={openSearch} onOpenChange={setOpenSearch}>
        <CommandInput value={globalSearchQuery} onValueChange={setGlobalSearchQuery} placeholder="Search projects, freelancers, features..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {globalSearchQuery.trim() && (
            <CommandGroup className="text-muted-foreground" heading="Search marketplace">
               <CommandItem asChild value={`Search projects ${globalSearchQuery}`}>
                 <Link href={`/projects?keyword=${encodeURIComponent(globalSearchQuery.trim())}`} onClick={() => setOpenSearch(false)}>
                   <Lightning className="size-4" strokeWidth={1.5} />Search projects for &quot;{globalSearchQuery.trim()}&quot;
                 </Link>
               </CommandItem>
               <CommandItem asChild value={`Search freelancers ${globalSearchQuery}`}>
                 <Link href={`/freelancers?keyword=${encodeURIComponent(globalSearchQuery.trim())}`} onClick={() => setOpenSearch(false)}>
                   <Users className="size-4" strokeWidth={1.5} />Search talent for &quot;{globalSearchQuery.trim()}&quot;
                 </Link>
               </CommandItem>
            </CommandGroup>
          )}
          <CommandGroup className="text-muted-foreground" heading="Quick Links">
            <CommandItem asChild value="browse projects">
              <Link href="/projects" onClick={() => setOpenSearch(false)}>
                <Lightning className="size-4" strokeWidth={1.5} />Browse Projects
              </Link>
            </CommandItem>
            <CommandItem asChild value="find freelancers">
              <Link href="/freelancers" onClick={() => setOpenSearch(false)}>
                <Users className="size-4" strokeWidth={1.5} />Find Talent
              </Link>
            </CommandItem>
            <CommandItem asChild value="crypto news">
              <Link href="/news" onClick={() => setOpenSearch(false)}>
                <Newspaper className="size-4" strokeWidth={1.5} />Crypto News
              </Link>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </nav>
  );
}
