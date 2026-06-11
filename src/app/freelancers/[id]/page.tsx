'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Star,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Globe,
  CheckCircle,
  ExternalLink,
  Send,
} from 'lucide-react';

export default function FreelancerProfilePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-2xl">
              AT
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Alex Thompson</h1>
                <Badge className="bg-green-500/10 text-green-500">
                  <Clock className="w-3 h-3 mr-1" /> Available
                </Badge>
                <Badge className="bg-green-500/10 text-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" /> KYC Verified
                </Badge>
              </div>
              <p className="text-muted-foreground mb-3">Full-Stack Blockchain Developer</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> United States
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 4.8 (24 reviews)
                </span>
                <span className="font-semibold text-primary text-lg">$85/hr</span>
              </div>
            </div>
            <Button className="gradient-primary text-white">
              <Send className="w-4 h-4 mr-2" /> Contact
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Full-stack blockchain developer with 5+ years of experience in DeFi, NFTs, and Web3 applications. 
                  Passionate about building decentralized solutions that make a real impact. 
                  Specialized in React, Solidity, and Node.js with a strong focus on security and performance.
                </p>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['React', 'Solidity', 'TypeScript', 'Node.js', 'Web3.js', 'GraphQL', 'PostgreSQL', 'Docker'].map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-sm py-1.5 px-3">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: 'DeFi Dashboard', skills: ['React', 'Web3.js'] },
                    { title: 'NFT Marketplace', skills: ['Next.js', 'Solidity'] },
                    { title: 'DAO Governance', skills: ['React', 'GraphQL'] },
                    { title: 'Crypto Wallet', skills: ['TypeScript', 'Web3.js'] },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-cyan/20 flex items-center justify-center cursor-pointer hover:border-primary/50 border-2 border-transparent transition-all"
                    >
                      <div className="text-center">
                        <p className="font-medium">{item.title}</p>
                        <div className="flex gap-1 mt-2 justify-center">
                          {item.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    reviewer: 'TechCorp Inc.',
                    rating: 5,
                    comment: 'Excellent work on the e-commerce platform. Highly recommended!',
                    project: 'E-commerce Platform Redesign',
                    date: 'Dec 1, 2024',
                  },
                  {
                    reviewer: 'DeFi Protocol',
                    rating: 5,
                    comment: 'Thorough smart contract audit with detailed report. Great attention to detail.',
                    project: 'Smart Contract Audit',
                    date: 'Nov 20, 2024',
                  },
                ].map((review, i) => (
                  <div key={i} className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{review.reviewer}</p>
                        <p className="text-sm text-muted-foreground">{review.project}</p>
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
                    <p className="text-xs text-muted-foreground mt-2">{review.date}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Projects Completed</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Earned</span>
                  <span className="font-semibold">$45,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">On-Chain Score</span>
                  <span className="font-semibold text-primary">4.8/5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-semibold">Jan 2024</span>
                </div>
              </CardContent>
            </Card>

            {/* On-Chain Reputation */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" /> On-Chain Reputation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-500 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Verified on Blockchain</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All ratings and reviews are verified on-chain and cannot be tampered with.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <ExternalLink className="w-4 h-4 mr-2" /> View on Polygonscan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold">$85/hr</p>
                    <p className="text-xs text-muted-foreground">Hourly Rate</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">12 Projects</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
