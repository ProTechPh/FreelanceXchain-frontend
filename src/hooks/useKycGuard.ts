import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook to guard routes that require KYC approval
 * Redirects to KYC page if user is not KYC approved
 * Admins bypass KYC requirement
 */
export function useKycGuard() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Admins bypass KYC requirement
  const isAdmin = user?.role === 'admin';
  const isKycApproved = isAdmin || user?.kycStatus === 'approved';
  const needsKyc = isAuthenticated && !isAdmin && !isKycApproved;

  useEffect(() => {
    if (needsKyc) {
      showToast({
        type: 'warning',
        title: 'KYC Verification Required',
        message: 'Please complete KYC verification to access this feature',
        duration: 4000,
      });
      navigate('/kyc');
    }
  }, [needsKyc, navigate, showToast]);

  return {
    isKycApproved,
    needsKyc,
    kycStatus: user?.kycStatus,
  };
}

/**
 * Check if user has KYC approval without redirecting
 * Admins bypass KYC requirement
 */
export function useKycStatus() {
  const { user } = useAuthStore();
  
  // Admins bypass KYC requirement
  const isAdmin = user?.role === 'admin';
  
  return {
    isKycApproved: isAdmin || user?.kycStatus === 'approved',
    kycStatus: user?.kycStatus,
    isPending: !isAdmin && (user?.kycStatus === 'pending' || user?.kycStatus === 'in_progress' || user?.kycStatus === 'completed'),
    isRejected: !isAdmin && user?.kycStatus === 'rejected',
    needsSubmission: !isAdmin && (!user?.kycStatus || user?.kycStatus === 'rejected'),
  };
}
