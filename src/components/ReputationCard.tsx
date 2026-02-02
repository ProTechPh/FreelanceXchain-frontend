import { useEffect, useState } from 'react';
import { Star, TrendingUp, Award, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { api } from '../lib/api';
import type { UserReputation, Rating } from '../types';

interface ReputationCardProps {
  userId: string;
  showReviews?: boolean;
  maxReviews?: number;
  className?: string;
}

export function ReputationCard({
  userId,
  showReviews = true,
  maxReviews = 5,
  className,
}: ReputationCardProps) {
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReputation();
  }, [userId]);

  const loadReputation = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getUserReputation(userId);
      setReputation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reputation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={clsx('glass-card p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="h-20 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('glass-card p-6', className)}>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!reputation) {
    return (
      <div className={clsx('glass-card p-6', className)}>
        <p className="text-gray-400 text-sm">No reputation data available</p>
      </div>
    );
  }

  const displayedReviews = showReviews
    ? reputation.ratings.slice(0, maxReviews)
    : [];

  return (
    <div className={clsx('glass-card p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-primary-400" />
          Reputation
        </h3>
      </div>

      {/* Reputation Score & Rating */}
      <div className="grid grid-cols-2 gap-4">
        {/* Reputation Score */}
        <div className="p-4 bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-primary-400 text-sm font-medium mb-1">
            <TrendingUp className="w-4 h-4" />
            Score
          </div>
          <div className="text-3xl font-bold text-white">
            {reputation.score.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Blockchain verified
          </div>
        </div>

        {/* Average Rating */}
        <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-1">
            <Star className="w-4 h-4" />
            Rating
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-white">
              {reputation.averageRating.toFixed(1)}
            </span>
            <span className="text-gray-400 text-sm">/ 5</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {reputation.totalRatings} {reputation.totalRatings === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      </div>

      {/* Star Rating Visualization */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={clsx(
              'w-5 h-5',
              star <= Math.round(reputation.averageRating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-600'
            )}
          />
        ))}
        <span className="ml-2 text-sm text-gray-400">
          ({reputation.totalRatings})
        </span>
      </div>

      {/* Reviews */}
      {showReviews && displayedReviews.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Recent Reviews
          </h4>
          <div className="space-y-3">
            {displayedReviews.map((rating) => (
              <ReviewItem key={rating.id} rating={rating} />
            ))}
          </div>
          {reputation.ratings.length > maxReviews && (
            <button
              onClick={() => {/* TODO: Show all reviews modal */}}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              View all {reputation.ratings.length} reviews
            </button>
          )}
        </div>
      )}

      {/* No Reviews Message */}
      {showReviews && reputation.totalRatings === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm">
          No reviews yet
        </div>
      )}
    </div>
  );
}

function ReviewItem({ rating }: { rating: Rating }) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={clsx(
                'w-4 h-4',
                star <= rating.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600'
              )}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {new Date(rating.createdAt).toLocaleDateString()}
        </span>
      </div>
      {rating.comment && (
        <p className="text-sm text-gray-300 leading-relaxed">
          {rating.comment}
        </p>
      )}
      <div className="text-xs text-gray-500">
        From: Anonymous
      </div>
    </div>
  );
}
