'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Clock,
  DollarSign,
  Users,
  MapPin,
  Zap,
} from 'lucide-react';

const projects = [
  {
    id: '1',
    title: 'Web3 Social Media Platform',
    employer: 'TechVentures Inc.',
    description: 'Build a decentralized social media platform with user-owned content and token-based governance.',
    budget: '$6,000 - $10,000',
    deadline: '60 days',
    skills: ['React', 'Solidity', 'Web3.js'],
    proposals: 12,
    isRush: false,
    posted: '1 day ago',
    location: 'Remote',
  },
  {
    id: '2',
    title: 'Crypto Trading Bot Development',
    employer: 'DeFi Solutions',
    description: 'Develop an automated trading bot for DEX arbitrage with risk management.',
    budget: '$4,000 - $7,000',
    deadline: '45 days',
    skills: ['Python', 'TypeScript', 'API'],
    proposals: 8,
    isRush: false,
    posted: '2 days ago',
    location: 'Remote',
  },
  {
    id: '3',
    title: 'DAO Governance Dashboard',
    employer: 'CommunityDAO',
    description: 'Create a comprehensive governance dashboard for DAO proposals and voting.',
    budget: '$5,000 - $8,000',
    deadline: '50 days',
    skills: ['React', 'Solidity', 'GraphQL'],
    proposals: 15,
    isRush: true,
    rushFee: 25,
    posted: '3 days ago',
    location: 'Remote',
  },
  {
    id: '4',
    title: 'NFT Marketplace with Auction',
    employer: 'ArtBlock Studio',
    description: 'Build an NFT marketplace supporting fixed-price and auction-style listings.',
    budget: '$8,000 - $12,000',
    deadline: '75 days',
    skills: ['Next.js', 'Solidity', 'IPFS'],
    proposals: 20,
    isRush: false,
    posted: '4 days ago',
    location: 'Remote',
  },
];

export default function ProjectsPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">Browse Projects</h1>
          <p className="text-muted-foreground">
            Find projects that match your skills and earn securely
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        {/* Results */}
        <p className="text-sm text-muted-foreground mb-6">
          Showing {projects.length} projects
        </p>

        {/* Projects List */}
        <div className="space-y-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{project.employer}</p>
                    </div>
                    {project.isRush && (
                      <Badge className="bg-amber-500/10 text-amber-500">
                        <Zap className="w-3 h-3 mr-1" /> Rush +{project.rushFee}%
                      </Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-4">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium text-primary">{project.budget}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {project.deadline}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {project.proposals} proposals
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {project.location}
                    </div>
                    <span>{project.posted}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
