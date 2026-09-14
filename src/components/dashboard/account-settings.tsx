'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authApi, emailPreferencesApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { TourSettingsCard } from '@/components/onboarding/tour-settings-card';
import type { EmailPreferences, MfaFactor } from '@/types';
import { EmailVerificationCard } from './account-settings/email-verification-card';
import { PasswordSecurityCard } from './account-settings/password-security-card';
import { MfaCard } from './account-settings/mfa-card';
import { EmailPreferencesCard } from './account-settings/email-preferences-card';
import { WalletSettingsCard } from './account-settings/wallet-settings-card';
import { StorageQuotaCard } from './account-settings/storage-quota-card';
import { DangerZoneCard } from './account-settings/danger-zone-card';

export function AccountSettings() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [factors, setFactors] = useState<MfaFactor[]>([]);

  useEffect(() => {
    Promise.all([emailPreferencesApi.get(), authApi.mfaFactors()])
      .then(([preferenceResponse, factorResponse]) => {
        setPreferences(preferenceResponse.data);
        setFactors(factorResponse.data.factors);
      })
      .catch(() => toast.error('Some account settings could not be loaded.'));
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Account settings</h1>
        <p className="text-muted-foreground">Manage security, email delivery, and your payment wallet.</p>
      </div>

      <EmailVerificationCard user={user} />

      <PasswordSecurityCard user={user} onLogout={logout} />

      <MfaCard factors={factors} onFactorsChange={setFactors} />

      <EmailPreferencesCard preferences={preferences} onPreferencesChange={setPreferences} />

      <TourSettingsCard />

      <WalletSettingsCard user={user} onUserUpdate={setUser} />

      <StorageQuotaCard />

      <DangerZoneCard user={user} onLogout={logout} />
    </div>
  );
}
