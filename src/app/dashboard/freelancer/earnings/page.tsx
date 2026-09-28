import { permanentRedirect } from 'next/navigation';
import { getFinancesRoute } from '@/lib/finances-route';

export default function FreelancerEarningsPage() {
  permanentRedirect(getFinancesRoute('freelancer', 'transactions'));
}
