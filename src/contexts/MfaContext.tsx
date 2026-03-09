import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { MfaRequiredModal } from '../features/mfa/components/MfaRequiredModal';
import api from '../lib/api';

interface MfaContextType {
  /**
   * Trigger the MFA required modal (for admins without MFA trying to access protected routes)
   */
  triggerMfaRequired: () => void;
  /**
   * Show MFA recommendation toast (for X-MFA-Recommended header)
   */
  showMfaRecommendation: () => void;
  /**
   * Check if MFA recommendation was already shown today
   */
  wasMfaRecommendationShownToday: () => boolean;
  /**
   * Mark MFA recommendation as shown today
   */
  markMfaRecommendationShown: () => void;
}

const MfaContext = createContext<MfaContextType | undefined>(undefined);

const MFA_RECOMMEND_KEY = 'mfa-recommend-shown-date';

export function useMfaContext() {
  const context = useContext(MfaContext);
  if (!context) {
    throw new Error('useMfaContext must be used within MfaProvider');
  }
  return context;
}

export function MfaProvider({ children }: { children: ReactNode }) {
  const [showMfaRequiredModal, setShowMfaRequiredModal] = useState(false);

  const triggerMfaRequired = useCallback(() => {
    setShowMfaRequiredModal(true);
  }, []);

  // Register callback with API client
  useEffect(() => {
    api.setMfaRequiredCallback(triggerMfaRequired);
  }, [triggerMfaRequired]);

  const wasMfaRecommendationShownToday = useCallback(() => {
    const lastShown = localStorage.getItem(MFA_RECOMMEND_KEY);
    if (!lastShown) return false;
    
    const today = new Date().toDateString();
    return lastShown === today;
  }, []);

  const markMfaRecommendationShown = useCallback(() => {
    const today = new Date().toDateString();
    localStorage.setItem(MFA_RECOMMEND_KEY, today);
  }, []);

  const showMfaRecommendation = useCallback(() => {
    // This will be handled by the API client via toast
    // Context just provides the check/mark functions
  }, []);

  const handleCloseMfaRequired = useCallback(() => {
    setShowMfaRequiredModal(false);
  }, []);

  return (
    <MfaContext.Provider
      value={{
        triggerMfaRequired,
        showMfaRecommendation,
        wasMfaRecommendationShownToday,
        markMfaRecommendationShown,
      }}
    >
      {children}
      <MfaRequiredModal
        isOpen={showMfaRequiredModal}
        onClose={handleCloseMfaRequired}
      />
    </MfaContext.Provider>
  );
}
