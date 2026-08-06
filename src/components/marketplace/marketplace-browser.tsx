'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bell, BookmarkPlus, Heart, Loader2, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { favoritesApi, freelancersApi, projectsApi, savedSearchesApi, skillsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import {
  buildMarketplaceSearchParams,
  createSavedSearchFilters,
  marketplaceFiltersToSearchParams,
  restoreSavedSearchFilters,
  type MarketplaceFilters,
} from '@/lib/marketplace-search';
import { useAuthStore } from '@/stores/authStore';
import type { FreelancerProfile, Project, SavedSearch, Skill } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type MarketplaceKind = 'project' | 'freelancer';

type MarketplaceBrowserProps<T extends Project | FreelancerProfile> = {
  kind: MarketplaceKind;
  title: string;
  description: string;
  emptyMessage: string;
  layout: 'list' | 'grid';
  renderItem: (item: T) => ReactNode;
  getTargetId?: (item: T) => string;
  initialFilters?: MarketplaceFilters;
};

function createInitialFilters(filters?: MarketplaceFilters): MarketplaceFilters {
  return filters ? { ...filters, skillIds: [...filters.skillIds] } : { keyword: '', skillIds: [] };
}

function updateBudget(
  filters: MarketplaceFilters,
  field: 'minBudget' | 'maxBudget',
  value: string,
): MarketplaceFilters {
  const next = { ...filters };
  if (value === '') delete next[field];
  else next[field] = Number(value);
  return next;
}

