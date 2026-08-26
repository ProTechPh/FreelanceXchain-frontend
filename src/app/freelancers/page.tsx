"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, ShieldCheck, Clock, CircleCheck, CircleMinus, ArrowRight } from 'lucide-react';
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { PublicMarketplaceShell } from "@/components/marketplace/public-marketplace-shell";
import type { FreelancerProfile } from "@/types";
import { marketplaceFiltersFromSearchParams } from "@/lib/marketplace-search";

const availabilityConfig: Record<string, { colors: string; icon: React.ReactNode; label: string }> = {
  available: {
    colors: "bg-success/10 text-success border border-success/20",
    icon: <CircleCheck className="w-3 h-3" />,
    label: "Available",
  },
  busy: {
    colors: "bg-warning/10 text-warning border border-warning/20",
    icon: <Clock className="w-3 h-3" />,
    label: "Busy",
  },
  unavailable: {
    colors: "bg-neutral/10 text-neutral border border-neutral/20",
    icon: <CircleMinus className="w-3 h-3" />,
    label: "Unavailable",
  },
};

function FreelancerResult({ freelancer, listingQuery }: { freelancer: FreelancerProfile; listingQuery: string }) {
  const initials = (freelancer.name ?? "U").split(" ").map((name) => name[0]).join("");
  const returnPath = `/freelancers${listingQuery ? `?${listingQuery}` : ""}`;
  const availability = availabilityConfig[freelancer.availability] || availabilityConfig.available;
  
  return (
    <Link href={`/freelancers/${freelancer.userId}?returnTo=${encodeURIComponent(returnPath)}`} className="block h-full group">
      <div className="h-full rounded-3xl bg-card border border-border/80 p-6 shadow-md shadow-black/5 hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
        <div>
          {/* Header: Avatar + Name + Bio */}
          <div className="mb-5 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-extrabold text-lg flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {freelancer.name || "Verified Freelancer"}
                </h2>
                <ShieldCheck className="w-5 h-5 text-success shrink-0" />
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                {freelancer.bio || "Full-stack Web3 & Smart Contract Developer."}
              </p>
            </div>
          </div>

          {/* Status + Location */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${availability.colors}`}>
              {availability.icon}
              {availability.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" /> {freelancer.nationality || "Remote"}
            </span>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2">
            {freelancer.skills?.slice(0, 4).map((skill) => (
              <span
                key={skill.name}
                className="px-3 py-1 rounded-full bg-background border border-border/80 text-sm font-medium text-foreground/80 hover:border-primary/50 transition-colors"
              >
                {skill.name}
              </span>
            ))}
            {freelancer.skills && freelancer.skills.length > 4 && (
              <span className="px-3 py-1 rounded-full bg-background border border-border/80 text-sm font-medium text-muted-foreground">
                +{freelancer.skills.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Footer: Price + CTA */}
        <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-5">
          <span className="font-bold text-primary text-lg">
            ${freelancer.hourlyRate}<span className="text-sm font-medium text-muted-foreground">/hr</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/80 group-hover:text-primary transition-colors">
            View Profile
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
