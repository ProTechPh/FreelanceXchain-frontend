'use client';

import { useParams } from 'next/navigation';
import { DisputeCenter } from '@/components/disputes/dispute-center';

export default function EmployerDisputeDetailPage() {
  const params = useParams<{ id: string }>();
  return <DisputeCenter role="employer" disputeId={params?.id} />;
}
