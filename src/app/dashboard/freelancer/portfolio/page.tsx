'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  Globe,
  Image,
  Star,
} from 'lucide-react';

const portfolioItems = [
  {
    id: '1',
    title: 'DeFi Dashboard',
    description: 'A comprehensive DeFi dashboard with real-time portfolio tracking, yield farming analytics, and transaction history.',
    images: ['/portfolio/defi-1.jpg', '/portfolio/defi-2.jpg'],
    skills: ['React', 'TypeScript', 'Web3.js', 'Chart.js'],
    link: 'https://defi-dashboard.example.com',
    featured: true,
    date: 'Nov 2024',
  },
  {
    id: '2',
    title: 'NFT Marketplace',
    description: 'Full-featured NFT marketplace with minting, bidding, and auction functionality.',
    images: ['/portfolio/nft-1.jpg', '/portfolio/nft-2.jpg'],
    skills: ['Next.js', 'Solidity', 'IPFS', 'PostgreSQL'],
    link: 'https://nft-market.example.com',
    featured: true,
    date: 'Oct 2024',
  },
  {
    id: '3',
    title: 'DAO Governance Tool',
    description: 'Decentralized governance platform for DAOs with proposal creation, voting, and treasury management.',
    images: ['/portfolio/dao-1.jpg'],
    skills: ['React', 'Solidity', 'GraphQL', 'Tailwind'],
    link: 'https://dao-gov.example.com',
    featured: false,
    date: 'Sep 2024',
  },
  {
    id: '4',
    title: 'Crypto Wallet Extension',
    description: 'Browser extension wallet for managing multiple cryptocurrencies and interacting with dApps.',
    images: ['/portfolio/wallet-1.jpg'],
    skills: ['TypeScript', 'Chrome Extension API', 'Web3.js'],
    link: 'https://wallet.example.com',
    featured: false,
    date: 'Aug 2024',
  },
];

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Showcase your best work</p>
        </div>
        <Button className="gradient-primary text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Portfolio Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Image className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-xs text-muted-foreground">Portfolio Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-xs text-muted-foreground">Live Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {portfolioItems.map((item) => (
          <Card key={item.id} className="bg-card border-border overflow-hidden">
            {/* Image Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-cyan/20 flex items-center justify-center relative">
              <Globe className="w-16 h-16 text-muted-foreground/50" />
              {item.featured && (
                <Badge className="absolute top-3 right-3 gradient-primary text-white">
                  <Star className="w-3 h-3 mr-1" /> Featured
                </Badge>
              )}
              <div className="absolute bottom-3 left-3 flex gap-2">
                <Button variant="secondary" size="sm" className="bg-background/80 backdrop-blur">
                  <Edit className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button variant="secondary" size="sm" className="bg-background/80 backdrop-blur text-destructive">
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </div>

            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{item.description}</p>

              <div className="flex flex-wrap gap-1.5">
                {item.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
