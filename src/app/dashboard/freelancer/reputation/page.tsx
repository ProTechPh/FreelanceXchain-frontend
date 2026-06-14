'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { reputationApi, reviewsApi } from '@/lib/api';
import type { ReputationScore, Review } from '@/types';
import { toast } from 'sonner';
import {
  Star,
  TrendingUp,
  Award,
  ExternalLink,
  CheckCircle,
  Users,
  Loader2,
} from 'lucide-react';

export default function ReputationPage() {
  const [reputation, setReputation] = useState<ReputationScore | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repRes, revRes] = await Promise.all([
          reputationApi.getScore('me'),
          reviewsApi.submit({}) // This is a placeholder - in real app would fetch user's reviews
        ]);
        setReputation(repRes.data.data);
      } catch {
        // Reputation might not exist yet for new users
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const overallScore = reputation?.overall_score || 0;
  const totalRatings = reputation?.total_ratings || 0;
  const breakdown = reputation?.breakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reputation</h1>
          <p className="text-muted-foreground">Your on-chain reputation and reviews</p>
        </div>
        <Button variant="outline">
          <ExternalLink className="w-4 h-4 mr-2" /> View on Blockchain
        </Button>
      </div>

      {/* Score Card */}
      <Card className="bg-card border-border overflow-hidden">
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

              {/* On-chain badge */}
              {reputation?.on_chain_verified && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-500">
                    On-Chain Verified Reputation
                  </span>
                </div>
              )}
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
                <p className="text-2xl font-bold">{reputation?.on_chain_verified ? 'Verified' : 'Pending'}</p>
                <p className="text-xs text-muted-foreground">On-Chain Status</p>
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
            <p className="text-center text-muted-foreground py-8">No reviews yet</p>
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
                            star <= review.overall_rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
