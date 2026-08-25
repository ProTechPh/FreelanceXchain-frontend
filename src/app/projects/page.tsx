"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, DollarSign, Users, Zap, ShieldCheck } from 'lucide-react';
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { PublicMarketplaceShell } from "@/components/marketplace/public-marketplace-shell";
import type { Project } from "@/types";
import { marketplaceFiltersFromSearchParams } from "@/lib/marketplace-search";

function ProjectResult({ project, listingQuery }: { project: Project; listingQuery: string }) {
  const returnPath = `/projects${listingQuery ? `?${listingQuery}` : ""}`;
  return (
    <Link href={`/projects/${project.id}?returnTo=${encodeURIComponent(returnPath)}`} className="block group">
      <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-7 shadow-md shadow-black/5 hover:border-primary/50 hover:shadow-xl transition-all duration-300">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-2xs font-bold text-success dark:text-success bg-success-subtle px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="size-3" /> Escrow Protected
              </span>
              {project.isRush && (
                <span className="inline-flex items-center gap-1 text-2xs font-bold text-warning bg-warning-subtle px-2.5 py-0.5 rounded-full">
                  <Zap className="size-3" /> Rush +{project.rushFeePercentage}%
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mt-2 group-hover:text-primary transition-colors">
              {project.title}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Posted by <span className="font-semibold text-foreground">{project.employer?.name || "Verified Employer"}</span>
            </p>
          </div>
        </div>

        <p className="mb-4 line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {project.description}
        </p>

        <div className="mb-5 flex flex-wrap gap-1.5">
          {project.requiredSkills?.map((skill) => (
            <span
              key={skill.skillId ?? skill.skillName}
              className="px-2.5 py-0.5 rounded-full bg-background border border-border/80 text-2xs font-semibold text-foreground/80"
            >
              {skill.skillName}
            </span>
          ))}
        </div>

        <div className="pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-bold text-foreground text-sm">
              <DollarSign className="size-4 text-success dark:text-success" />
              ${project.budget.toLocaleString()} USDC
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              Due {new Date(project.deadline).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {project.proposalCount || 0} proposals
            </span>
          </div>

          <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
            View Details & Apply →
          </span>
        </div>
      </div>
    </Link>
  );
}

function ProjectsMarketplace() {
  const searchParams = useSearchParams();
  const serializedFilters = searchParams?.toString() ?? "";
  const initialFilters = marketplaceFiltersFromSearchParams(new URLSearchParams(serializedFilters));

  return (
    <PublicMarketplaceShell
      eyebrow="Verified escrow project listings"
      headline={
        <>
          Discover high-impact Web3 projects,{" "}
          <br className="hidden sm:inline" />
          <span className="font-semibold text-muted-foreground">secured by smart escrow.</span>
        </>
      }
      description="Discover verified client projects, generate tailored milestone proposals with AI, and get guaranteed payouts locked in smart escrow."
    >
      <MarketplaceBrowser<Project>
        key={serializedFilters}
        kind="project"
        variant="public"
        initialFilters={initialFilters}
        emptyMessage="No open projects match these filters."
        layout="list"
        renderItem={(project, listingQuery) => <ProjectResult project={project} listingQuery={listingQuery} />}
      />
    </PublicMarketplaceShell>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsMarketplace />
    </Suspense>
  );
}
