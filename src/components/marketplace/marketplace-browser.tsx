"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { BookmarkPlus, Heart, Loader2, Search, Trash2, Sparkles, Briefcase } from 'lucide-react';
import { toast } from "sonner";
import Navbar from "@/components/layout/navbar";
import { FooterSection } from "@/components/layout/footer-section";
import { favoritesApi, freelancersApi, projectsApi, savedSearchesApi, skillsApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/auth-contract";
import {
  buildMarketplaceSearchParams,
  createSavedSearchFilters,
  marketplaceFiltersToSearchParams,
  restoreSavedSearchFilters,
  type MarketplaceFilters,
} from "@/lib/marketplace-search";
import { useAuthStore } from "@/stores/authStore";
import type { FreelancerProfile, Project, ProjectCategoryStat, SavedSearch, Skill } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MarketplaceKind = "project" | "freelancer";

type MarketplaceBrowserProps<T extends Project | FreelancerProfile> = {
  kind: MarketplaceKind;
  title: string;
  description: string;
  emptyMessage: string;
  layout: "list" | "grid";
  renderItem: (item: T, listingQuery: string) => ReactNode;
  getTargetId?: (item: T) => string;
  initialFilters?: MarketplaceFilters;
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

export function MarketplaceBrowser<T extends Project | FreelancerProfile>({
  kind,
  description,
  emptyMessage,
  layout,
  renderItem,
  getTargetId = (item) => item.id,
  initialFilters,
}: MarketplaceBrowserProps<T>) {
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
      try {
        const skillsResponse = await skillsApi.getTaxonomy();
        const allSkills = skillsResponse.data.categories.flatMap((category) => category.skills ?? []);
        setSkills(allSkills);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load skills."));
      }

      if (kind === "project") {
        try {
          const categoriesResponse = await projectsApi.getCategoryStats();
          setCategoryStats(categoriesResponse.data.categories ?? []);
        } catch (error) {
          toast.error(getApiErrorMessage(error, "Unable to load category stats."));
        }
      }

      if (user) {
        try {
          const searchesResponse = await savedSearchesApi.list(kind);
          setSavedSearches(searchesResponse.data);
        } catch (error) {
          toast.error(getApiErrorMessage(error, "Unable to load saved searches."));
        }

        try {
          const favoritesResponse = await favoritesApi.list(kind);
          setFavoriteIds(new Set(favoritesResponse.data.map((fav) => fav.targetId)));
        } catch (error) {
          toast.error(getApiErrorMessage(error, "Unable to load favorites."));
        }
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        {/* Sprout Hero Header */}
        <section className="mx-auto max-w-7xl px-6 lg:px-8 mb-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
            <Sparkles className="size-3.5 fill-primary" />
            <span>{kind === "project" ? "Verified Escrow Project Listings" : "Verified Web3 Freelancers & Engineers"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            {kind === "project" ? "Discover High-Impact Web3 Projects, " : "Hire Top Web3 & Smart Contract Talent, "}
            <br className="hidden sm:inline" />
            <span className="text-muted-foreground dark:text-muted-foreground font-semibold">
              secured by smart escrow.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        </section>

        <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
          {/* Popular Categories Strip (For Projects) */}
          {kind === "project" && categoryStats.length > 0 && (
            <section aria-labelledby="project-categories-heading">
              <h2 id="project-categories-heading" className="mb-3 text-sm font-bold text-foreground uppercase tracking-wider">
                Popular Categories
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {categoryStats.slice(0, 4).map((category) => (
                  <div
                    key={category.categoryId}
                    className="p-5 rounded-3xl bg-card border border-border/80 shadow-xs hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, keyword: category.categoryName }));
                      void loadResults({ ...filters, keyword: category.categoryName });
                    }}
                  >
                    <p className="font-bold text-foreground text-sm">{category.categoryName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {category.projectCount} open project{category.projectCount === 1 ? "" : "s"}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-primary">
                      ${category.totalBudget.toLocaleString()} total budget
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Search & Filter Card */}
          <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5">
            <form className="space-y-6" onSubmit={submitSearch}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={filters.keyword}
                    onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                    placeholder={`Search by title, description, or keyword...`}
                    className="pl-11 pr-4 py-2.5 rounded-full bg-background border-border/80 text-sm focus-visible:ring-primary/40"
                  />
                </div>
              </div>

              {/* Skill selector */}
              <div className="space-y-1.5">
                <Label htmlFor="skill-select" className="text-xs font-bold text-foreground">Skill</Label>
                <select
                  id="skill-select"
                  aria-label="Skill"
                  value={filters.skillIds[0] ?? ""}
                  onChange={(event) => {
                    const val = event.target.value;
                    setFilters((current) => ({ ...current, skillIds: val ? [val] : [] }));
                  }}
                  className="w-full rounded-xl bg-background border border-border/80 text-sm px-3 py-2"
                >
                  <option value="">All skills</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget Range (for Projects) */}
              {kind === "project" && (
                <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/50">
                  <div className="space-y-1.5">
                    <Label htmlFor="minimum-budget" className="text-xs font-bold text-foreground">Minimum budget</Label>
                    <Input
                      id="minimum-budget"
                      type="number"
                      min="0"
                      value={filters.minBudget ?? ""}
                      onChange={(event) => setFilters((current) => updateBudget(current, "minBudget", event.target.value))}
                      placeholder="e.g. 500"
                      className="rounded-xl bg-background border-border/80 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="maximum-budget" className="text-xs font-bold text-foreground">Maximum budget</Label>
                    <Input
                      id="maximum-budget"
                      type="number"
                      min="0"
                      value={filters.maxBudget ?? ""}
                      onChange={(event) => setFilters((current) => updateBudget(current, "maxBudget", event.target.value))}
                      placeholder="e.g. 5000"
                      className="rounded-xl bg-background border-border/80 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-6 shadow-xs cursor-pointer">
                  Apply filters
                </Button>
                <Button type="button" variant="outline" className="rounded-full text-xs font-bold cursor-pointer" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </form>
          </div>

          {/* Saved Searches (if authenticated) */}
          {user && (
            <div className="rounded-3xl bg-card border border-border/80 p-6 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-2">
                <form className="space-y-3" onSubmit={saveSearch}>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">Save Current Filter Preset</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Quickly return to this search criteria or receive match alerts.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="saved-search-name" className="sr-only">Search name</Label>
                      <Input
                        id="saved-search-name"
                        value={savedSearchName}
                        onChange={(event) => setSavedSearchName(event.target.value)}
                        placeholder="e.g. React & Solidity Gigs"
                        className="rounded-full bg-background border-border/80 text-xs"
                      />
                    </div>
                    <Button size="sm" className="rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0" type="submit" disabled={savingSearch}>
                      <BookmarkPlus className="mr-1.5 size-3.5" />{savingSearch ? "Saving…" : "Save search"}
                    </Button>
                  </div>
                </form>

                <div>
                  <h3 className="font-bold text-foreground text-sm">Your Saved Presets</h3>
                  {savedSearches.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">No saved searches yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {savedSearches.map((savedSearch) => (
                        <li key={savedSearch.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3 py-1.5">
                          <Button type="button" variant="ghost" size="sm" className="h-auto justify-start p-0 text-xs font-semibold" onClick={() => void runSavedSearch(savedSearch)}>
                            {savedSearch.name}
                          </Button>
                          <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => void deleteSavedSearch(savedSearch.id)}>
                            <Trash2 className="size-3 text-destructive" />
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
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider pt-2">
            <span>Showing {items.length} {kind}s</span>
          </div>

          {/* Items Grid / List */}
          {loading && items.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center rounded-3xl bg-card border border-border/80 p-8">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-card border border-border/80 p-8 text-muted-foreground">
              <Briefcase className="size-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">{emptyMessage}</p>
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
                        className="absolute right-4 top-4 z-10 rounded-full h-8 w-8 bg-card/90 backdrop-blur-xs border border-border/80 shadow-xs hover:scale-110 transition-transform"
                        aria-label={favorite ? `Remove ${kind} from favorites` : `Save ${kind} to favorites`}
                        disabled={favoriteActionId === targetId}
                        onClick={() => void toggleFavorite(targetId)}
                      >
                        <Heart className="size-3.5" fill={favorite ? "#ef4444" : "none"} color={favorite ? "#ef4444" : "currentColor"} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                className="rounded-full text-xs font-bold px-8 shadow-xs"
                disabled={loading}
                onClick={() => void loadResults(filters, items.length, true)}
              >
                {loading ? "Loading…" : "Load More"}
              </Button>
            </div>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
