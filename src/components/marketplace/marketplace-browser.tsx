"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { BookmarkPlus, Briefcase, ChevronDown, Heart, ListFilter, Search, Trash2, X } from 'lucide-react';
import { toast } from "sonner";
import { favoritesApi, freelancersApi, projectsApi, savedSearchesApi, skillsApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/auth-contract";
import { formatAmount } from "@/lib/format";
import {
  buildMarketplaceSearchParams,
  createSavedSearchFilters,
  marketplaceFiltersToSearchParams,
  restoreSavedSearchFilters,
  type MarketplaceFilters,
} from "@/lib/marketplace-search";
import { useAuthStore } from "@/stores/authStore";
import type { Favorite, FreelancerProfile, Project, ProjectCategoryStat, SavedSearch, Skill } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type MarketplaceKind = "project" | "freelancer";

type MarketplaceBrowserProps<T extends Project | FreelancerProfile> = {
  kind: MarketplaceKind;
  emptyMessage: string;
  layout: "list" | "grid";
  renderItem: (item: T, listingQuery: string) => ReactNode;
  getTargetId?: (item: T) => string;
  initialFilters?: MarketplaceFilters;
  /**
   * `public` is the marketing surface (roomier, softer radii); `dashboard` is
   * the in-app surface, which must sit inside the dashboard shell without
   * competing with it.
   */
  variant?: "public" | "dashboard";
  /** Action rendered beside the result count, e.g. a layout or sort control. */
  resultsAction?: ReactNode;
};

function createInitialFilters(filters?: MarketplaceFilters): MarketplaceFilters {
  return filters ? { ...filters, skillIds: [...filters.skillIds] } : { keyword: "", skillIds: [] };
}

function updateBudget(
  filters: MarketplaceFilters,
  field: "minBudget" | "maxBudget",
  value: string,
): MarketplaceFilters {
  const next = { ...filters };
  if (value === "") delete next[field];
  else next[field] = Number(value);
  return next;
}

/**
 * Search, filter and results surface for the project and freelancer marketplaces.
 *
 * It deliberately renders **no page chrome**. It previously baked in the public
 * `Navbar`, a marketing hero and the marketing `FooterSection`, which meant the
 * freelancer dashboard's Browse Projects page rendered the entire homepage shell
 * inside the dashboard shell — two navbars, two logos, two search fields and a
 * marketing footer under the sidebar. Each surface now owns its own header.
 */
export function MarketplaceBrowser<T extends Project | FreelancerProfile>({
  kind,
  emptyMessage,
  layout,
  renderItem,
  getTargetId = (item) => item.id,
  initialFilters,
  variant = "public",
  resultsAction,
}: MarketplaceBrowserProps<T>) {
  const isDashboard = variant === "dashboard";
  const panel = isDashboard ? "overflow-hidden rounded-lg" : "rounded-3xl p-6 sm:p-8";
  const control = isDashboard ? "rounded-md" : "rounded-full";
  const dashboardFilterGrid = kind === "project"
    ? "grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,2fr)_minmax(10rem,1fr)_minmax(8rem,0.65fr)_minmax(8rem,0.65fr)_auto] xl:items-end"
    : "grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,2fr)_minmax(10rem,1fr)_auto] xl:items-end";
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<T[]>([]);
  const [filters, setFilters] = useState<MarketplaceFilters>(() => createInitialFilters(initialFilters));
  const [appliedFilters, setAppliedFilters] = useState<MarketplaceFilters>(() => createInitialFilters(initialFilters));
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categoryStats, setCategoryStats] = useState<ProjectCategoryStat[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteActionId, setFavoriteActionId] = useState<string | null>(null);
  const [savedSearchName, setSavedSearchName] = useState("");
  const [notifyOnNew] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingSearch, setSavingSearch] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const selectedFilterCount = [
    Boolean(filters.keyword.trim()),
    filters.skillIds.length > 0,
    kind === "project" && filters.minBudget !== undefined,
    kind === "project" && filters.maxBudget !== undefined,
  ].filter(Boolean).length;

  const loadResults = useCallback(async (
    nextFilters: MarketplaceFilters,
    offset = 0,
    append = false,
  ) => {
    if (
      nextFilters.minBudget !== undefined
      && nextFilters.maxBudget !== undefined
      && nextFilters.minBudget > nextFilters.maxBudget
    ) {
      toast.error("Minimum budget cannot exceed maximum budget.");
      return;
    }

    setLoading(true);
    try {
      const params = buildMarketplaceSearchParams(nextFilters, offset);
      const response = kind === "project"
        ? await projectsApi.search(params)
        : await freelancersApi.search(params);
      const nextItems = response.data.items as T[];
      setItems((current) => append ? [...current, ...nextItems] : nextItems);
      setAppliedFilters(nextFilters);
      setHasMore(response.data.metadata.hasMore);
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Unable to search ${kind}s.`));
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadResults(appliedFilters);
  }, [appliedFilters, loadResults]);

  useEffect(() => {
    async function loadAuxiliaryData() {
      // None of this blocks browsing — it fills in filters, saved searches and
      // favourites. Four independent failures used to mean four red toasts at
      // once, so they are collected and reported as one warning instead.
      const unavailable: string[] = [];

      try {
        const skillsResponse = await skillsApi.getTaxonomy();
        const allSkills = skillsResponse.data.categories.flatMap((category) => category.skills ?? []);
        setSkills(allSkills);
      } catch {
        unavailable.push('skill filters');
      }

      if (kind === "project") {
        try {
          const categoriesResponse = await projectsApi.getCategoryStats();
          setCategoryStats(categoriesResponse.data.categories ?? []);
        } catch {
          unavailable.push('categories');
        }
      }

      if (user) {
        try {
          const searchesResponse = await savedSearchesApi.list(kind);
          const rawSearches: unknown = searchesResponse.data;
          const searchData = Array.isArray(rawSearches)
            ? rawSearches
            : rawSearches && typeof rawSearches === 'object' && 'data' in rawSearches && Array.isArray((rawSearches as { data: unknown[] }).data)
              ? (rawSearches as { data: SavedSearch[] }).data
              : [];
          setSavedSearches(searchData);
        } catch {
          unavailable.push('saved searches');
        }

        try {
          const favoritesResponse = await favoritesApi.list(kind);
          const rawFavorites: unknown = favoritesResponse.data;
          const favData = Array.isArray(rawFavorites)
            ? rawFavorites
            : rawFavorites && typeof rawFavorites === 'object' && 'data' in rawFavorites && Array.isArray((rawFavorites as { data: unknown[] }).data)
              ? (rawFavorites as { data: Favorite[] }).data
              : [];
          setFavoriteIds(new Set(favData.map((fav) => fav.targetId)));
        } catch {
          unavailable.push('favourites');
        }
      }

      if (unavailable.length > 0) {
        toast.warning('Some options could not be loaded', {
          id: 'marketplace-auxiliary',
          description: `Search still works. Unavailable: ${unavailable.join(', ')}.`,
        });
      }
    }

    void loadAuxiliaryData();
  }, [kind, user]);

  const savedSkillOptions = useMemo(
    () => skills.map((skill) => ({ id: skill.id, name: skill.name })),
    [skills],
  );


  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const searchParams = marketplaceFiltersToSearchParams(filters);
    const query = searchParams.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    void loadResults(filters);
  };

  const resetFilters = () => {
    const nextFilters: MarketplaceFilters = { keyword: "", skillIds: [] };
    setFilters(nextFilters);
    window.history.replaceState(null, "", window.location.pathname);
    void loadResults(nextFilters);
  };

  const toggleFavorite = async (targetId: string) => {
    setFavoriteActionId(targetId);
    try {
      if (favoriteIds.has(targetId)) {
        await favoritesApi.remove(kind, targetId);
        setFavoriteIds((current) => {
          const next = new Set(current);
          next.delete(targetId);
          return next;
        });
        toast.success(`Removed from favorites.`);
      } else {
        await favoritesApi.add(kind, targetId);
        setFavoriteIds((current) => new Set(current).add(targetId));
        toast.success(`Saved to favorites.`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update favorites."));
    } finally {
      setFavoriteActionId(null);
    }
  };

  const saveSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = savedSearchName.trim();
    if (!name) {
      toast.error("Enter a name for this search.");
      return;
    }

    setSavingSearch(true);
    try {
      const { data } = await savedSearchesApi.create({
        name,
        searchType: kind,
        filters: createSavedSearchFilters(filters, savedSkillOptions),
        notifyOnNew,
      });
      setSavedSearches((current) => [data, ...current]);
      setSavedSearchName("");
      toast.success("Search saved.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save this search."));
    } finally {
      setSavingSearch(false);
    }
  };

  const runSavedSearch = async (savedSearch: SavedSearch) => {
    const restored = restoreSavedSearchFilters(savedSearch.filters, savedSkillOptions);
    setFilters(restored);
    setLoading(true);
    try {
      const { data } = await savedSearchesApi.execute(savedSearch.id);
      setItems(data.results as T[]);
      setAppliedFilters(restored);
      setHasMore(false);
      const searchParams = marketplaceFiltersToSearchParams(restored);
      const query = searchParams.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
      toast.success(`Saved search executed: ${data.count} result${data.count === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to execute this saved search."));
    } finally {
      setLoading(false);
    }
  };

  const deleteSavedSearch = async (id: string) => {
    try {
      await savedSearchesApi.remove(id);
      setSavedSearches((current) => current.filter((savedSearch) => savedSearch.id !== id));
      toast.success("Saved search deleted.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete this saved search."));
    }
  };

  return (
    <div className={cn("flex flex-col", isDashboard ? "gap-5" : "gap-6")}>
          {/* Popular Categories Strip (For Projects) */}
          {kind === "project" && categoryStats.length > 0 && (
            <section aria-labelledby="project-categories-heading">
              <h2 id="project-categories-heading" className="mb-4 text-sm font-bold text-foreground">
                Popular Categories
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categoryStats.slice(0, 4).map((category) => (
                  <button
                    key={category.categoryId}
                    type="button"
                    className={cn(
                      "border border-border/80 bg-card p-5 text-left transition-all duration-300 outline-none shadow-sm shadow-black/5",
                      "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isDashboard ? "rounded-lg" : "rounded-2xl",
                    )}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, keyword: category.categoryName }));
                      void loadResults({ ...filters, keyword: category.categoryName });
                    }}
                  >
                    <p className="text-sm font-bold text-foreground">{category.categoryName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {category.projectCount} open project{category.projectCount === 1 ? "" : "s"}
                    </p>
                    <p className="mt-2 text-sm font-bold text-primary">
                      {formatAmount(category.totalBudget)} total budget
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Search & filters.
              On the dashboard these sit in one toolbar row: stacked full-width
              fields pushed the first project roughly 700px down the page, which
              is the opposite of what a browse view should do. Same controls and
              same labels — nothing is hidden behind a disclosure. */}
          <div className={cn("border border-border/80 bg-card shadow-md shadow-black/5", panel)}>
            <form
              className={isDashboard ? "" : "space-y-6"}
              onSubmit={submitSearch}
            >
              {isDashboard && (
                <div className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                      <ListFilter className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-foreground">
                        Filter {kind === "project" ? "projects" : "freelancers"}
                      </h2>
                      <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                        {selectedFilterCount === 0
                          ? `Showing all ${kind === "project" ? "open projects" : "freelancers"}`
                          : `${selectedFilterCount} ${selectedFilterCount === 1 ? "filter" : "filters"} selected`}
                      </p>
                    </div>
                  </div>

                  {selectedFilterCount > 0 && (
                    <Button type="button" variant="ghost" size="sm" className="self-start sm:self-auto" disabled={loading} onClick={resetFilters}>
                      <X className="size-4" aria-hidden="true" />
                      Clear filters
                    </Button>
                  )}
                </div>
              )}

              <div className={isDashboard ? dashboardFilterGrid : "flex flex-col gap-3 sm:flex-row"}>
                <div className={cn("space-y-1.5", isDashboard && "sm:col-span-2 xl:col-span-1")}>
                  <Label htmlFor="marketplace-keyword" className="text-xs font-semibold text-foreground">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="marketplace-keyword"
                      value={filters.keyword}
                      onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                      placeholder="Search by title, description, or keyword…"
                      className={cn("pl-10", control)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="skill-select" className="text-xs font-semibold text-foreground">Skill</Label>
                  <div className="relative">
                    <select
                      id="skill-select"
                      aria-label="Skill"
                      value={filters.skillIds[0] ?? ""}
                      onChange={(event) => {
                        const val = event.target.value;
                        setFilters((current) => ({ ...current, skillIds: val ? [val] : [] }));
                      }}
                      className={cn(
                        "h-10 w-full appearance-none border border-input bg-background px-3 pr-10 text-sm text-foreground transition-[border-color,box-shadow] duration-fast",
                        "hover:border-foreground/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
                        control,
                      )}
                    >
                      <option value="">All skills</option>
                      {skills.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  </div>
                </div>

                {kind === "project" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="minimum-budget" className="text-xs font-semibold text-foreground">Minimum budget</Label>
                      <Input
                        id="minimum-budget"
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={filters.minBudget ?? ""}
                        onChange={(event) => setFilters((current) => updateBudget(current, "minBudget", event.target.value))}
                        placeholder="500"
                        className={control}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="maximum-budget" className="text-xs font-semibold text-foreground">Maximum budget</Label>
                      <Input
                        id="maximum-budget"
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={filters.maxBudget ?? ""}
                        onChange={(event) => setFilters((current) => updateBudget(current, "maxBudget", event.target.value))}
                        placeholder="5000"
                        className={control}
                      />
                    </div>
                  </>
                )}

                {isDashboard && (
                  <div className="flex shrink-0 self-end">
                    <Button type="submit" className={cn("w-full sm:min-w-36", control)} disabled={loading}>
                      <ListFilter className="size-4" aria-hidden="true" />
                      Apply filters
                    </Button>
                  </div>
                )}
              </div>

              {!isDashboard && (
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className={control}>Apply filters</Button>
                  <Button type="button" variant="outline" className={control} onClick={resetFilters}>Reset</Button>
                </div>
              )}
            </form>
          </div>

          {/* Saved searches. On the dashboard this is a single row of chips
              rather than a second full-width panel below the filters. */}
          {user && (
            <div className={cn("border border-border bg-card shadow-xs", isDashboard ? "rounded-lg p-3" : panel)}>
              <div className={cn(isDashboard ? "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" : "grid gap-6 lg:grid-cols-2")}>
                <form className={isDashboard ? "flex items-end gap-2" : "space-y-3"} onSubmit={saveSearch}>
                  {!isDashboard && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Save current filter preset</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">Quickly return to this search criteria or receive match alerts.</p>
                    </div>
                  )}
                  <div className={cn("flex flex-col gap-2 sm:flex-row", isDashboard && "items-end")}>
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="saved-search-name" className={isDashboard ? "text-xs font-semibold text-foreground" : "sr-only"}>
                        Search name
                      </Label>
                      <Input
                        id="saved-search-name"
                        value={savedSearchName}
                        onChange={(event) => setSavedSearchName(event.target.value)}
                        placeholder="e.g. React & Solidity gigs"
                        className={cn(control, isDashboard && "lg:w-56")}
                      />
                    </div>
                    <Button size="sm" type="submit" loading={savingSearch} loadingText="Saving…" className={cn("shrink-0", control)}>
                      <BookmarkPlus className="size-3.5" aria-hidden="true" />Save search
                    </Button>
                  </div>
                </form>

                <div className={isDashboard ? "min-w-0" : ""}>
                  <h3 className={cn("text-sm font-semibold text-foreground", isDashboard && "sr-only")}>Your saved presets</h3>
                  {savedSearches.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      No saved searches yet. Save a filter set to reuse it or get alerts.
                    </p>
                  ) : (
                    <ul className={cn(isDashboard ? "flex flex-wrap items-center gap-2" : "mt-2 space-y-1.5")}>
                      {savedSearches.map((savedSearch) => (
                        <li
                          key={savedSearch.id}
                          className={cn(
                            "flex items-center gap-1 border border-border bg-background",
                            isDashboard ? "rounded-full py-0.5 pl-3 pr-1" : "justify-between gap-3 rounded-xl px-3 py-1.5",
                          )}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto justify-start p-0 text-xs font-semibold hover:bg-transparent hover:text-primary"
                            onClick={() => void runSavedSearch(savedSearch)}
                          >
                            {savedSearch.name}
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            aria-label={`Delete saved search ${savedSearch.name}`}
                            className="size-7 sm:size-6 text-muted-foreground hover:text-destructive"
                            onClick={() => void deleteSavedSearch(savedSearch.id)}
                          >
                            <Trash2 className="size-3.5 sm:size-3" aria-hidden="true" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm font-bold text-foreground">
              {loading && items.length === 0
                ? "Searching…"
                : `Showing ${items.length} ${kind}${items.length === 1 ? "" : "s"}`}
            </p>
            {resultsAction}
          </div>

          {/* Items Grid / List */}
          {loading && items.length === 0 ? (
            <div
              role="status"
              aria-live="polite"
              className={layout === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}
            >
              <span className="sr-only">Searching…</span>
              {Array.from({ length: layout === "grid" ? 6 : 4 }).map((_, index) => (
                <Skeleton key={index} className={cn(layout === "grid" ? "h-64" : "h-48", isDashboard ? "rounded-lg" : "rounded-3xl")} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl bg-card border border-border/80 p-12 text-center shadow-md shadow-black/5">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral/10 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{emptyMessage}</h3>
              <p className="text-sm text-muted-foreground mb-6">Try widening your budget range, clearing a skill, or searching a different keyword.</p>
              <Button variant="outline" className={control} onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          ) : (
            <div className={layout === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
              {items.map((item) => {
                const targetId = getTargetId(item);
                const favorite = favoriteIds.has(targetId);
                const listingQuery = marketplaceFiltersToSearchParams(appliedFilters).toString();
                return (
                  <div key={targetId} className="relative group">
                    {renderItem(item, listingQuery)}
                    {user && (
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className={cn(
                          "absolute right-3.5 top-3.5 z-10 size-10 sm:size-8 rounded-full border border-border bg-card/90 shadow-xs backdrop-blur-xs flex items-center justify-center",
                          favorite && "text-destructive",
                        )}
                        aria-label={favorite ? `Remove ${kind} from favorites` : `Save ${kind} to favorites`}
                        aria-pressed={favorite}
                        disabled={favoriteActionId === targetId}
                        onClick={() => void toggleFavorite(targetId)}
                      >
                        <Heart className="size-4 sm:size-3.5" fill={favorite ? "currentColor" : "none"} aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-6">
              <Button
                variant="outline"
                className="rounded-full px-8 py-2.5"
                loading={loading}
                loadingText="Loading…"
                onClick={() => void loadResults(filters, items.length, true)}
              >
                Load more {kind === "freelancer" ? "freelancers" : "projects"}
              </Button>
            </div>
          )}
    </div>
  );
}
