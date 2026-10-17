'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';

import { detectCategoryIds, isSoftSkillCategory, type SkillOptionCategory } from '@/lib/skill-taxonomy';

/**
 * Narrows the technical skill categories to the ones a title points to (a job
 * position, a project title), with manual corrections on top. Soft skills
 * always stay; with nothing detected or added, every category shows.
 */
export function useSkillCategoryScope<C extends SkillOptionCategory>(text: string, categories: C[]) {
  // Manual corrections to the categories detected from the text.
  const [excludedCategoryIds, setExcludedCategoryIds] = useState<string[]>([]);
  const [addedCategoryIds, setAddedCategoryIds] = useState<string[]>([]);

  const technicalCategories = useMemo(
    () => categories.filter((category) => !isSoftSkillCategory(category.name)),
    [categories]
  );
  const detectedCategoryIds = useMemo(() => detectCategoryIds(text, categories), [text, categories]);
  const shownCategoryIds = useMemo(() => {
    const shown = new Set(detectedCategoryIds.filter((id) => !excludedCategoryIds.includes(id)));
    addedCategoryIds.forEach((id) => shown.add(id));
    return shown;
  }, [detectedCategoryIds, excludedCategoryIds, addedCategoryIds]);
  const scopedCategories = useMemo(
    () =>
      shownCategoryIds.size > 0
        ? categories.filter((category) => shownCategoryIds.has(category.id) || isSoftSkillCategory(category.name))
        : categories,
    [shownCategoryIds, categories]
  );

  const hideCategory = (id: string) => {
    setAddedCategoryIds((current) => current.filter((candidate) => candidate !== id));
    setExcludedCategoryIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const showCategory = (id: string) => {
    setExcludedCategoryIds((current) => current.filter((candidate) => candidate !== id));
    setAddedCategoryIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const reset = () => {
    setExcludedCategoryIds([]);
    setAddedCategoryIds([]);
  };

  return { technicalCategories, shownCategoryIds, scopedCategories, hideCategory, showCategory, reset };
}

export type SkillCategoryScopeState = Pick<
  ReturnType<typeof useSkillCategoryScope>,
  'technicalCategories' | 'shownCategoryIds' | 'hideCategory' | 'showCategory'
>;

interface SkillCategoryScopeProps {
  scope: SkillCategoryScopeState;
  /** Shown when nothing is detected and the source text is empty. */
  emptyText: string;
  /** Shown when the source text matched no category. */
  noMatchText: string;
  hasText: boolean;
}

/** "Showing skills for: [category ×] … + Add category" row above a skill selector. */
export function SkillCategoryScope({ scope, emptyText, noMatchText, hasText }: SkillCategoryScopeProps) {
  const { technicalCategories, shownCategoryIds, hideCategory, showCategory } = scope;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
      {shownCategoryIds.size > 0 ? (
        <>
          <span>Showing skills for:</span>
          {technicalCategories
            .filter((category) => shownCategoryIds.has(category.id))
            .map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 py-0.5 pl-2.5 pr-1 font-medium text-primary"
              >
                {category.name}
                <button
                  type="button"
                  aria-label={`Stop showing ${category.name} skills`}
                  onClick={() => hideCategory(category.id)}
                  className="rounded-full p-0.5 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            ))}
        </>
      ) : (
        <span>{hasText ? noMatchText : emptyText}</span>
      )}
      {technicalCategories.some((category) => !shownCategoryIds.has(category.id)) && (
        <select
          aria-label="Add a skill category"
          className="h-7 rounded-full border border-dashed border-input bg-transparent px-2.5 text-xs text-foreground"
          value=""
          onChange={(event) => {
            if (event.target.value) showCategory(event.target.value);
          }}
        >
          <option value="">+ Add category</option>
          {technicalCategories
            .filter((category) => !shownCategoryIds.has(category.id))
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
      )}
    </div>
  );
}
