'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Contract, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

type ParticipantRole = Extract<UserRole, 'employer' | 'freelancer'>;

interface ContractWorkspaceHeaderProps {
  contract: Contract;
  role: ParticipantRole;
}

export function ContractWorkspaceHeader({ contract, role }: ContractWorkspaceHeaderProps) {
  const contractTitle = contract.project?.title || contract.title || `Contract #${contract.id.slice(0, 8)}`;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/${role}`}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/${role}/contracts`}>Contracts</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{contractTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground hover:text-foreground">
          <Link href={`/dashboard/${role}/contracts`}>
            <ArrowLeft className="mr-2 size-4" /> Back to contracts
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{contractTitle}</h1>
          <p className="mt-1 text-muted-foreground">Contract #{contract.id.slice(0, 8)}</p>
        </div>
        <StatusBadge status={contract.status} domain="contract" />
      </div>
    </div>
  );
}
