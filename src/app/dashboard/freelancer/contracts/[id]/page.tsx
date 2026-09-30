'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ContractWorkspace } from '@/components/contracts/contract-workspace';

export default function FreelancerContractPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const disputeId = searchParams.get('disputeId') ?? undefined;
  return (
    <ContractWorkspace
      contractId={params?.id ?? ''}
      disputeId={disputeId}
      role="freelancer"
    />
  );
}
