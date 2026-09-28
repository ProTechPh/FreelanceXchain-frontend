import { permanentRedirect } from 'next/navigation';
import { getFinancesRoute } from '@/lib/finances-route';

export default function FreelancerBillingPage() {
  permanentRedirect(getFinancesRoute('freelancer', 'billing'));
}
