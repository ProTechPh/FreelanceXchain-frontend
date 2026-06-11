'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  DollarSign,
  Users,
  MapPin,
  Zap,
  Calendar,
  Target,
  CheckCircle,
  ExternalLink,
  Send,
  Heart,
  Share2,
} from 'lucide-react';

export default function ProjectDetailPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Web3 Social Media Platform</h1>
                <Badge className="bg-green-500/10 text-green-500">Open</Badge>
              </div>
              <p className="text-muted-foreground">Posted by TechVentures Inc. • 1 day ago</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Heart className="w-4 h-4 mr-2" /> Save
              </Button>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
              <Button className="gradient-primary text-white">
                <Send className="w-4 h-4 mr-2" /> Submit Proposal
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <p>
                  We are looking for an experienced blockchain developer to build a decentralized social media platform 
                  that gives users full ownership of their content and data.
                </p>
                <h3>Key Features:</h3>
                <ul>
                  <li>User-owned content with IPFS storage</li>
                  <li>Token-based governance for platform decisions</li>
                  <li>NFT profile pictures and badges</li>
                  <li>End-to-end encrypted messaging</li>
                  <li>Content monetization through tips and subscriptions</li>
                </ul>
                <h3>Technical Requirements:</h3>
                <ul>
                  <li>React/Next.js frontend</li>
                  <li>Solidity smart contracts on Polygon</li>
                  <li>IPFS for decentralized storage</li>
                  <li>GraphQL API layer</li>
                  <li>Web3.js for wallet integration</li>
                </ul>
                <p>
                  The ideal candidate has experience building Web3 applications and understands 
                  the nuances of decentralized architecture. Must have a strong portfolio of 
                  similar projects.
                </p>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" /> Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: 'UI/UX Design & Wireframes', amount: '$1,500', duration: '10 days' },
                  { title: 'Smart Contract Development', amount: '$2,500', duration: '15 days' },
                  { title: 'Frontend Implementation', amount: '$3,000', duration: '20 days' },
                  { title: 'Testing & Deployment', amount: '$1,000', duration: '10 days' },
                ].map((milestone, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium">{milestone.title}</p>
                        <p className="text-sm text-muted-foreground">{milestone.duration}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-primary">{milestone.amount}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Skills Required */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Skills Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['React', 'Solidity', 'Web3.js', 'IPFS', 'GraphQL', 'TypeScript', 'Node.js'].map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-sm py-1.5 px-3">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-semibold text-primary text-lg">$8,000 - $12,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-semibold">60 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Proposals</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span>Remote</span>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Posted 1 day ago
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employer Info */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>About Employer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                    TV
                  </div>
                  <div>
                    <p className="font-semibold">TechVentures Inc.</p>
                    <p className="text-sm text-muted-foreground">Member since 2023</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Projects Posted</span>
                    <span>8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Spent</span>
                    <span>$45,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hire Rate</span>
                    <span>85%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Projects */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Similar Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: 'NFT Marketplace', budget: '$5,000 - $8,000' },
                  { title: 'DeFi Dashboard', budget: '$3,000 - $5,000' },
                  { title: 'DAO Governance', budget: '$4,000 - $7,000' },
                ].map((project, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:border-primary/20 transition-all"
                  >
                    <p className="font-medium text-sm">{project.title}</p>
                    <p className="text-xs text-primary">{project.budget}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
