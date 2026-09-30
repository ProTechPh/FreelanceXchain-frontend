import { redirect } from 'next/navigation';

/**
 * /dashboard root — unauthenticated users land here when they navigate to the
 * dashboard without a specific role path. The DashboardLayout that wraps role
 * sub-trees handles the actual auth guard; this page ensures the bare /dashboard
 * URL never surfaces a 404 and instead sends visitors to the login page.
 */
export default function DashboardRootPage() {
  redirect('/login');
}
