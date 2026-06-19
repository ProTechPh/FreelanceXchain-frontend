'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { freelancersApi } from '@/lib/api';
import type { FreelancerProfile } from '@/types';
import {
  MapPin,
  Clock,
  Edit,
  Plus,
  X,
  Briefcase,
  Loader2,
} from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await freelancersApi.getProfile();
        setProfile(res.data.data);
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || 'Profile not found'}</p>
      </div>
    );
  }

  const initials = profile.name.split(' ').map((n) => n[0]).join('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your public profile</p>
        </div>
        <Button className="gradient-primary text-white">
          <Edit className="w-4 h-4 mr-2" /> Edit Profile
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarFallback className="gradient-primary text-white text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <MapPin className="w-4 h-4" /> {profile.nationality || 'Not specified'}
              </p>
              <Badge className="mt-3 bg-green-500/10 text-green-500">
                <Clock className="w-3 h-3 mr-1" /> {profile.availability}
              </Badge>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="font-semibold text-primary">${profile.hourly_rate}/hr</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>About Me</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{profile.bio || 'No bio provided'}</p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Skills</CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add Skill
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.map((skill) => (
                  <Badge key={skill.id} variant="secondary" className="text-sm py-1.5 px-3">
                    {skill.name}
                    <X className="w-3 h-3 ml-2 cursor-pointer hover:text-destructive" />
                  </Badge>
                ))}
                {(!profile.skills || profile.skills.length === 0) && (
                  <p className="text-sm text-muted-foreground">No skills added yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Experience</CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add Experience
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.experience?.map((exp) => (
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
              {(!profile.experience || profile.experience.length === 0) && (
                <p className="text-sm text-muted-foreground">No experience added yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
