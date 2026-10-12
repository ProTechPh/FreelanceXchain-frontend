"use client";

import Link from "next/link";
import { ArrowRightIcon, BriefcaseIcon, UserSearchIcon } from "@/components/ui/brand-icons";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/stores/authStore";

export function HeroActions() {
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && isAuthenticated && !!user;

  if (isLoggedIn) {
    return (
      <div className="mt-8 flex justify-center">
        <Link
          href={`/dashboard/${user.role || "freelancer"}`}
          className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-md transition-[background-color,box-shadow,transform] duration-fast hover:bg-primary-hover hover:shadow-lg active:scale-[0.98]"
        >
          Go to Dashboard
          <ArrowRightIcon className="size-4 transition-transform duration-fast group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
      <Link
        href="/projects"
        className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-md transition-[background-color,box-shadow,transform] duration-fast hover:bg-primary-hover hover:shadow-lg active:scale-[0.98]"
      >
        <BriefcaseIcon className="size-4" aria-hidden="true" />
        I&apos;m freelancing
        <ArrowRightIcon className="size-4 transition-transform duration-fast group-hover:translate-x-1" aria-hidden="true" />
      </Link>
      <Link
        href="/freelancers"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border-strong bg-card px-7 py-3 text-sm font-semibold text-foreground transition-[background-color,border-color,transform] duration-fast hover:bg-muted active:scale-[0.98]"
      >
        <UserSearchIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        I&apos;m hiring
      </Link>
    </div>
  );
}
