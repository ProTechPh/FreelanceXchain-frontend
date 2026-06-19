'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { projectsApi } from '@/lib/api';
import type { Project } from '@/types';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Clock,
  DollarSign,
  Users,
  Zap,
  Loader2,
} from 'lucide-react';

const skillFilters = ['React', 'Solidity', 'Python', 'TypeScript', 'Node.js', 'Web3.js'];

export default function BrowseProjects() {
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectsApi.list({ status: 'open' });
        setProjects(res.data.data);
      } catch {
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = !search || 
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase());
    const matchesSkills = selectedSkills.length === 0 ||
      project.required_skills?.some(skill => selectedSkills.includes(skill.name));
    return matchesSearch && matchesSkills;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        Showing {filteredProjects.length} projects
        {selectedSkills.length > 0 && ` matching ${selectedSkills.join(', ')}`}
      </p>

      {/* Projects Grid */}
      <div className="space-y-4">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="bg-card border-border hover:border-primary/20 transition-all cursor-pointer group"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{project.employer?.name || 'Unknown Employer'}</p>
                </div>
                {project.is_rush && (
                  <Badge className="bg-amber-500/10 text-amber-500">
                    <Zap className="w-3 h-3 mr-1" /> Rush +{project.rush_fee_percentage}%
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground mb-4 line-clamp-2">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {project.required_skills?.map((skill) => (
                  <Badge key={skill.id} variant="secondary" className="text-xs">
                    {skill.name}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium text-primary">${project.budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {project.deadline}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {project.proposal_count || 0} proposals
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Button className="gradient-primary text-white">Submit Proposal</Button>
                <Button variant="outline">View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredProjects.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No projects found matching your criteria</p>
        )}
      </div>
    </div>
  );
}
