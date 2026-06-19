"use client"

import { Menu, Search, Shield, Brain, TrendingUp, Globe, Zap, Users } from "lucide-react";
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
    login: {
      text: string;
      url: string;
    };
    signup: {
      text: string;
      url: string;
    };
  };
}

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
          icon: <Shield className="size-5 shrink-0" />,
          url: "/#how-it-works",
        },
        {
          title: "AI Matching",
          description: "Advanced AI matches skills with project requirements",
          icon: <Brain className="size-5 shrink-0" />,
          url: "/#how-it-works",
        },
        {
          title: "On-Chain Reputation",
          description: "Build an immutable, transparent reputation on the blockchain",
          icon: <TrendingUp className="size-5 shrink-0" />,
          url: "/#about-section",
        },
        {
          title: "Global KYC",
          description: "Verified identity across 220+ countries with Didit integration",
          icon: <Globe className="size-5 shrink-0" />,
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
          icon: <Users className="size-5 shrink-0" />,
          url: "/about",
        },
        {
          title: "FAQs",
          description: "Frequently asked questions about the platform",
          icon: <Zap className="size-5 shrink-0" />,
          url: "/faqs",
        },
        {
          title: "Blog",
          description: "Latest news and updates from FreelanceXchain",
          icon: <Globe className="size-5 shrink-0" />,
          url: "/blog",
        },
        {
          title: "Status",
          description: "Platform status and uptime information",
          icon: <Shield className="size-5 shrink-0" />,
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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Desktop Navbar */}
        <div className="hidden lg:flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span className="font-bold text-lg gradient-text">FreelanceX</span>
          </Link>
          <div className="flex items-center">
            <NavigationMenu className="[&_[data-radix-navigation-menu-viewport]]:rounded-3xl">
              <ul className="group flex flex-1 list-none items-center justify-center space-x-1 rounded-3xl">
                {menu.map((item) => (
                  <React.Fragment key={item.title}>
                    {renderMenuItem(item)}
                  </React.Fragment>
                ))}
              </ul>
            </NavigationMenu>
          </div>
        </div>

        {/* Desktop Auth */}
        <div className="hidden lg:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenSearch(true)}
          >
            <Search className="size-4" />
          </Button>
          <Link href={auth.login.url}>
            <Button variant="outline" size="sm">
              {auth.login.text}
            </Button>
          </Link>
          <Link href={auth.signup.url}>
            <Button size="sm" className="gradient-primary text-white">
              {auth.signup.text}
            </Button>
          </Link>
        </div>

        {/* Mobile Navbar */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="font-bold text-lg gradient-text">FreelanceX</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpenSearch(true)}
              >
                <Search className="size-4" />
              </Button>
              <Sheet>
                <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
                  <Menu className="size-4" />
                </SheetTrigger>
                <SheetContent className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>
                      <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        <span className="font-bold text-lg gradient-text">FreelanceX</span>
                      </Link>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="my-6 flex flex-col gap-6">
                    <Accordion
                      type="single"
                      collapsible
                      className="flex w-full flex-col gap-4"
                    >
                      {menu.map((item) => renderMobileMenuItem(item))}
                    </Accordion>
                    <div className="flex flex-col gap-3">
                      <Link href={auth.login.url}>
                        <Button variant="outline" className="w-full">
                          {auth.login.text}
                        </Button>
                      </Link>
                      <Link href={auth.signup.url}>
                        <Button className="w-full gradient-primary text-white">
                          {auth.signup.text}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Search Popup */}
      <CommandDialog open={openSearch} onOpenChange={setOpenSearch}>
        <CommandInput placeholder="Search projects, freelancers, features..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="text-muted-foreground" heading="Pages">
            <CommandItem>
              <a href="/projects" className="flex items-center gap-2">
                <Zap className="size-4" />
                Browse Projects
              </a>
            </CommandItem>
            <CommandItem>
              <a href="/freelancers" className="flex items-center gap-2">
                <Users className="size-4" />
                Find Talent
              </a>
            </CommandItem>
            <CommandItem>
              <a href="/leaderboard" className="flex items-center gap-2">
                <TrendingUp className="size-4" />
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
      <NavigationMenuItem key={item.title} className="text-muted-foreground !rounded-3xl">
        <NavigationMenuTrigger className="!rounded-3xl">{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent className="!rounded-3xl">
          <div className="w-80 p-3 space-y-1">
            {item.items.map((subItem) => (
              <NavigationMenuLink
                key={subItem.title}
                href={subItem.url}
                className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
              >
                {subItem.icon}
                <div>
                  <div className="text-sm font-semibold">
                    {subItem.title}
                  </div>
                  {subItem.description && (
                    <p className="text-sm leading-snug text-muted-foreground">
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
    <a
      key={item.title}
      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
      href={item.url}
    >
      {item.title}
    </a>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <Link
              key={subItem.title}
              className="flex select-none gap-4 rounded-md p-3 leading-none outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
              href={subItem.url}
            >
              {subItem.icon}
              <div>
                <div className="text-sm font-semibold">{subItem.title}</div>
                {subItem.description && (
                  <p className="text-sm leading-snug text-muted-foreground">
                    {subItem.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <a key={item.title} href={item.url} className="font-semibold">
      {item.title}
    </a>
  );
};
