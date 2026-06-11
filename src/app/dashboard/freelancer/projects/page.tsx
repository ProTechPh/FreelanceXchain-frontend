'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Clock,
  DollarSign,
  Users,
  Bookmark,
  MapPin,
  Zap,
} from 'lucide-react';

const projects = [
  {
    id: '1',
    title: 'Web3 Social Media Platform',
    employer: 'TechVentures Inc.',
    avatar: 'TV',
    description: 'Build a decentralized social media platform with user-owned content, NFT profiles, and token-based governance.',
    budget: '$6,000 - $10,000',
    deadline: '60 days',
    skills: ['React', 'Solidity', 'Web3.js', 'Node.js'],
    proposals: 12,
    isRush: false,
    posted: '1 day ago',
    match: 95,
    location: 'Remote',
  },
  {
    id: '2',
    title: 'Crypto Trading Bot Development',
    employer: 'DeFi Solutions',
    avatar: 'DS',
    description: 'Develop an automated trading bot for DEX arbitrage with risk management and portfolio tracking.',
    budget: '$4,000 - $7,000',
    deadline: '45 days',
    skills: ['Python', 'TypeScript', 'API Integration', 'Trading'],
    proposals: 8,
    isRush: false,
    posted: '2 days ago',
    match: 88,
    location: 'Remote',
  },
  {
    id: '3',
    title: 'DAO Governance Dashboard',
    employer: 'CommunityDAO',
    avatar: 'CD',
    description: 'Create a comprehensive governance dashboard for DAO proposals, voting, and treasury management.',
    budget: '$5,000 - $8,000',
    deadline: '50 days',
    skills: ['React', 'Solidity', 'GraphQL', 'Tailwind'],
    proposals: 15,
    isRush: true,
    rushFee: 25,
    posted: '3 days ago',
    match: 82,
    location: 'Remote',
  },
  {
    id: '4',
    title: 'NFT Marketplace with Auction',
    employer: 'ArtBlock Studio',
    avatar: 'AS',
    description: 'Build an NFT marketplace supporting both fixed-price and auction-style listings with royalty system.',
    budget: '$8,000 - $12,000',
    deadline: '75 days',
    skills: ['Next.js', 'Solidity', 'IPFS', 'PostgreSQL'],
    proposals: 20,
    isRush: false,
    posted: '4 days ago',
    match: 76,
    location: 'Remote',
  },
  {
    id: '5',
    title: 'Smart Contract Audit Platform',
    employer: 'SecureChain',
    avatar: 'SC',
    description: 'Develop an automated smart contract audit tool with vulnerability detection and reporting.',
    budget: '$10,000 - $15,000',
    deadline: '90 days',
    skills: ['Solidity', 'Security', 'Python', 'ML'],
    proposals: 6,
    isRush: true,
    rushFee: 30,
    posted: '5 days ago',
    match: 71,
    location: 'Remote',
  },
];

const skillFilters = ['React', 'Solidity', 'Python', 'TypeScript', 'Node.js', 'Web3.js'];
const budgetRanges = ['Under $5,000', '$5,000 - $10,000', '$10,000 - $20,000', '$20,000+'];

export default function BrowseProjects() {
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Browse Projects</h1>
        <p className="text-muted-foreground">Find projects that match your skills</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="w-full md:w-auto">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </Button>
      </div>

      {/* Skill Tags */}
      <div className="flex flex-wrap gap-2">
        {skillFilters.map((skill) => (
          <Badge
            key={skill}
            variant={selectedSkills.includes(skill) ? 'default' : 'secondary'}
            className={`cursor-pointer transition-colors ${
              selectedSkills.includes(skill)
                ? 'gradient-primary text-white'
                : 'hover:bg-primary/10'
            }`}
            onClick={() => toggleSkill(skill)}
          >
            {skill}
          </Badge>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {projects.length} projects
        {selectedSkills.length > 0 && ` matching ${selectedSkills.join(', ')}`}
      </p>

      {/* Projects Grid */}
      <div className="space-y-4">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer group"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {project.avatar}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{project.employer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/10 text-green-500">
                    <Zap className="w-3 h-3 mr-1" /> {project.match}% Match
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-muted-foreground mb-4 line-clamp-2">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {project.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                <span className="text-xs">{project.posted}</span>
                {project.isRush && (
                  <Badge className="bg-amber-500/10 text-amber-500">
                    <Zap className="w-3 h-3 mr-1" /> Rush +{project.rushFee}%
                  </Badge>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Button className="gradient-primary text-white">Submit Proposal</Button>
                <Button variant="outline">View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
