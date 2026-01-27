import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { useKycStatus } from '../hooks/useKycGuard';

interface KycProtectedRouteProps {
  children: ReactNode;
}

/**
 * Wrapper component that requires KYC approval to access
 * Redirects to KYC page if not approved
 */
export function KycProtectedRoute({ children }: KycProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const { isKycApproved } = useKycStatus();

  // If not authenticated, let ProtectedRoute handle it
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // If not KYC approved, redirect to KYC page
  if (!isKycApproved) {
    return <Navigate to="/kyc" replace />;
  }

  return <>{children}</>;
}
