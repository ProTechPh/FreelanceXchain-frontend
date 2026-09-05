"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, Coins, Users, Zap, ShieldCheck, Briefcase } from 'lucide-react';
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { PublicMarketplaceShell } from "@/components/marketplace/public-marketplace-shell";
import type { Project } from "@/types";
import { marketplaceFiltersFromSearchParams } from "@/lib/marketplace-search";

function formatDeadline(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days left`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function ProjectResult({ project, listingQuery }: { project: Project; listingQuery: string }) {
  const returnPath = `/projects${listingQuery ? `?${listingQuery}` : ""}`;
  const deadline = formatDeadline(project.deadline);
  
  return (
    <Link href={`/projects/${project.id}?returnTo=${encodeURIComponent(returnPath)}`} className="block group">
      <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-7 shadow-md shadow-black/5 hover:border-primary/50 hover:shadow-xl transition-all duration-300">
        {/* Header: Badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 border border-success/20 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Escrow Protected
          </span>
          {project.isRush && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning bg-warning/10 border border-warning/20 px-3 py-1 rounded-full">
              <Zap className="w-3.5 h-3.5" />
              Rush +{project.rushFeePercentage}%
            </span>
          )}
        </div>

        {/* Title + Employer */}
        <div className="mb-3">
          <h2 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {project.title}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            Posted by <span className="font-semibold text-foreground">{project.employer?.name || "Verified Employer"}</span>
          </p>
        </div>

        {/* Description */}
        <p className="mb-5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
          {project.description}
        </p>

        {/* Skills */}
        <div className="mb-5 flex flex-wrap gap-2">
          {project.requiredSkills?.slice(0, 5).map((skill) => (
            <span
              key={skill.skillId ?? skill.skillName}
              className="px-3 py-1.5 rounded-full bg-background border border-border/80 text-xs font-semibold text-foreground/80 hover:border-primary/50 transition-colors"
            >
              {skill.skillName}
            </span>
          ))}
          {project.requiredSkills && project.requiredSkills.length > 5 && (
            <span className="px-3 py-1.5 rounded-full bg-background border border-border/80 text-xs font-semibold text-muted-foreground">
              +{project.requiredSkills.length - 5} more
            </span>
          )}
        </div>

        {/* Footer: Stats + CTA */}
        <div className="pt-5 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5 text-sm">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <Coins className="w-4 h-4 text-primary" />
              {project.budget.toLocaleString()} ETH
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {deadline}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-4 h-4" />
              {project.proposalCount || 0} proposals
            </span>
          </div>

          <span className="text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
            View Details →
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
