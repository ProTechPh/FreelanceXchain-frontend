import { permanentRedirect } from 'next/navigation';
import { getFinancesRoute } from '@/lib/finances-route';

export default function EmployerTransactionsPage() {
  permanentRedirect(getFinancesRoute('employer', 'transactions'));
}
