'use client';

import { useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProjectSubmissionSkill } from '@/lib/project-submission';

export interface ProjectSkillCategory {
  id: string;
  name: string;
  skills: ProjectSubmissionSkill[];
}

interface ProjectSkillSelectorProps {
  categories: ProjectSkillCategory[];
  selected: ProjectSubmissionSkill[];
  loading: boolean;
  onAdd: (skill: ProjectSubmissionSkill) => void;
  onRemove: (skillId: string) => void;
  onClear: () => void;
  invalid?: boolean;
  labelledBy?: string;
  describedBy?: string;
}

const ALL = 'all';

/**
 * Browses the full skill catalog for a project posting. The panel shows the
 * current picks on top and the catalog below; every skill is a toggle, so the
 * same click that adds a skill removes it again. Categories and search narrow
 * the catalog without touching the picks.
 */
export function ProjectSkillSelector({
  categories,
  selected,
  loading,
  onAdd,
  onRemove,
  onClear,
  invalid,
  labelledBy,
  describedBy,
}: ProjectSkillSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [query, setQuery] = useState('');

  const search = query.trim().toLowerCase();
  const selectedIds = useMemo(() => new Set(selected.map((skill) => skill.id)), [selected]);

  const selectedPerCategory = useMemo(
    () => new Map(categories.map((category) => [category.id, category.skills.filter((skill) => selectedIds.has(skill.id)).length])),
    [categories, selectedIds],
  );

  const visibleGroups = useMemo(
    () =>
      categories
        .filter((category) => activeCategory === ALL || category.id === activeCategory)
        .map((category) => {
          const categoryMatches = search !== '' && category.name.toLowerCase().includes(search);
          return {
            ...category,
            skills: category.skills.filter(
              (skill) => search === '' || categoryMatches || skill.name.toLowerCase().includes(search),
            ),
          };
        })
        .filter((category) => category.skills.length > 0),
    [categories, activeCategory, search],
  );

  const toggle = (skill: ProjectSubmissionSkill) => {
    if (selectedIds.has(skill.id)) onRemove(skill.id);
    else onAdd(skill);
  };

  if (loading) {
    return (
      <div role="status" className="space-y-3 rounded-lg border border-border p-4">
        <Skeleton className="h-9 w-full rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <span className="sr-only">Loading skills</span>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
        The skill list could not be loaded. Refresh the page to try again.
      </p>
    );
  }

  const activeCategoryName = categories.find((category) => category.id === activeCategory)?.name;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-background',
        invalid ? 'border-destructive' : 'border-border',
      )}
    >
      {/* Current picks */}
      <div className="border-b border-border bg-muted/30 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium">
            Selected skills{' '}
            <span className="text-muted-foreground" aria-live="polite">({selected.length})</span>
          </p>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-sm text-xs font-medium text-muted-foreground underline-offset-4 hover:text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear all
            </button>
          )}
        </div>
        {selected.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No skills selected yet. Choose from the list below.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-label="Selected skills">
            {selected.map((skill) => (
              <li key={skill.id}>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary py-1 pl-3 pr-1 text-sm font-medium text-primary-foreground">
                  {skill.name}
                  <button
                    type="button"
                    aria-label={`Remove ${skill.name}`}
                    onClick={() => onRemove(skill.id)}
                    className="rounded-full p-0.5 hover:bg-primary-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Catalog */}
      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search skills, e.g. React, Figma, Solidity…"
            aria-label="Search skills"
            aria-describedby={describedBy}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Filter by category</p>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap" role="group" aria-label="Skill categories">
            {[{ id: ALL, name: 'All categories' }, ...categories].map((category) => {
              const active = activeCategory === category.id;
              const count = category.id === ALL ? selected.length : selectedPerCategory.get(category.id) ?? 0;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                  )}
                >
                  {category.name}
                  {count > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 text-xs font-semibold tabular-nums',
                        active ? 'bg-background/20' : 'bg-primary/10 text-primary',
                      )}
                    >
                      <span aria-hidden="true">{count}</span>
                      <span className="sr-only">{count} selected</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-h-80 space-y-4 overflow-y-auto pr-1" aria-labelledby={labelledBy}>
          {visibleGroups.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <p>
                No skills match &ldquo;{query.trim()}&rdquo;
                {activeCategoryName ? ` in ${activeCategoryName}` : ''}.
              </p>
              <div className="mt-2 flex justify-center gap-3">
                <button type="button" onClick={() => setQuery('')} className="font-medium text-primary hover:underline">
                  Clear search
                </button>
                {activeCategory !== ALL && (
                  <button type="button" onClick={() => setActiveCategory(ALL)} className="font-medium text-primary hover:underline">
                    Search all categories
                  </button>
                )}
              </div>
            </div>
          ) : (
            visibleGroups.map((category) => (
              <section key={category.id} aria-label={category.name}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {category.name}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => {
                    const isSelected = selectedIds.has(skill.id);
                    const Icon = isSelected ? Check : Plus;
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggle(skill)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isSelected
                            ? 'border-primary bg-primary/10 font-medium text-primary hover:bg-primary/15'
                            : 'border-border text-foreground hover:border-primary/50 hover:bg-primary/5',
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
