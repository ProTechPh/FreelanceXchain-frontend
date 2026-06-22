"use client"

import { List, MagnifyingGlass, ShieldCheck, Brain, TrendUp, Globe, Lightning, Users } from "@phosphor-icons/react";
import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
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
  <Link href="/" className="flex items-center gap-2 shrink-0">
    <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    </div>
    <span className="font-bold text-base gradient-text">FreelanceX</span>
  </Link>
);

export default function Navbar({
  menu = [
    { title: "Home", url: "/" },
    {
      title: "Platform",
      url: "#",
      items: [
        {
          title: "Smart Escrow",
          description: "Secure milestone-based payments with Ethereum smart contracts",
          icon: <ShieldCheck className="size-5 shrink-0" weight="light" />,
          url: "/#how-it-works",
        },
        {
          title: "AI Matching",
          description: "Advanced AI matches skills with project requirements",
          icon: <Brain className="size-5 shrink-0" weight="light" />,
          url: "/#how-it-works",
        },
        {
          title: "On-Chain Reputation",
          description: "Build an immutable, transparent reputation on the blockchain",
          icon: <TrendUp className="size-5 shrink-0" weight="light" />,
          url: "/#about-section",
        },
        {
          title: "Global KYC",
          description: "Verified identity across 220+ countries with Didit integration",
          icon: <Globe className="size-5 shrink-0" weight="light" />,
          url: "/#about-section",
        },
      ],
    },
    {
      title: "Resources",
      url: "#",
      items: [
        {
          title: "About Us",
          description: "Learn about FreelanceXchain and our mission",
          icon: <Users className="size-5 shrink-0" weight="light" />,
          url: "/about",
        },
        {
          title: "FAQs",
          description: "Frequently asked questions about the platform",
          icon: <Lightning className="size-5 shrink-0" weight="light" />,
          url: "/faqs",
        },
        {
          title: "Blog",
          description: "Latest news and updates from FreelanceXchain",
          icon: <Globe className="size-5 shrink-0" weight="light" />,
          url: "/blog",
        },
        {
          title: "Status",
          description: "Platform status and uptime information",
          icon: <ShieldCheck className="size-5 shrink-0" weight="light" />,
          url: "/status",
        },
      ],
    },
    { title: "Projects", url: "/projects" },
    { title: "Freelancers", url: "/freelancers" },
    { title: "Leaderboard", url: "/leaderboard" },
  ],
  auth = {
    login: { text: "Sign in", url: "/login" },
    signup: { text: "Get Started", url: "/register" },
  },
}: NavbarProps) {
  const [openSearch, setOpenSearch] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo — always visible */}
        <Logo />

        {/* Desktop nav links — hidden below lg */}
        <div className="hidden lg:flex items-center flex-1 min-w-0">
          <NavigationMenu>
            <NavigationMenuList className="flex list-none items-center gap-1">
              {menu.map((item) => (
                <React.Fragment key={item.title}>
                  {renderMenuItem(item)}
                </React.Fragment>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Desktop auth — hidden below lg */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setOpenSearch(true)}>
            <MagnifyingGlass className="size-4" weight="light" />
          </Button>
          <Link href={auth.login.url}>
            <Button variant="outline" size="sm">{auth.login.text}</Button>
          </Link>
          <Link href={auth.signup.url}>
            <Button size="sm" className="gradient-primary text-white">{auth.signup.text}</Button>
          </Link>
        </div>

        {/* Mobile right actions — visible below lg */}
        <div className="flex lg:hidden items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setOpenSearch(true)}>
            <MagnifyingGlass className="size-4" weight="light" />
          </Button>

          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-sm hover:bg-accent transition-colors" aria-label="Open menu">
              <List className="size-5" weight="light" />
            </SheetTrigger>

            <SheetContent side="right" className="w-full max-w-sm overflow-y-auto px-6">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <span className="font-bold text-base gradient-text">FreelanceX</span>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-6">
                <Accordion type="single" collapsible className="flex w-full flex-col gap-1">
                  {menu.map((item) => renderMobileMenuItem(item))}
                </Accordion>

                <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
                  <Link href={auth.login.url} className="w-full">
                    <Button variant="outline" className="w-full">{auth.login.text}</Button>
                  </Link>
                  <Link href={auth.signup.url} className="w-full">
                    <Button className="w-full gradient-primary text-white">{auth.signup.text}</Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search dialog */}
      <CommandDialog open={openSearch} onOpenChange={setOpenSearch}>
        <CommandInput placeholder="Search projects, freelancers, features..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="text-muted-foreground" heading="Pages">
            <CommandItem asChild>
              <a href="/projects" className="flex items-center gap-2">
                <Lightning className="size-4" weight="light" />
                Browse Projects
              </a>
            </CommandItem>
            <CommandItem asChild>
              <a href="/freelancers" className="flex items-center gap-2">
                <Users className="size-4" weight="light" />
                Find Talent
              </a>
            </CommandItem>
            <CommandItem asChild>
              <a href="/leaderboard" className="flex items-center gap-2">
                <TrendUp className="size-4" weight="light" />
                Leaderboard
              </a>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </nav>
  );
}

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger className="text-sm text-muted-foreground bg-transparent hover:bg-white/[0.05] rounded-lg h-9 px-3">
          {item.title}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="w-72 p-2 space-y-0.5">
            {item.items.map((subItem) => (
              <NavigationMenuLink
                key={subItem.title}
                href={subItem.url}
                className="flex select-none gap-3 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-white/[0.05] hover:text-foreground"
              >
                <span className="text-foreground/50 mt-0.5">{subItem.icon}</span>
                <div>
                  <div className="text-sm font-medium text-foreground">{subItem.title}</div>
                  {subItem.description && (
                    <p className="text-xs leading-relaxed text-muted-foreground mt-0.5">
                      {subItem.description}
                    </p>
                  )}
                </div>
              </NavigationMenuLink>
            ))}
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        href={item.url}
        className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
      >
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b border-border/40 last:border-b-0">
        <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline hover:text-foreground">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="pb-2">
          <div className="flex flex-col gap-0.5">
            {item.items.map((subItem) => (
              <Link
                key={subItem.title}
                className="flex gap-3 rounded-lg p-3 text-sm transition-colors hover:bg-white/[0.05]"
                href={subItem.url}
              >
                <span className="text-foreground/50 mt-0.5 shrink-0">{subItem.icon}</span>
                <div>
                  <div className="font-medium text-foreground">{subItem.title}</div>
                  {subItem.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {subItem.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <div key={item.title} className="border-b border-border/40 last:border-b-0">
      <a
        href={item.url}
        className="flex items-center py-3 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
      >
        {item.title}
      </a>
    </div>
  );
};
