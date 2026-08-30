import Link from 'next/link';
import { Clock, ShieldCheck, Users, Zap } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/status-badge';
import type { Project } from '@/types';

interface ProjectListItemProps {
  project: Project;
  /** Path to return to after viewing the project. */
  returnTo: string;
  /** 0–100 skill match from the recommendations endpoint. Omitted when unknown. */
  matchScore?: number;
  matchedSkills?: string[];
  /** Optional custom detail href. Defaults to dashboard freelancer project detail. */
  href?: string;
}

/**
 * Compact project row for the in-app marketplace.
 *
 * Follows the workspace mock on the landing page: an initial tile, the title and
 * client on one line, and a single dense meta line carrying the facts a
 * freelancer actually decides on — budget, deadline, competition. The public
 * listing card stays roomier; this one is built for scanning twenty in a row.
 */
export function ProjectListItem({ project, returnTo, matchScore, matchedSkills, href }: ProjectListItemProps) {
  const client = project.employer?.name || 'Verified employer';
  const initial = client.trim().charAt(0).toUpperCase() || '?';
  const skills = project.requiredSkills ?? [];
  const matched = new Set(matchedSkills ?? []);
  const projectLink = href || `/dashboard/freelancer/projects/${project.id}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <article
      className={cn(
        'group relative rounded-xl border border-border bg-card p-4 transition-colors duration-fast',
        'hover:border-primary hover:bg-accent/40',
        'focus-within:border-primary focus-within:bg-accent/40',
      )}
    >
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-sm font-bold text-foreground"
        >
          {initial}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pr-10">
            <h3 className="text-sm font-bold text-foreground">
              <Link
                href={projectLink}
                className="rounded-sm outline-none after:absolute after:inset-0 after:content-[''] group-hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {project.title}
              </Link>
            </h3>
            <span className="truncate text-xs text-muted-foreground">• {client}</span>
          </div>

          <p className="mt-1 line-clamp-2 pr-10 text-xs leading-relaxed text-muted-foreground">
            {project.description}
          </p>

          {skills.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1">
              {skills.slice(0, 5).map((skill) => {
                const isMatch = matched.has(skill.skillName);
                return (
                  <li
                    key={skill.skillId ?? skill.skillName}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-2xs font-medium',
                      isMatch
                        ? 'border-success-border bg-success-subtle text-success'
                        : 'border-border bg-muted text-muted-foreground',
                    )}
                  >
                    {skill.skillName}
                  </li>
                );
              })}
              {skills.length > 5 && (
                <li className="px-1 py-0.5 text-2xs text-muted-foreground">+{skills.length - 5}</li>
              )}
            </ul>
          )}

          {/* One dense meta line, in decision order: money, time, competition. */}
          <dl className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <dt className="sr-only">Budget</dt>
              <dd className="text-xs font-bold text-foreground tabular-nums">{project.budget.toLocaleString()} ETH</dd>
            </div>
            <span aria-hidden="true">•</span>
            <div className="flex items-center gap-1">
              <Clock className="size-3" aria-hidden="true" />
              <dt className="sr-only">Deadline</dt>
              <dd>Due {formatDate(project.deadline)}</dd>
            </div>
            <span aria-hidden="true">•</span>
            <div className="flex items-center gap-1">
              <Users className="size-3" aria-hidden="true" />
              <dt className="sr-only">Proposals received</dt>
              <dd>{project.proposalCount || 0} proposal{project.proposalCount === 1 ? '' : 's'}</dd>
            </div>
            <span aria-hidden="true">•</span>
            <div className="flex items-center gap-1 text-success">
              <ShieldCheck className="size-3" aria-hidden="true" />
              <dt className="sr-only">Payment protection</dt>
              <dd className="font-medium">Escrow protected</dd>
            </div>

            {/* Signals sit at the end of the meta line rather than in a right-hand
                column, which the favourite button occupies. */}
            <div className="ml-auto flex items-center gap-1.5">
              {typeof matchScore === 'number' && (
                <>
                  <dt className="sr-only">Skill match</dt>
                  <dd className="text-2xs font-bold text-success tabular-nums">
                    {Math.round(matchScore)}% skill match
                  </dd>
                </>
              )}
              {project.isRush && (
                <>
                  <dt className="sr-only">Rush premium</dt>
                  <dd className="inline-flex items-center gap-1 rounded-full border border-warning-border bg-warning-subtle px-2 py-0.5 text-2xs font-semibold text-warning">
                    <Zap className="size-3" aria-hidden="true" /> Rush +{project.rushFeePercentage}%
                  </dd>
                </>
              )}
              <dt className="sr-only">Status</dt>
              <dd>
                <StatusBadge status={project.status} domain="project" size="sm" />
              </dd>
            </div>
          </dl>
        </div>

      </div>
    </article>
  );
}
