import { permanentRedirect } from 'next/navigation';
import { getFinancesRoute } from '@/lib/finances-route';

export default function EmployerBillingPage() {
  permanentRedirect(getFinancesRoute('employer', 'billing'));
}
