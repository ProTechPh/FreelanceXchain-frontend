'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, ExternalLink, Heart, Play, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { favoritesApi, savedSearchesApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { marketplaceFiltersToSearchParams, restoreSavedSearchFilters } from '@/lib/marketplace-search';
import type { Favorite, SavedSearch } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/stores/authStore';

type SavedSearchDraft = { name: string; notifyOnNew: boolean };

function ensureArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj['data'])) return obj['data'] as T[];
  if (Array.isArray(obj['favorites'])) return obj['favorites'] as T[];
  if (Array.isArray(obj['searches'])) return obj['searches'] as T[];
  return Object.values(obj).filter((item): item is T => Boolean(item && typeof item === 'object' && 'id' in item));
}

function favoriteLabel(favorite: Favorite): string {
  const target = favorite.target;
  if (target && typeof target === 'object') {
    const record = target as Record<string, unknown>;
    if (typeof record.title === 'string') return record.title;
    if (typeof record.name === 'string') return record.name;
  }
  return `${favorite.targetType === 'project' ? 'Project' : 'Freelancer'} ${favorite.targetId.slice(0, 8)}`;
}

function savedSearchHref(search: SavedSearch): string {
  const filters = restoreSavedSearchFilters(search.filters, []);
  const query = marketplaceFiltersToSearchParams(filters).toString();
  const pathname = search.searchType === 'project' ? '/projects' : '/freelancers';
  return `${pathname}${query ? `?${query}` : ''}`;
}

export function SavedMarketplace() {
  const user = useAuthStore((state) => state.user);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [drafts, setDrafts] = useState<Record<string, SavedSearchDraft>>({});
  const [resultCounts, setResultCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [favoriteResponse, searchResponse] = await Promise.all([
        favoritesApi.list().catch(() => ({ data: [] })),
        savedSearchesApi.list().catch(() => ({ data: [] })),
      ]);
      const favoriteList = ensureArray<Favorite>(favoriteResponse.data);
      const searchList = ensureArray<SavedSearch>(searchResponse.data);
      setFavorites(favoriteList);
      setSearches(searchList);
      setDrafts(Object.fromEntries(searchList.map((search) => [search.id, { name: search.name, notifyOnNew: search.notifyOnNew }])));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load saved marketplace items.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const updateSearch = async (search: SavedSearch) => {
    const draft = drafts[search.id];
    if (!draft?.name.trim()) return toast.error('Saved search name is required.');
    setActionId(search.id);
    try {
      const { data } = await savedSearchesApi.update(search.id, { name: draft.name.trim(), notifyOnNew: draft.notifyOnNew });
      setSearches((current) => current.map((item) => item.id === search.id ? data : item));
      toast.success('Saved search updated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update this saved search.'));
    } finally {
      setActionId(null);
    }
  };

  const executeSearch = async (search: SavedSearch) => {
    setActionId(search.id);
    try {
      const { data } = await savedSearchesApi.execute(search.id);
      setResultCounts((current) => ({ ...current, [search.id]: data.count }));
      toast.success('Saved search executed.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to execute this saved search.'));
    } finally {
      setActionId(null);
    }
  };

  const removeSearch = async (search: SavedSearch) => {
    if (!window.confirm(`Delete the saved search “${search.name}”?`)) return;
    setActionId(search.id);
    try {
      await savedSearchesApi.remove(search.id);
      setSearches((current) => current.filter((item) => item.id !== search.id));
      toast.success('Saved search deleted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete this saved search.'));
    } finally {
      setActionId(null);
    }
  };

  const removeFavorite = async (favorite: Favorite) => {
    setActionId(favorite.id);
    try {
      await favoritesApi.remove(favorite.targetType, favorite.targetId);
      setFavorites((current) => current.filter((item) => item.id !== favorite.id));
      toast.success('Favorite removed.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to remove this favorite.'));
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <ListSkeleton rows={3} label="Loading saved items" />;

  const safeFavorites = ensureArray<Favorite>(favorites);
  const safeSearches = ensureArray<SavedSearch>(searches);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Bookmark className="size-6" />Saved marketplace</h1><p className="text-muted-foreground">Manage favorite projects and freelancers, reusable filters, and new-match alerts.</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Heart className="size-5 text-primary" />Favorites</CardTitle></CardHeader><CardContent>{safeFavorites.length === 0 ? <p className="text-sm text-muted-foreground">No marketplace favorites yet.</p> : <ul className="space-y-3">{safeFavorites.map((favorite) => {
          const favoriteHref = favorite.targetType === 'project'
            ? user?.role === 'freelancer'
              ? `/dashboard/freelancer/projects/${favorite.targetId}`
              : user?.role === 'employer'
                ? `/dashboard/employer/projects/${favorite.targetId}`
                : `/projects/${favorite.targetId}`
            : `/freelancers/${favorite.targetId}`;
          return <li key={favorite.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"><div className="min-w-0"><p className="truncate font-medium">{favoriteLabel(favorite)}</p><Badge variant="secondary" className="mt-1">{favorite.targetType}</Badge></div><div className="flex gap-1"><Button asChild type="button" variant="ghost" size="icon"><Link href={favoriteHref} aria-label={`Open ${favoriteLabel(favorite)}`}><ExternalLink className="size-4" /></Link></Button><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${favoriteLabel(favorite)} from favorites`} disabled={actionId === favorite.id} onClick={() => void removeFavorite(favorite)}><Trash2 className="size-4 text-destructive" /></Button></div></li>;
        })}</ul>}</CardContent></Card>

        <div className="space-y-4">
          {safeSearches.length === 0 ? <EmptyState
              icon={Bookmark}
              title="No saved searches yet"
              description="Save a set of filters while browsing and it will appear here, ready to re-run or turn into match alerts."
              action={<Button asChild><Link href="/projects">Browse projects</Link></Button>}
            /> : safeSearches.map((search) => {
            const draft = drafts[search.id] ?? { name: search.name, notifyOnNew: search.notifyOnNew };
            const resultCount = resultCounts[search.id];
            return <Card key={search.id}><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>{search.name}</CardTitle><Badge variant="secondary">{search.searchType}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor={`saved-name-${search.id}`}>Name for {search.name}</Label><Input id={`saved-name-${search.id}`} value={draft.name} onChange={(event) => setDrafts((current) => ({ ...current, [search.id]: { ...draft, name: event.target.value } }))} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.notifyOnNew} onChange={(event) => setDrafts((current) => ({ ...current, [search.id]: { ...draft, notifyOnNew: event.target.checked } }))} />Notify me about new matches</label><div className="flex flex-wrap gap-2"><Button type="button" size="sm" disabled={actionId === search.id} onClick={() => void updateSearch(search)}><Save className="mr-2 size-4" />Save changes</Button><Button type="button" size="sm" variant="outline" disabled={actionId === search.id} onClick={() => void executeSearch(search)}><Play className="mr-2 size-4" />Run search</Button><Button asChild type="button" size="sm" variant="ghost"><Link href={savedSearchHref(search)}>View filters</Link></Button><Button type="button" size="sm" variant="ghost" className="text-destructive" disabled={actionId === search.id} onClick={() => void removeSearch(search)}>Delete</Button></div>{resultCount !== undefined && <p role="status" className="text-sm text-muted-foreground">Latest run: {resultCount} match{resultCount === 1 ? '' : 'es'}.</p>}</CardContent></Card>;
          })}
        </div>
      </div>
    </div>
  );
}
