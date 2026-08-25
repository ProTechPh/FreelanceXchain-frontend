"use client"

import { List, MagnifyingGlass, TrendUp, Lightning, Users } from "@phosphor-icons/react";
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
  <Link href="/" className="flex items-center gap-2.5 shrink-0">
    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-xs">
      <svg className="w-4 h-4 text-primary-foreground fill-current" viewBox="0 0 24 24">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
      </svg>
    </div>
    <span className="font-extrabold text-lg text-foreground tracking-tight">FreelanceXchain</span>
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
    <nav className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none flex justify-center">
      <div className="pointer-events-auto max-w-5xl w-full mx-auto px-4 sm:px-6 h-14 rounded-full bg-card/90 backdrop-blur-md border border-border/80 shadow-md shadow-black/5 flex items-center justify-between gap-4">

        {/* Logo — always visible */}
        <Logo />

        {/* Desktop nav links — hidden below lg */}
        <div className="hidden md:flex items-center gap-1">
          {menu.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              onClick={(e) => handleSmoothScroll(e, item.url)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer"
            >
              {item.title}
            </Link>
          ))}
        </div>

        {/* Desktop auth — hidden below lg */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setOpenSearch(true)}>
            <MagnifyingGlass className="size-3.5" weight="bold" />
          </Button>
          <Link href={auth.login.url}>
            <Button variant="ghost" size="sm" className="rounded-full text-xs font-bold">{auth.login.text}</Button>
          </Link>
          <Link href={auth.signup.url}>
            <Button size="sm" className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-4 hover:bg-primary/90 shadow-sm">{auth.signup.text}</Button>
          </Link>
        </div>

        {/* Mobile right actions — visible below lg */}
        <div className="flex sm:hidden items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setOpenSearch(true)}>
            <MagnifyingGlass className="size-3.5" weight="bold" />
          </Button>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full text-sm hover:bg-muted transition-colors" aria-label="Open menu">
              <List className="size-4" weight="bold" />
            </SheetTrigger>

            <SheetContent side="right" className="w-full max-w-sm overflow-y-auto px-6">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-xs">
                    <svg className="w-4 h-4 text-primary-foreground fill-current" viewBox="0 0 24 24">
                      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                    </svg>
                  </div>
                  <span className="font-extrabold text-lg text-foreground tracking-tight">FreelanceXchain</span>
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
                   <Lightning className="size-4" weight="light" />Search projects for &quot;{globalSearchQuery.trim()}&quot;
                 </Link>
               </CommandItem>
               <CommandItem asChild value={`Search freelancers ${globalSearchQuery}`}>
                 <Link href={`/freelancers?keyword=${encodeURIComponent(globalSearchQuery.trim())}`} onClick={() => setOpenSearch(false)}>
                   <Users className="size-4" weight="light" />Search freelancers for &quot;{globalSearchQuery.trim()}&quot;
                 </Link>
               </CommandItem>
            </CommandGroup>
          )}
          <CommandGroup className="text-muted-foreground" heading="Pages">
            <CommandItem asChild>
              <Link href="/projects" className="flex items-center gap-2">
                <Lightning className="size-4" weight="light" />
                Browse Projects
              </Link>
            </CommandItem>
            <CommandItem asChild>
              <Link href="/freelancers" className="flex items-center gap-2">
                <Users className="size-4" weight="light" />
                Find Talent
              </Link>
            </CommandItem>
            <CommandItem asChild>
              <Link href="/leaderboard" className="flex items-center gap-2">
                <TrendUp className="size-4" weight="light" />
                Leaderboard
              </Link>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </nav>
  );
}
