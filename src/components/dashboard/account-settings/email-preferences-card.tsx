'use client';

import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { emailPreferencesApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import type { EmailPreferences, EmailPreferencesUpdate } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

const preferenceRows: Array<{
  key: keyof Pick<
    EmailPreferences,
    | 'proposalReceived'
    | 'proposalAccepted'
    | 'milestoneUpdates'
    | 'paymentNotifications'
    | 'disputeNotifications'
    | 'marketingEmails'
    | 'weeklyDigest'
  >;
  apiKey: keyof EmailPreferencesUpdate;
  label: string;
}> = [
  { key: 'proposalReceived', apiKey: 'proposal_received', label: 'New proposals' },
  { key: 'proposalAccepted', apiKey: 'proposal_accepted', label: 'Proposal decisions' },
  { key: 'milestoneUpdates', apiKey: 'milestone_updates', label: 'Milestone updates' },
  { key: 'paymentNotifications', apiKey: 'payment_notifications', label: 'Payment activity' },
  { key: 'disputeNotifications', apiKey: 'dispute_notifications', label: 'Dispute activity' },
  { key: 'weeklyDigest', apiKey: 'weekly_digest', label: 'Weekly digest' },
  { key: 'marketingEmails', apiKey: 'marketing_emails', label: 'Product news and tips' },
];

interface EmailPreferencesCardProps {
  preferences: EmailPreferences | null;
  onPreferencesChange: (preferences: EmailPreferences) => void;
}

export function EmailPreferencesCard({ preferences, onPreferencesChange }: EmailPreferencesCardProps) {
  const updatePreference = async (
    key: (typeof preferenceRows)[number]['key'],
    apiKey: keyof EmailPreferencesUpdate,
  ) => {
    if (!preferences) return;

    const nextValue = !preferences[key];
    try {
      const { data } = await emailPreferencesApi.update({ [apiKey]: nextValue });
      onPreferencesChange(data);
      toast.success('Email preference saved.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save that email preference.'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-5" /> Email preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!preferences && (
          <p role="status" className="text-sm text-muted-foreground">
            Loading preferences…
          </p>
        )}
        {preferences &&
          preferenceRows.map((row) => (
            <div
              key={row.key}
              className="flex min-h-12 items-center justify-between gap-4 border-b border-border py-2 last:border-0"
            >
              <span className="text-sm">{row.label}</span>
              <Switch
                checked={preferences[row.key]}
                aria-label={`${row.label} emails`}
                onCheckedChange={() => updatePreference(row.key, row.apiKey)}
              />
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
