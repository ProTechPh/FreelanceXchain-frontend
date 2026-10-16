'use client';

import { useId, useMemo, useState, type ReactNode } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { SuggestSkillDialog } from '@/components/dashboard/suggest-skill-dialog';
import type { ProjectSubmissionSkill } from '@/lib/project-submission';
import { isSoftSkillCategory } from '@/lib/skill-taxonomy';

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
  /** Receives the picks being cleared: all of them, or only the open tab's when `splitSoftSkills` is on. */
  onClear?: (skills: ProjectSubmissionSkill[]) => void;
  invalid?: boolean;
  labelledBy?: string;
  describedBy?: string;
  /** Title above the current picks. */
  heading?: string;
  /** Shown when nothing is picked yet. */
  emptyText?: string;
  /** Extra detail rendered inside a picked skill's pill, e.g. years of experience. */
  renderSelectedDetail?: (skill: ProjectSubmissionSkill) => ReactNode;
  /**
   * Shows a Technical skills / Soft skills switch instead of the category
   * filter. Each tab lists, counts and clears only its own skills.
   */
  splitSoftSkills?: boolean;
  /**
   * Shows the picks as pills above the catalog. Turn it off when the page
   * lists the picks elsewhere; checked chips and tab counts still show them,
   * and picks the catalog view doesn't list appear in an "Also picked" row.
   */
  showSelectedPanel?: boolean;
  /** With the panel off, lists picks the catalog view doesn't show. Turn off when the page already lists every pick. */
  showUnlistedPicks?: boolean;
}

const ALL = 'all';

type SkillType = 'technical' | 'soft';

const SKILL_TYPE_TABS: Array<{ id: SkillType; label: string; placeholder: string }> = [
  { id: 'technical', label: 'Technical skills', placeholder: 'Search technical skills, e.g. React, Figma, Solidity…' },
  { id: 'soft', label: 'Soft skills', placeholder: 'Search soft skills, e.g. Communication, Leadership…' },
];


