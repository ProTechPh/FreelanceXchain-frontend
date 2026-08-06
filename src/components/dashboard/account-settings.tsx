'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ExternalLink, HardDrive, KeyRound, Mail, Shield, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { authApi, emailPreferencesApi, fileManagementApi } from '@/lib/api';
import { connectWallet, formatWalletAddress, type WalletConnection } from '@/lib/wallet';
import { formatFileSize } from '@/lib/file-storage';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { useAuthStore } from '@/stores/authStore';
import type { EmailPreferences, EmailPreferencesUpdate, FileInfo, FileQuota, MfaFactor } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const preferenceRows: Array<{
  key: keyof Pick<EmailPreferences, 'proposalReceived' | 'proposalAccepted' | 'milestoneUpdates' | 'paymentNotifications' | 'disputeNotifications' | 'marketingEmails' | 'weeklyDigest'>;
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

export function AccountSettings() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [otpCode, setOtpCode] = useState('');
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [isDisablingMfa, setIsDisablingMfa] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [quota, setQuota] = useState<FileQuota | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const loadStorage = useCallback(async () => {
    setStorageLoading(true);
    try {
      const [fileResponse, quotaResponse] = await Promise.all([fileManagementApi.list(), fileManagementApi.getQuota()]);
      setFiles(fileResponse.data);
      setQuota(quotaResponse.data);
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([emailPreferencesApi.get(), authApi.mfaFactors()])
      .then(([preferenceResponse, factorResponse]) => {
        setPreferences(preferenceResponse.data);
        setFactors(factorResponse.data.factors);
      })
      .catch(() => toast.error('Some account settings could not be loaded.'));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStorage();
  }, [loadStorage]);

  const updatePreference = async (
    key: (typeof preferenceRows)[number]['key'],
    apiKey: keyof EmailPreferencesUpdate,
  ) => {
    if (!preferences) return;

    const nextValue = !preferences[key];
    try {
      const { data } = await emailPreferencesApi.update({ [apiKey]: nextValue });
      setPreferences(data);
      toast.success('Email preference saved.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save that email preference.'));
    }
  };

  const disableMfa = async () => {
    const factor = factors[0];
    if (!factor || otpCode.length !== 6) return;

    setIsDisablingMfa(true);
    try {
      await authApi.mfaDisable(factor.id, otpCode);
      setFactors([]);
      setOtpCode('');
      toast.success('Two-factor authentication disabled.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to disable two-factor authentication.'));
    } finally {
      setIsDisablingMfa(false);
    }
  };

  const connect = async () => {
    if (!window.ethereum) {
      toast.error('Install an EVM-compatible wallet such as MetaMask to continue.');
      return;
    }

    setIsConnectingWallet(true);
    try {
      const connection = await connectWallet(window.ethereum);
      const { data } = await authApi.updateWallet(connection.address);
      setWallet(connection);
      if (user) setUser({ ...user, walletAddress: data.walletAddress });
      toast.success('Wallet connected to your account.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, error instanceof Error ? error.message : 'Unable to connect wallet.'));
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const deleteFile = async (file: FileInfo) => {
    if (!window.confirm(`Delete “${file.name}” from your storage?`)) return;
    setDeletingFile(file.path);
    try {
      await fileManagementApi.remove(file.bucket, file.path);
      await loadStorage();
      toast.success('File deleted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete this file.'));
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account settings</h1>
        <p className="text-muted-foreground">Manage security, email delivery, and your payment wallet.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="size-5" /> Password</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Password changes use the secure email recovery flow and invalidate existing sessions.
          </p>
          <Button asChild variant="outline"><Link href="/forgot-password">Send reset email</Link></Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="size-5" /> Two-factor authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Authenticator protection</p>
                <Badge variant="secondary">{factors.length > 0 ? 'Enabled' : 'Not enabled'}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Require a one-time code during sign in.</p>
            </div>
            {factors.length === 0 && <Button asChild><Link href="/mfa/setup">Enable 2FA</Link></Button>}
          </div>
          {factors.length > 0 && (
            <div className="max-w-sm space-y-2 rounded-lg border border-border p-4">
              <Label htmlFor="disable-mfa-code">Authenticator code to disable 2FA</Label>
              <div className="flex gap-2">
                <Input
                  id="disable-mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <Button variant="destructive" disabled={otpCode.length !== 6 || isDisablingMfa} onClick={disableMfa}>
                  Disable
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="size-5" /> Email preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!preferences && <p role="status" className="text-sm text-muted-foreground">Loading preferences…</p>}
          {preferences && preferenceRows.map((row) => (
            <div key={row.key} className="flex min-h-12 items-center justify-between gap-4 border-b border-border py-2 last:border-0">
              <span className="text-sm">{row.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={preferences[row.key]}
                aria-label={`${row.label} emails`}
                onClick={() => updatePreference(row.key, row.apiKey)}
                className={`relative h-6 w-11 rounded-full transition-colors ${preferences[row.key] ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${preferences[row.key] ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="size-5" /> Payment wallet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">
              {wallet ? formatWalletAddress(wallet.address) : user?.walletAddress ? formatWalletAddress(user.walletAddress) : 'No wallet connected'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {wallet ? `${wallet.balance} native tokens · ${wallet.networkName}` : 'Used to associate blockchain payments with your account.'}
            </p>
          </div>
          <Button onClick={connect} disabled={isConnectingWallet}>
            {isConnectingWallet ? 'Connecting…' : user?.walletAddress ? 'Replace wallet' : 'Connect wallet'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><HardDrive className="size-5" />File storage</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {storageLoading && <p role="status" className="text-sm text-muted-foreground">Loading storage usage…</p>}
          {!storageLoading && !storageAvailable && <p className="text-sm text-muted-foreground">Storage information is temporarily unavailable.</p>}
          {!storageLoading && storageAvailable && quota && (
            <>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm"><span>{formatFileSize(quota.used)} of {formatFileSize(quota.limit)} used</span><span className="text-muted-foreground">{quota.files} file{quota.files === 1 ? '' : 's'}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Storage used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(quota.percentage)}><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, quota.percentage)}%` }} /></div>
              </div>
              {files.length === 0 ? <p className="text-sm text-muted-foreground">No proposal or portfolio files stored.</p> : <ul className="divide-y divide-border rounded-lg border border-border">{files.map((file) => <li key={`${file.bucket}:${file.path}`} className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)} · {file.bucket.replaceAll('_', ' ')}</p></div><div className="flex gap-1">{file.publicUrl && <Button asChild type="button" variant="ghost" size="icon"><a href={file.publicUrl} target="_blank" rel="noreferrer" aria-label={`Open ${file.name}`}><ExternalLink className="size-4" /></a></Button>}<Button type="button" variant="ghost" size="icon" aria-label={`Delete ${file.name}`} disabled={deletingFile === file.path} onClick={() => void deleteFile(file)}><Trash2 className="size-4 text-destructive" /></Button></div></li>)}</ul>}
            </>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle className="size-4" aria-hidden="true" />
        Unsupported account-deletion and wallet-disconnect controls are intentionally not shown.
      </p>
    </div>
  );
}
