'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reputationApi, reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { Review } from '@/types';
import {
  Star,
  TrendingUp,
  Users,
  Loader2,
  MessageSquareOff,
} from 'lucide-react';

export function ReputationOverview() {
  const { user } = useAuthStore();
  const [overallScore, setOverallScore] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [completedContracts, setCompletedContracts] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [repRes, reviewsRes] = await Promise.all([
          reputationApi.getScore(userId),
          reviewsApi.getForUser(userId),
        ]);
        if (cancelled) return;
        setOverallScore(repRes.data.averageRating || 0);
        setTotalRatings(repRes.data.totalRatings || 0);
        setCompletedContracts(repRes.data.completedContracts || 0);
        setReviews(reviewsRes.data);
      } catch {
        // Reputation might not exist yet for new users
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) {
    const stars = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
    if (stars >= 1 && stars <= 5) breakdown[stars] += 1;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div>
          <h1 className="text-2xl font-bold">Reputation</h1>
          <p className="text-muted-foreground">Your on-chain reputation and reviews</p>
        </div>
      </div>

      {/* Score Card */}
      <Card className="bg-card border-border overflow-hidden relative">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{overallScore.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(overallScore)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-500'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{totalRatings} reviews</p>
            </div>

            <div className="flex-1 space-y-4">
              {/* Breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm w-4">{stars}</span>
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{
                          width: totalRatings > 0 ? `${(breakdown[stars as keyof typeof breakdown] / totalRatings) * 100}%` : '0%',
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {breakdown[stars as keyof typeof breakdown]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Overall Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRatings}</p>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedContracts}</p>
                <p className="text-xs text-muted-foreground">Completed Contracts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <MessageSquareOff className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 rounded-xl bg-secondary/50 border border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">Review</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function FreelancerReputationPage() {
  return <ReputationOverview />;
}
