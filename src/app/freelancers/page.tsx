'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { freelancersApi } from '@/lib/api';
import type { FreelancerProfile } from '@/types';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Loader2,
} from 'lucide-react';

const availabilityColors: Record<string, string> = {
  available: 'bg-green-500/10 text-green-500',
  busy: 'bg-yellow-500/10 text-yellow-500',
  unavailable: 'bg-gray-500/10 text-gray-500',
};

export default function FreelancersPage() {
  const [search, setSearch] = useState('');
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const res = await freelancersApi.search();
        setFreelancers(res.data.data);
      } catch {
        toast.error('Failed to load freelancers');
      } finally {
        setLoading(false);
      }
    };
    fetchFreelancers();
  }, []);

  const filteredFreelancers = freelancers.filter(f => 
    !search || 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.bio?.toLowerCase().includes(search.toLowerCase()) ||
    f.skills?.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          Showing {filteredFreelancers.length} freelancers
        </p>

        {/* Freelancers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFreelancers.map((freelancer) => (
            <Link key={freelancer.id} href={`/freelancers/${freelancer.id}`}>
              <Card className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg">
                      {freelancer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{freelancer.name}</h3>
                      <p className="text-sm text-muted-foreground">{freelancer.bio?.slice(0, 50)}...</p>
                    </div>
                    <Badge className={availabilityColors[freelancer.availability]}>
                      <Clock className="w-3 h-3 mr-1" />
                      {freelancer.availability}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {freelancer.skills?.slice(0, 4).map((skill) => (
                      <Badge key={skill.id} variant="secondary" className="text-xs">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {freelancer.nationality || 'Remote'}
                    </div>
                    <div className="font-semibold text-primary">
                      ${freelancer.hourly_rate}/hr
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filteredFreelancers.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">No freelancers found</p>
          )}
        </div>
      </div>
    </div>
  );
}
