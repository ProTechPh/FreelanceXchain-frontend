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
  Star,
  MapPin,
  Clock,
  DollarSign,
  Users,
} from 'lucide-react';

const freelancers = [
  {
    id: '1',
    name: 'Alex Thompson',
    avatar: 'AT',
    title: 'Full-Stack Blockchain Developer',
    hourlyRate: 85,
    rating: 4.8,
    reviews: 24,
    skills: ['React', 'Solidity', 'TypeScript', 'Node.js'],
    availability: 'available',
    location: 'United States',
    completedProjects: 12,
    bio: 'Experienced blockchain developer with 5+ years in DeFi and NFTs.',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    avatar: 'SC',
    title: 'UI/UX Designer & Frontend Developer',
    hourlyRate: 75,
    rating: 4.9,
    reviews: 31,
    skills: ['Figma', 'React', 'CSS', 'Tailwind'],
    availability: 'available',
    location: 'Canada',
    completedProjects: 18,
    bio: 'Creating beautiful, user-centered digital experiences.',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatar: 'MJ',
    title: 'Smart Contract Developer',
    hourlyRate: 120,
    rating: 4.7,
    reviews: 15,
    skills: ['Solidity', 'Security', 'Testing', 'DeFi'],
    availability: 'busy',
    location: 'United Kingdom',
    completedProjects: 8,
    bio: 'Security-focused smart contract developer specializing in DeFi protocols.',
  },
  {
    id: '4',
    name: 'Elena Rodriguez',
    avatar: 'ER',
    title: 'DevOps & Cloud Architect',
    hourlyRate: 95,
    rating: 4.8,
    reviews: 20,
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    availability: 'available',
    location: 'Spain',
    completedProjects: 14,
    bio: 'Building scalable cloud infrastructure for web3 applications.',
  },
  {
    id: '5',
    name: 'David Kim',
    avatar: 'DK',
    title: 'Mobile App Developer',
    hourlyRate: 80,
    rating: 4.6,
    reviews: 22,
    skills: ['React Native', 'Flutter', 'iOS', 'Android'],
    availability: 'available',
    location: 'South Korea',
    completedProjects: 16,
    bio: 'Cross-platform mobile developer with focus on performance.',
  },
  {
    id: '6',
    name: 'Lisa Wang',
    avatar: 'LW',
    title: 'Data Scientist & ML Engineer',
    hourlyRate: 110,
    rating: 4.9,
    reviews: 12,
    skills: ['Python', 'TensorFlow', 'SQL', 'Analytics'],
    availability: 'busy',
    location: 'Singapore',
    completedProjects: 10,
    bio: 'Turning data into actionable insights with machine learning.',
  },
];

const availabilityColors: Record<string, string> = {
  available: 'bg-green-500/10 text-green-500',
  busy: 'bg-yellow-500/10 text-yellow-500',
  unavailable: 'bg-gray-500/10 text-gray-500',
};

export default function FreelancersPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">Find Talent</h1>
          <p className="text-muted-foreground">
            Browse verified freelancers with on-chain reputation
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, skill, or title..."
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
          Showing {freelancers.length} freelancers
        </p>

        {/* Freelancers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelancers.map((freelancer) => (
            <Link key={freelancer.id} href={`/freelancers/${freelancer.id}`}>
              <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg">
                      {freelancer.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{freelancer.name}</h3>
                      <p className="text-sm text-muted-foreground">{freelancer.title}</p>
                    </div>
                    <Badge className={availabilityColors[freelancer.availability]}>
                      <Clock className="w-3 h-3 mr-1" />
                      {freelancer.availability}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {freelancer.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {freelancer.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{freelancer.rating}</span>
                      <span className="text-muted-foreground">({freelancer.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {freelancer.location}
                    </div>
                    <div className="font-semibold text-primary">
                      ${freelancer.hourlyRate}/hr
                    </div>
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
