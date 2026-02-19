/**
 * MFA Integration Example
 * 
 * Copy this code to your Settings page to add MFA functionality
 */

import { MfaStatusCard } from './features/mfa/components/MfaStatusCard';
import { ShieldCheck } from 'lucide-react';

// Example 1: Simple Integration (Recommended)
export function SecuritySettingsSimple() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Security Settings
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your account security and authentication methods
        </p>
      </div>

      {/* MFA Section */}
      <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Multi-Factor Authentication
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Add an extra layer of security to your account by requiring a code from your authenticator app when you sign in.
        </p>
        
        {/* This is all you need! */}
        <MfaStatusCard />
      </div>
    </div>
  );
}

// Example 2: Full Security Settings Page
export function SecuritySettingsFull() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Security Settings
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your account security and authentication methods
        </p>
      </div>

      {/* Password Section */}
      <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Password
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-900 dark:text-white font-medium">
              Change Password
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Last changed 30 days ago
            </p>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            Change
          </button>
        </div>
      </div>

      {/* MFA Section */}
      <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Multi-Factor Authentication
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Add an extra layer of security to your account by requiring a code from your authenticator app when you sign in.
        </p>
        
        <MfaStatusCard />
      </div>

      {/* Sessions Section */}
      <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Sessions
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                Current Session
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Chrome on Windows • Manila, Philippines
              </p>
            </div>
            <span className="text-xs text-green-500 font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example 3: With React Router
import { Routes, Route } from 'react-router-dom';

export function SettingsRoutes() {
  return (
    <Routes>
      <Route path="/settings/security" element={<SecuritySettingsFull />} />
      {/* Other settings routes */}
    </Routes>
  );
}

// Example 4: Standalone MFA Management Page
export function MfaManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Multi-Factor Authentication
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Protect your account with an extra layer of security
          </p>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-8">
          <MfaStatusCard />
          
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-border">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              How it works
            </h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-2">
                <span className="font-semibold text-primary-500">1.</span>
                Download an authenticator app like Google Authenticator or Authy
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary-500">2.</span>
                Scan the QR code with your authenticator app
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary-500">3.</span>
                Enter the 6-digit code to verify and enable MFA
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary-500">4.</span>
                Use the code from your app every time you sign in
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example 5: Admin Dashboard with MFA Enforcement
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMfa } from './features/mfa/hooks';
import { useToast } from './contexts/ToastContext';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { isEnabled, isLoading } = useMfa();
  const { showToast } = useToast();

  useEffect(() => {
    // Enforce MFA for admin users
    if (!isLoading && !isEnabled) {
      showToast({
        type: 'warning',
        title: 'MFA Required',
        message: 'Admin accounts must have MFA enabled',
      });
      navigate('/settings/security');
    }
  }, [isEnabled, isLoading, navigate, showToast]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isEnabled) {
    return null; // Will redirect
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Admin content */}
    </div>
  );
}

// Example 6: MFA Status Badge (for navbar or profile)
import { useMfa } from './features/mfa/hooks';

export function MfaStatusBadge() {
  const { isEnabled, isLoading } = useMfa();

  if (isLoading) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-dark-bg">
      <ShieldCheck 
        className={`w-4 h-4 ${isEnabled ? 'text-green-500' : 'text-gray-400'}`} 
      />
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        MFA {isEnabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
}

// Example 7: Onboarding Flow with Optional MFA
import { useState } from 'react';

export function OnboardingMfaStep({ onSkip, onComplete }) {
  const [showSetup, setShowSetup] = useState(false);

  return (
    <div className="max-w-md mx-auto text-center p-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/10 mb-6">
        <ShieldCheck className="w-10 h-10 text-primary-500" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Secure Your Account
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Enable Multi-Factor Authentication to add an extra layer of security to your account.
      </p>

      {!showSetup ? (
        <div className="space-y-3">
          <button
            onClick={() => setShowSetup(true)}
            className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
          >
            Enable MFA Now
          </button>
          <button
            onClick={onSkip}
            className="w-full px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Skip for Now
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-6">
          <MfaStatusCard />
        </div>
      )}
    </div>
  );
}

/**
 * QUICK START:
 * 
 * 1. Copy SecuritySettingsSimple to your Settings page
 * 2. Import MfaStatusCard component
 * 3. Done! MFA is now available to users
 * 
 * That's it! The component handles everything:
 * - Fetching MFA status
 * - Enrollment flow
 * - QR code display
 * - Code verification
 * - Disable flow
 * - Error handling
 * - Loading states
 */