/**
 * Browses the full skill catalog for a project posting. The panel shows the
 * current picks on top and the catalog below; every skill is a toggle, so the
 * same click that adds a skill removes it again. Categories (or the
 * technical/soft tabs) and search narrow the catalog without touching the picks.
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
  heading = 'Selected skills',
  emptyText = 'No skills selected yet. Choose from the list below.',
  renderSelectedDetail,
  splitSoftSkills = false,
  showSelectedPanel = true,
  showUnlistedPicks = true,
}: ProjectSkillSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [skillType, setSkillType] = useState<SkillType>('technical');
  const [query, setQuery] = useState('');
  const [suggestSkillOpen, setSuggestSkillOpen] = useState(false);
  const tabsId = useId();

  const search = query.trim().toLowerCase();
  const selectedIds = useMemo(() => new Set(selected.map((skill) => skill.id)), [selected]);

  const softSkillIds = useMemo(
    () => new Set(categories.filter((category) => isSoftSkillCategory(category.name)).flatMap((category) => category.skills.map((skill) => skill.id))),
    [categories],
  );
  // Picks outside the catalog (legacy or custom names) count as technical.
  const selectedByType = useMemo(
    () => ({
      technical: selected.filter((skill) => !softSkillIds.has(skill.id)),
      soft: selected.filter((skill) => softSkillIds.has(skill.id)),
    }),
    [selected, softSkillIds],
  );
  const shownSelected = splitSoftSkills ? selectedByType[skillType] : selected;
  const shownCategories = useMemo(
    () =>
      splitSoftSkills
        ? categories.filter((category) => isSoftSkillCategory(category.name) === (skillType === 'soft'))
        : categories,
    [categories, skillType, splitSoftSkills],
  );
  const activeTab = SKILL_TYPE_TABS.find((tab) => tab.id === skillType)!;
  const unlistedSelected = useMemo(() => {
    const listedIds = new Set(shownCategories.flatMap((category) => category.skills.map((skill) => skill.id)));
    return shownSelected.filter((skill) => !listedIds.has(skill.id));
  }, [shownCategories, shownSelected]);

  const selectedPerCategory = useMemo(
    () => new Map(categories.map((category) => [category.id, category.skills.filter((skill) => selectedIds.has(skill.id)).length])),
    [categories, selectedIds],
  );

  const visibleGroups = useMemo(
    () =>
      shownCategories
        .filter((category) => splitSoftSkills || activeCategory === ALL || category.id === activeCategory)
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
    [shownCategories, splitSoftSkills, activeCategory, search],
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

  const activeCategoryName = splitSoftSkills
    ? undefined
    : categories.find((category) => category.id === activeCategory)?.name;
  const shownEmptyText = splitSoftSkills
    ? `No ${activeTab.label.toLowerCase()} picked yet. Choose from the list below.`
    : emptyText;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-background',
        invalid ? 'border-destructive' : 'border-border',
      )}
    >
      {splitSoftSkills && (
        <div role="tablist" aria-label="Skill type" className="grid grid-cols-2 gap-1 border-b border-border bg-muted/50 p-1">
          {SKILL_TYPE_TABS.map((tab) => {
            const active = skillType === tab.id;
            const count = selectedByType[tab.id].length;
            return (
              <button
                key={tab.id}
                id={`${tabsId}-${tab.id}-tab`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`${tabsId}-panel`}
                onClick={() => {
                  setSkillType(tab.id);
                  setQuery('');
                }}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs font-semibold tabular-nums',
                    active ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/15',
                  )}
                >
                  <span aria-hidden="true">{count}</span>
                  <span className="sr-only">, {count} picked</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div
        {...(splitSoftSkills && {
          id: `${tabsId}-panel`,
          role: 'tabpanel',
          'aria-labelledby': `${tabsId}-${skillType}-tab`,
        })}
      >
        {/* Current picks */}
        {showSelectedPanel && (
          <div className="border-b border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {heading}{' '}
                <span className="text-muted-foreground" aria-live="polite">({shownSelected.length})</span>
              </p>
              {shownSelected.length > 0 && onClear && (
                <button
                  type="button"
                  onClick={() => onClear(shownSelected)}
                  className="rounded-sm text-xs font-medium text-muted-foreground underline-offset-4 hover:text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Clear all
                </button>
              )}
            </div>
            {shownSelected.length === 0 ? (
              <p className="text-sm text-muted-foreground">{shownEmptyText}</p>
            ) : (
              <ul className="flex flex-wrap gap-2" aria-label={heading}>
                {shownSelected.map((skill) => (
                  <li key={skill.id}>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary py-1 pl-3 pr-1 text-sm font-medium text-primary-foreground">
                      {skill.name}
                      {renderSelectedDetail?.(skill)}
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
        )}

        {/* Catalog */}
        <div className="space-y-3 p-3">
          {!showSelectedPanel && showUnlistedPicks && unlistedSelected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Also picked:</span>
              <ul className="flex flex-wrap gap-1.5" aria-label="Also picked">
                {unlistedSelected.map((skill) => (
                  <li key={skill.id}>
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 py-0.5 pl-2.5 pr-1 text-sm font-medium text-primary">
                      {skill.name}
                      <button
                        type="button"
                        aria-label={`Remove ${skill.name}`}
                        onClick={() => onRemove(skill.id)}
                        className="rounded-full p-0.5 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="size-3" aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={splitSoftSkills ? activeTab.placeholder : 'Search skills, e.g. React, Figma, Solidity…'}
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

          {!splitSoftSkills && (
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
          )}

          <div className="max-h-80 space-y-4 overflow-y-auto pr-1" aria-labelledby={labelledBy}>
            {visibleGroups.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <p>
                  No skills match &ldquo;{query.trim()}&rdquo;
                  {activeCategoryName ? ` in ${activeCategoryName}` : ''}.
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => setQuery('')} className="font-medium text-primary hover:underline">
                    Clear search
                  </button>
                  {activeCategory !== ALL && (
                    <button type="button" onClick={() => setActiveCategory(ALL)} className="font-medium text-primary hover:underline">
                      Search all categories
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSuggestSkillOpen(true)}
                    className="font-medium text-primary hover:underline"
                  >
                    Suggest missing skill
                  </button>
                </div>
              </div>
            ) : (
              visibleGroups.map((category) => (
                <section key={category.id} aria-label={category.name}>
                  {shownCategories.length > 1 && (
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {category.name}
                    </h4>
                  )}
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
      <SuggestSkillDialog
        open={suggestSkillOpen}
        onOpenChange={setSuggestSkillOpen}
        initialName={query.trim()}
      />
    </div>
  );
}
