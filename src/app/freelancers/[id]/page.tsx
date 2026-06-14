'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { freelancersApi } from '@/lib/api';
import type { FreelancerProfile } from '@/types';
import { toast } from 'sonner';
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
  Loader2,
} from 'lucide-react';

export default function FreelancerProfilePage() {
  const params = useParams();
  const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFreelancer = async () => {
      try {
        const res = await freelancersApi.getPublicProfile(params.id as string);
        setFreelancer(res.data.data);
      } catch {
        toast.error('Failed to load freelancer profile');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchFreelancer();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Freelancer not found</p>
      </div>
    );
  }

  const initials = freelancer.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-2xl">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{freelancer.name}</h1>
                <Badge className="bg-green-500/10 text-green-500">
                  <Clock className="w-3 h-3 mr-1" /> {freelancer.availability}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-3">{freelancer.bio || 'No bio provided'}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {freelancer.nationality || 'Remote'}
                </span>
                <span className="font-semibold text-primary text-lg">${freelancer.hourly_rate}/hr</span>
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
                  {freelancer.bio || 'No bio provided'}
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
                  {freelancer.skills?.map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="text-sm py-1.5 px-3">
                      {skill.name}
                    </Badge>
                  ))}
                  {(!freelancer.skills || freelancer.skills.length === 0) && (
                    <p className="text-sm text-muted-foreground">No skills listed</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Experience */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {freelancer.experience?.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{exp.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> {exp.company}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {exp.start_date} - {exp.end_date || 'Present'}
                      </span>
                    </div>
                  </div>
                ))}
                {(!freelancer.experience || freelancer.experience.length === 0) && (
                  <p className="text-sm text-muted-foreground">No experience listed</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="font-semibold text-primary">${freelancer.hourly_rate}/hr</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Availability</span>
                  <span className="font-semibold capitalize">{freelancer.availability}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-semibold">{new Date(freelancer.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-3">
                <Button className="w-full gradient-primary text-white">
                  <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" /> View Portfolio
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
