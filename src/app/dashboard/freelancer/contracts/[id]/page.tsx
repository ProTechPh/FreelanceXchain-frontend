'use client';

import { useParams } from 'next/navigation';
import { ContractWorkspace } from '@/components/contracts/contract-workspace';

export default function FreelancerContractPage() {
  const params = useParams<{ id: string }>();
  return <ContractWorkspace contractId={params?.id ?? ''} role="freelancer" />;
}
