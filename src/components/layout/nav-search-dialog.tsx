'use client';

import * as React from 'react';
import Link from 'next/link';
import { Zap as Lightning, Users, Newspaper } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export interface NavSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavSearchDialog({ open, onOpenChange }: NavSearchDialogProps) {
  const [globalSearchQuery, setGlobalSearchQuery] = React.useState('');

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={globalSearchQuery}
        onValueChange={setGlobalSearchQuery}
        placeholder="Search projects, freelancers, features..."
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {globalSearchQuery.trim() && (
          <CommandGroup className="text-muted-foreground" heading="Search marketplace">
            <CommandItem asChild value={`Search projects ${globalSearchQuery}`}>
              <Link
                href={`/projects?keyword=${encodeURIComponent(globalSearchQuery.trim())}`}
                onClick={() => onOpenChange(false)}
              >
                <Lightning className="size-4" strokeWidth={1.5} />
                Search projects for &quot;{globalSearchQuery.trim()}&quot;
              </Link>
            </CommandItem>
            <CommandItem asChild value={`Search freelancers ${globalSearchQuery}`}>
              <Link
                href={`/freelancers?keyword=${encodeURIComponent(globalSearchQuery.trim())}`}
                onClick={() => onOpenChange(false)}
              >
                <Users className="size-4" strokeWidth={1.5} />
                Search talent for &quot;{globalSearchQuery.trim()}&quot;
              </Link>
            </CommandItem>
          </CommandGroup>
        )}
        <CommandGroup className="text-muted-foreground" heading="Quick Links">
          <CommandItem asChild value="browse projects">
            <Link href="/projects" onClick={() => onOpenChange(false)}>
              <Lightning className="size-4" strokeWidth={1.5} />
              Browse Projects
            </Link>
          </CommandItem>
          <CommandItem asChild value="find freelancers">
            <Link href="/freelancers" onClick={() => onOpenChange(false)}>
              <Users className="size-4" strokeWidth={1.5} />
              Find Talent
            </Link>
          </CommandItem>
          <CommandItem asChild value="crypto news">
            <Link href="/news" onClick={() => onOpenChange(false)}>
              <Newspaper className="size-4" strokeWidth={1.5} />
              Crypto News
            </Link>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
