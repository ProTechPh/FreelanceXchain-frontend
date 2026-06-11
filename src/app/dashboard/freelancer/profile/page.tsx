'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  MapPin,
  Star,
  Clock,
  Edit,
  Plus,
  X,
  Globe,
  Briefcase,
} from 'lucide-react';

const profile = {
  name: 'Alex Thompson',
  email: 'alex@example.com',
  bio: 'Full-stack blockchain developer with 5+ years of experience in DeFi, NFTs, and Web3 applications. Passionate about building decentralized solutions that make a real impact.',
  nationality: 'United States',
  hourlyRate: 85,
  availability: 'available',
  skills: ['React', 'Solidity', 'TypeScript', 'Node.js', 'Web3.js', 'GraphQL', 'PostgreSQL'],
  experience: [
    {
      id: '1',
      title: 'Senior Blockchain Developer',
      company: 'CryptoTech Solutions',
      description: 'Led development of DeFi protocols and NFT marketplaces.',
      startDate: 'Jan 2022',
      endDate: 'Present',
    },
    {
      id: '2',
      title: 'Full Stack Developer',
      company: 'WebAgency Pro',
      description: 'Built web applications with React and Node.js.',
      startDate: 'Mar 2019',
      endDate: 'Dec 2021',
    },
  ],
  portfolio: [
    { id: '1', title: 'DeFi Dashboard', image: '/portfolio/1.jpg' },
    { id: '2', title: 'NFT Marketplace', image: '/portfolio/2.jpg' },
    { id: '3', title: 'DAO Governance', image: '/portfolio/3.jpg' },
  ],
  stats: {
    projectsCompleted: 12,
    totalEarned: '$45,000',
    rating: 4.8,
    reviews: 24,
  },
};

export default function ProfilePage() {
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
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} />
                <AvatarFallback className="gradient-primary text-white text-2xl">
                  {profile.name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <MapPin className="w-4 h-4" /> {profile.nationality}
              </p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{profile.stats.rating}</span>
                <span className="text-muted-foreground">({profile.stats.reviews} reviews)</span>
              </div>
              <Badge className="mt-3 bg-green-500/10 text-green-500">
                <Clock className="w-3 h-3 mr-1" /> {profile.availability}
              </Badge>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="font-semibold text-primary">${profile.hourlyRate}/hr</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Projects Completed</span>
                <span className="font-semibold">{profile.stats.projectsCompleted}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Earned</span>
                <span className="font-semibold">{profile.stats.totalEarned}</span>
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
              <p className="text-muted-foreground">{profile.bio}</p>
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
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-sm py-1.5 px-3">
                    {skill}
                    <X className="w-3 h-3 ml-2 cursor-pointer hover:text-destructive" />
                  </Badge>
                ))}
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
              {profile.experience.map((exp) => (
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
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Portfolio */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Portfolio</CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {profile.portfolio.map((item) => (
                  <div
                    key={item.id}
                    className="aspect-video rounded-xl bg-secondary border border-border flex items-center justify-center cursor-pointer hover:border-primary/20 transition-all"
                  >
                    <Globe className="w-8 h-8 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
