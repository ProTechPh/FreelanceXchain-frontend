'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { favoritesApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';

export function FavoriteButton({
  targetType,
  targetId,
}: {
  targetType: 'project' | 'freelancer';
  targetId: string;
}) {
  const user = useAuthStore((state) => state.user);
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !targetId) return;
    favoritesApi.check(targetType, targetId)
      .then(({ data }) => setFavorite(data.isFavorited))
      .catch(() => setFavorite(false));
  }, [targetId, targetType, user]);

  if (!user) {
    return <Button asChild variant="outline"><Link href="/login"><Heart className="mr-2 size-4" />Sign in to save</Link></Button>;
  }

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={favorite}
      disabled={loading}
      onClick={async () => {
        const previous = favorite;
        setFavorite(!previous);
        setLoading(true);
        try {
          if (previous) await favoritesApi.remove(targetType, targetId);
          else await favoritesApi.add(targetType, targetId);
          toast.success(previous ? 'Removed from favorites.' : 'Saved to favorites.');
        } catch (error) {
          setFavorite(previous);
          toast.error(getApiErrorMessage(error, 'Unable to update favorites.'));
        } finally {
          setLoading(false);
        }
      }}
    >
      <Heart className="mr-2 size-4" fill={favorite ? 'currentColor' : 'none'} />
      {favorite ? 'Saved' : 'Save'}
    </Button>
  );
}
