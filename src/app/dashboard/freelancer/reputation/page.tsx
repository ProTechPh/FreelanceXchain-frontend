'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Star,
  TrendingUp,
  Award,
  ExternalLink,
  CheckCircle,
  Users,
  BarChart3,
} from 'lucide-react';

const reputationData = {
  overallScore: 4.8,
  totalRatings: 24,
  onChainVerified: true,
  breakdown: {
    5: 18,
    4: 4,
    3: 1,
    2: 1,
    1: 0,
  },
  categories: {
    workQuality: 4.9,
    communication: 4.7,
    professionalism: 4.8,
    timeliness: 4.6,
  },
};

const reviews = [
  {
    id: '1',
    reviewer: 'TechCorp Inc.',
    rating: 5,
    comment: 'Excellent work on the e-commerce platform. Alex delivered high-quality code ahead of schedule. Highly recommended!',
    project: 'E-commerce Platform Redesign',
    date: 'Dec 1, 2024',
    onChain: true,
  },
  {
    id: '2',
    reviewer: 'DeFi Protocol',
    rating: 5,
    comment: 'Thorough smart contract audit with detailed report. Found vulnerabilities we missed. Great attention to detail.',
    project: 'Smart Contract Audit',
    date: 'Nov 20, 2024',
    onChain: true,
  },
  {
    id: '3',
    reviewer: 'StartupXYZ',
    rating: 4,
    comment: 'Good mobile app development. Communication was great, though there were minor delays in the final phase.',
    project: 'Mobile App Development',
    date: 'Nov 15, 2024',
    onChain: true,
  },
];

export default function ReputationPage() {
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
                <span className="text-3xl font-bold text-white">{reputationData.overallScore}</span>
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(reputationData.overallScore)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-500'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{reputationData.totalRatings} reviews</p>
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
                          width: `${(reputationData.breakdown[stars as keyof typeof reputationData.breakdown] / reputationData.totalRatings) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {reputationData.breakdown[stars as keyof typeof reputationData.breakdown]}
                    </span>
                  </div>
                ))}
              </div>

              {/* On-chain badge */}
              {reputationData.onChainVerified && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-500">
                    On-Chain Verified Reputation
                  </span>
                </div>
              )}
            </div>

            {/* Category Scores */}
            <div className="space-y-3">
              {Object.entries(reputationData.categories).map(([category, score]) => (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-32 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">4.8</p>
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
                <p className="text-2xl font-bold">24</p>
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
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Projects Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold">Top 5%</p>
                <p className="text-xs text-muted-foreground">Platform Rank</p>
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
        <CardContent className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-xl bg-secondary/50 border border-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">{review.reviewer}</p>
                  <p className="text-sm text-muted-foreground">{review.project}</p>
                </div>
                <div className="flex items-center gap-2">
                  {review.onChain && (
                    <Badge className="bg-green-500/10 text-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" /> On-Chain
                    </Badge>
                  )}
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
              </div>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
              <p className="text-xs text-muted-foreground mt-2">{review.date}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
