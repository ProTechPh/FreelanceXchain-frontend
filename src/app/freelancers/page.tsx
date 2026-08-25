"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, ShieldCheck } from 'lucide-react';
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { PublicMarketplaceShell } from "@/components/marketplace/public-marketplace-shell";
import type { FreelancerProfile } from "@/types";
import { marketplaceFiltersFromSearchParams } from "@/lib/marketplace-search";

const availabilityColors: Record<string, string> = {
  available: "bg-success-subtle text-success dark:text-success",
  busy: "bg-warning-subtle text-warning",
  unavailable: "bg-neutral-subtle text-neutral",
};

function FreelancerResult({ freelancer, listingQuery }: { freelancer: FreelancerProfile; listingQuery: string }) {
  const initials = (freelancer.name ?? "U").split(" ").map((name) => name[0]).join("");
  const returnPath = `/freelancers${listingQuery ? `?${listingQuery}` : ""}`;
  return (
    <Link href={`/freelancers/${freelancer.userId}?returnTo=${encodeURIComponent(returnPath)}`} className="block h-full group">
      <div className="h-full rounded-3xl bg-card border border-border/80 p-6 shadow-md shadow-black/5 hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
        <div>
          <div className="mb-4 flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-base flex items-center justify-center shadow-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {freelancer.name || "Verified Freelancer"}
                </h2>
                <ShieldCheck className="size-4 text-success shrink-0" />
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                {freelancer.bio || "Full-stack Web3 & Smart Contract Developer."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold ${availabilityColors[freelancer.availability] || availabilityColors.available}`}>
              {freelancer.availability}
            </span>
            <span className="inline-flex items-center gap-1 text-2xs font-semibold text-muted-foreground">
              <MapPin className="size-3" /> {freelancer.nationality || "Remote"}
            </span>
          </div>

          <div className="my-3 flex flex-wrap gap-1.5">
            {freelancer.skills?.slice(0, 4).map((skill) => (
              <span
                key={skill.name}
                className="px-2 py-0.5 rounded-full bg-background border border-border/80 text-2xs font-semibold text-foreground/80"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-3.5 border-t border-border/50 flex items-center justify-between text-xs mt-3">
          <span className="font-bold text-primary text-sm">
            ${freelancer.hourlyRate}/hr
          </span>
          <span className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors">
            View Profile →
          </span>
        </div>
      </div>
    </Link>
  );
}

function FreelancersMarketplace() {
  const searchParams = useSearchParams();
  const serializedFilters = searchParams?.toString() ?? "";
  const initialFilters = marketplaceFiltersFromSearchParams(new URLSearchParams(serializedFilters));

  return (
    <PublicMarketplaceShell
      eyebrow="Verified Web3 freelancers and engineers"
      headline={
        <>
          Hire top Web3 and smart contract talent,{" "}
          <br className="hidden sm:inline" />
          <span className="font-semibold text-muted-foreground">secured by smart escrow.</span>
        </>
      }
      description="Connect with pre-vetted blockchain engineers, UI/UX designers, and AI specialists with verified on-chain portfolios."
    >
      <MarketplaceBrowser<FreelancerProfile>
        key={serializedFilters}
        kind="freelancer"
        variant="public"
        initialFilters={initialFilters}
        emptyMessage="No freelancers match these filters."
        layout="grid"
        renderItem={(freelancer, listingQuery) => <FreelancerResult freelancer={freelancer} listingQuery={listingQuery} />}
      />
    </PublicMarketplaceShell>
  );
}

export default function FreelancersPage() {
  return (
    <Suspense>
      <FreelancersMarketplace />
    </Suspense>
  );
}