export function MarketplaceBrowser<T extends Project | FreelancerProfile>({
  kind,
  title,
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
  const [skills, setSkills] = useState<Skill[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteActionId, setFavoriteActionId] = useState<string | null>(null);
  const [savedSearchName, setSavedSearchName] = useState('');
  const [notifyOnNew, setNotifyOnNew] = useState(true);
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
      toast.error('Minimum budget cannot exceed maximum budget.');
      return;
    }

    setLoading(true);
    try {
      const params = buildMarketplaceSearchParams(nextFilters, offset);
      const response = kind === 'project'
        ? await projectsApi.search(params)
        : await freelancersApi.search(params);
      const nextItems = response.data.items as T[];
      setItems((current) => append ? [...current, ...nextItems] : nextItems);
      setHasMore(response.data.metadata.hasMore);
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Unable to search ${kind}s.`));
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    // Initial marketplace results come from the server search contract.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadResults(createInitialFilters(initialFilters));
  }, [initialFilters, loadResults]);

  useEffect(() => {
    skillsApi.getTaxonomy()
      .then(({ data }) => setSkills(data.categories.flatMap((category) => category.skills)))
      .catch(() => setSkills([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      favoritesApi.list(kind),
      savedSearchesApi.list(kind),
    ]).then(([favoriteResponse, savedResponse]) => {
      setFavoriteIds(new Set(favoriteResponse.data.map((favorite) => favorite.targetId)));
      setSavedSearches(savedResponse.data);
    }).catch(() => toast.error('Unable to load your saved marketplace items.'));
  }, [kind, user]);

  const selectedSkill = filters.skillIds[0] ?? '';
  const savedSkillOptions = useMemo(
    () => skills.map((skill) => ({ id: skill.id, name: skill.name })),
    [skills],
  );

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchParams = marketplaceFiltersToSearchParams(filters);
    const query = searchParams.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    void loadResults(filters);
  };

  const toggleFavorite = async (targetId: string) => {
    const wasFavorite = favoriteIds.has(targetId);
    setFavoriteActionId(targetId);
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (wasFavorite) next.delete(targetId);
      else next.add(targetId);
      return next;
    });

    try {
      if (wasFavorite) await favoritesApi.remove(kind, targetId);
      else await favoritesApi.add(kind, targetId);
      toast.success(wasFavorite ? 'Removed from favorites.' : 'Saved to favorites.');
    } catch (error) {
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (wasFavorite) next.add(targetId);
        else next.delete(targetId);
        return next;
      });
      toast.error(getApiErrorMessage(error, 'Unable to update favorites.'));
    } finally {
      setFavoriteActionId(null);
    }
  };

  const saveSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = savedSearchName.trim();
    if (!name) {
      toast.error('Enter a name for this search.');
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
      setSavedSearchName('');
      toast.success('Search saved.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save this search.'));
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
      setHasMore(false);
      const searchParams = marketplaceFiltersToSearchParams(restored);
      const query = searchParams.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
      toast.success(`Saved search executed: ${data.count} result${data.count === 1 ? '' : 's'}.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to execute this saved search.'));
    } finally {
      setLoading(false);
    }
  };

  const deleteSavedSearch = async (id: string) => {
    try {
      await savedSearchesApi.remove(id);
      setSavedSearches((current) => current.filter((savedSearch) => savedSearch.id !== id));
      toast.success('Saved search deleted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete this saved search.'));
    }
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <Card>
          <CardContent className="p-5">
            <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]" onSubmit={submitSearch}>
              <div className="space-y-2">
                <Label htmlFor={`${kind}-keyword`}>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id={`${kind}-keyword`}
                    className="pl-10"
                    placeholder={kind === 'project' ? 'Title or description' : 'Bio or specialty'}
                    value={filters.keyword}
                    onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${kind}-skill`}>Skill</Label>
                <select
                  id={`${kind}-skill`}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={selectedSkill}
                  onChange={(event) => setFilters((current) => ({
                    ...current,
                    skillIds: event.target.value ? [event.target.value] : [],
                  }))}
                >
                  <option value="">All skills</option>
                  {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
                </select>
              </div>
              <Button className="self-end" type="submit">
                <SlidersHorizontal className="mr-2 size-4" aria-hidden="true" />Apply filters
              </Button>

              {kind === 'project' && (
                <div className="grid grid-cols-2 gap-3 lg:col-span-2">
                  <div className="space-y-2">
                    <Label htmlFor="minimum-budget">Minimum budget</Label>
                    <Input id="minimum-budget" type="number" min="0" value={filters.minBudget ?? ''} onChange={(event) => setFilters((current) => updateBudget(current, 'minBudget', event.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maximum-budget">Maximum budget</Label>
                    <Input id="maximum-budget" type="number" min="0" value={filters.maxBudget ?? ''} onChange={(event) => setFilters((current) => updateBudget(current, 'maxBudget', event.target.value))} />
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {user && (
          <Card>
            <CardContent className="grid gap-5 p-5 lg:grid-cols-2">
              <form className="space-y-3" onSubmit={saveSearch}>
                <div>
                  <h2 className="font-semibold">Save these filters</h2>
                  <p className="text-sm text-muted-foreground">Return to this search and optionally get new-match alerts.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`${kind}-saved-name`}>Search name</Label>
                    <Input id={`${kind}-saved-name`} value={savedSearchName} onChange={(event) => setSavedSearchName(event.target.value)} placeholder="e.g. React projects" />
                  </div>
                  <Button className="self-end" type="submit" disabled={savingSearch}>
                    <BookmarkPlus className="mr-2 size-4" aria-hidden="true" />{savingSearch ? 'Saving…' : 'Save search'}
                  </Button>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={notifyOnNew} onChange={(event) => setNotifyOnNew(event.target.checked)} />
                  <Bell className="size-4" aria-hidden="true" />Notify me about new matches
                </label>
              </form>

              <div>
                <h2 className="font-semibold">Saved searches</h2>
                {savedSearches.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">No saved searches yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {savedSearches.map((savedSearch) => (
                      <li key={savedSearch.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-2">
                        <Button type="button" variant="ghost" className="h-auto justify-start px-2" onClick={() => void runSavedSearch(savedSearch)}>{savedSearch.name}</Button>
                        <Button type="button" size="icon" variant="ghost" aria-label={`Delete saved search ${savedSearch.name}`} onClick={() => void deleteSavedSearch(savedSearch.id)}><Trash2 className="size-4" /></Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-sm text-muted-foreground">Showing {items.length} {kind}s</p>

        {loading && items.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center" role="status" aria-label={`Loading ${kind}s`}><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-14 text-center text-muted-foreground">{emptyMessage}</CardContent></Card>
        ) : (
          <div className={layout === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {items.map((item) => {
              const targetId = getTargetId(item);
              const favorite = favoriteIds.has(targetId);
              return (
                <div key={targetId} className="relative">
                  {renderItem(item)}
                  {user && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-4 top-4 z-10 rounded-full"
                      aria-label={favorite ? `Remove ${kind} from favorites` : `Save ${kind} to favorites`}
                      aria-pressed={favorite}
                      disabled={favoriteActionId === targetId}
                      onClick={() => void toggleFavorite(targetId)}
                    >
                      <Heart className="size-4" fill={favorite ? 'currentColor' : 'none'} />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="text-center">
            <Button variant="outline" disabled={loading} onClick={() => void loadResults(filters, items.length, true)}>{loading ? 'Loading…' : 'Load more'}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
