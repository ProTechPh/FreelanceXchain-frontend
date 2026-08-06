'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Clock, MapPin } from 'lucide-react';
import { MarketplaceBrowser } from '@/components/marketplace/marketplace-browser';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { FreelancerProfile } from '@/types';

const availabilityColors: Record<string, string> = {
  available: 'bg-green-500/10 text-green-500',
  busy: 'bg-yellow-500/10 text-yellow-500',
  unavailable: 'bg-gray-500/10 text-gray-500',
};

function FreelancerResult({ freelancer }: { freelancer: FreelancerProfile }) {
  const initials = (freelancer.name ?? 'U').split(' ').map((name) => name[0]).join('');
  return (
    <Link href={`/freelancers/${freelancer.userId}`} className="block h-full">
      <Card className="h-full cursor-pointer transition-all hover:border-primary/20">
        <CardContent className="p-6 pt-16">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl gradient-primary text-lg font-bold text-white">{initials}</div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold">{freelancer.name || 'Freelancer'}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{freelancer.bio || 'No bio provided'}</p>
            </div>
          </div>
          <Badge className={availabilityColors[freelancer.availability]}><Clock className="mr-1 size-3" />{freelancer.availability}</Badge>
          <div className="my-4 flex flex-wrap gap-1.5">
            {freelancer.skills?.slice(0, 4).map((skill) => <Badge key={skill.name} variant="secondary" className="text-xs">{skill.name}</Badge>)}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-3" />{freelancer.nationality || 'Remote'}</span>
            <span className="font-semibold text-primary">${freelancer.hourlyRate}/hr</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function FreelancersMarketplace() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams?.get('keyword') || '';

  return (
    <MarketplaceBrowser<FreelancerProfile>
      key={initialKeyword}
      kind="freelancer"
      initialKeyword={initialKeyword}
      title="Find Talent"
      description="Search freelancer profiles by specialty and keep a shortlist of favorites."
      emptyMessage="No freelancers match these filters."
      layout="grid"
      getTargetId={(freelancer) => freelancer.userId}
      renderItem={(freelancer) => <FreelancerResult freelancer={freelancer} />}
    />
  );
}

export default function FreelancersPage() {
  return <Suspense><FreelancersMarketplace /></Suspense>;
}
