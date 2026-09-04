'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  HardDrive,
  KeyRound,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  Trash2,
  Unlink,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { authApi, emailPreferencesApi, fileManagementApi } from '@/lib/api';
import { connectWallet, formatWalletAddress, type WalletConnection } from '@/lib/wallet';
import { formatFileSize } from '@/lib/file-storage';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { reportFailure } from '@/lib/report-failure';
import { safeAttachmentUrl } from '@/lib/attachment-presentation';
import { useAuthStore } from '@/stores/authStore';
import { TourSettingsCard } from '@/components/onboarding/tour-settings-card';
import type { EmailPreferences, EmailPreferencesUpdate, FileInfo, FileQuota, MfaFactor } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

export function AccountSettings() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [otpCode, setOtpCode] = useState('');
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [isDisconnectingWallet, setIsDisconnectingWallet] = useState(false);
  const [isDisablingMfa, setIsDisablingMfa] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [quota, setQuota] = useState<FileQuota | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // Account deletion dialog state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setIsResendingVerification(true);
    try {
      await authApi.resendConfirmation(user.email);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to send verification email.'));
    } finally {
      setIsResendingVerification(false);
    }
  };

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordError(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!', {
        description: 'You have been logged out. Please sign in with your new password.',
      });
      setShowPasswordModal(false);
      resetPasswordForm();
      await logout();
      router.push('/login');
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Failed to change password. Please verify your current password.');
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const loadStorage = async () => {
    setStorageLoading(true);
    try {
      const [fileResult, quotaResult] = await Promise.allSettled([
        fileManagementApi.list(),
        fileManagementApi.getQuota(),
      ]);

      if (quotaResult.status === 'fulfilled' && quotaResult.value?.data) {
        setQuota(quotaResult.value.data);
        setStorageAvailable(true);
      } else {
        // Default clean state (100 MB quota limit, 0 used)
        setQuota({ used: 0, limit: 100 * 1024 * 1024, percentage: 0, files: 0 });
        setStorageAvailable(true);
      }

      if (fileResult.status === 'fulfilled' && Array.isArray(fileResult.value?.data)) {
        setFiles(fileResult.value.data);
      } else {
        setFiles([]);
      }
    } catch {
      setStorageAvailable(false);
    } finally {
      setStorageLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([emailPreferencesApi.get(), authApi.mfaFactors()])
      .then(([preferenceResponse, factorResponse]) => {
        setPreferences(preferenceResponse.data);
        setFactors(factorResponse.data.factors);
      })
      .catch(() => toast.error('Some account settings could not be loaded.'));

    let active = true;
    Promise.allSettled([fileManagementApi.list(), fileManagementApi.getQuota()])
      .then(([fileResult, quotaResult]) => {
        if (!active) return;
        if (quotaResult.status === 'fulfilled' && quotaResult.value?.data) {
          setQuota(quotaResult.value.data);
          setStorageAvailable(true);
        } else {
          setQuota({ used: 0, limit: 100 * 1024 * 1024, percentage: 0, files: 0 });
          setStorageAvailable(true);
        }
        if (fileResult.status === 'fulfilled' && Array.isArray(fileResult.value?.data)) {
          setFiles(fileResult.value.data);
        } else {
          setFiles([]);
        }
      })
      .catch(() => {
        if (active) setStorageAvailable(false);
      })
      .finally(() => {
        if (active) setStorageLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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

  const isTotpEnabled = factors.some((f) => f.type === 'totp');
  const totpFactor = factors.find((f) => f.type === 'totp') ?? factors[0];

  const disableMfa = async () => {
    const factor = totpFactor;
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
      toast.warning('No wallet detected', {
        description: 'Install MetaMask or another EVM-compatible wallet, then reload this page.',
      });
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
      reportFailure(error, 'connect your wallet', { fundsUnchanged: true });
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const disconnectWalletAddress = async () => {
    setIsDisconnectingWallet(true);
    try {
      await authApi.disconnectWallet();
      setWallet(null);
      if (user) setUser({ ...user, walletAddress: '' });
      toast.success('Wallet disconnected successfully.');
    } catch (error) {
      reportFailure(error, 'disconnect your wallet', { fundsUnchanged: true });
    } finally {
      setIsDisconnectingWallet(false);
    }
  };

  const deleteFile = async (file: FileInfo) => {
    if (!window.confirm(`Delete “${file.name}” from your storage?`)) return;
    setDeletingFile(file.path);
    try {
      await fileManagementApi.remove(file.bucket, file.path);
      setStorageLoading(true);
      await loadStorage();
      toast.success('File deleted.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete this file.'));
    } finally {
      setDeletingFile(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Please type DELETE to confirm account deletion.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const { data } = await authApi.deleteAccount();
      toast.success(data.message || 'Your account and personal data have been permanently deleted.');
      setShowDeleteModal(false);
      await logout();
      router.push('/');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete account.'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const hasWalletConnected = Boolean(wallet?.address || user?.walletAddress);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Account settings</h1>
        <p className="text-muted-foreground">Manage security, email delivery, and your payment wallet.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" /> Email address & verification
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="min-w-0 truncate font-medium text-foreground" title={user?.email}>{user?.email}</p>
              {user?.emailVerification ? (
                <Badge variant="secondary" className="bg-success-subtle text-success border border-success-border">
                  Verified email
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-warning-subtle text-warning border border-warning-border">
                  Unverified
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {user?.emailVerification
                ? 'Your email address is verified with Appwrite.'
                : 'Your email address is unverified. Click the button to send a verification link to your inbox.'}
            </p>
          </div>
          {!user?.emailVerification && (
            <Button
              variant="outline"
              disabled={isResendingVerification}
              onClick={handleResendVerification}
            >
              {isResendingVerification ? 'Sending…' : 'Resend verification email'}
            </Button>
          )}
        </CardContent>
      </Card>

      {user?.authProvider === 'oauth' ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-5" /> Password & Security
              </CardTitle>
              <CardDescription className="mt-1">
                You are signed in via social authentication (OAuth). Your password is managed securely by your identity provider.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="size-5" /> Password & Security
                </CardTitle>
                <CardDescription className="mt-1">
                  Change your password by confirming your current password. For security, you will be logged out once changed.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() => {
                  resetPasswordForm();
                  setShowPasswordModal(true);
                }}
              >
                Change password
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" /> Two-factor authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Authenticator protection</p>
                <Badge variant="secondary">{isTotpEnabled ? 'Enabled' : 'Not enabled'}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Require a one-time code from your authenticator app during sign in.</p>
            </div>
            {!isTotpEnabled && (
              <Button asChild>
                <Link href="/mfa/setup">Enable 2FA</Link>
              </Button>
            )}
          </div>
          {isTotpEnabled && totpFactor && (
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

      <TourSettingsCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5" /> Payment wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">
              {wallet
                ? formatWalletAddress(wallet.address)
                : user?.walletAddress
                  ? formatWalletAddress(user.walletAddress)
                  : 'No wallet connected'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {wallet
                ? `${wallet.balance} native tokens · ${wallet.networkName}`
                : 'Used to associate blockchain payments and escrow transactions with your account.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasWalletConnected && (
              <Button
                variant="outline"
                onClick={disconnectWalletAddress}
                disabled={isDisconnectingWallet || isConnectingWallet}
                className="text-destructive hover:bg-destructive/10"
              >
                <Unlink className="size-4 mr-1.5" />
                {isDisconnectingWallet ? 'Disconnecting…' : 'Disconnect wallet'}
              </Button>
            )}
            <Button onClick={connect} disabled={isConnectingWallet || isDisconnectingWallet}>
              {isConnectingWallet ? 'Connecting…' : hasWalletConnected ? 'Replace wallet' : 'Connect wallet'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="size-5" /> File storage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {storageLoading && (
            <p role="status" className="text-sm text-muted-foreground">
              Loading storage usage…
            </p>
          )}
          {!storageLoading && !storageAvailable && (
            <p className="text-sm text-muted-foreground">Storage information is temporarily unavailable.</p>
          )}
          {!storageLoading && storageAvailable && quota && (
            <>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span>
                    {formatFileSize(quota.used)} of {formatFileSize(quota.limit)} used
                  </span>
                  <span className="text-muted-foreground">
                    {quota.files} file{quota.files === 1 ? '' : 's'}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label="Storage used"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(quota.percentage)}
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, quota.percentage)}%` }}
                  />
                </div>
              </div>
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground">No proposal or portfolio files stored.</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {files.map((file) => {
                    const publicUrl = file.publicUrl ? safeAttachmentUrl(file.publicUrl) : null;
                    return (
                      <li key={`${file.bucket}:${file.path}`} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)} · {file.bucket.replaceAll('_', ' ')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {publicUrl && (
                            <Button asChild type="button" variant="ghost" size="icon">
                              <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open ${file.name}`}
                              >
                                <ExternalLink className="size-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${file.name}`}
                            disabled={deletingFile === file.path}
                            onClick={() => void deleteFile(file)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone: Account Deletion (GDPR / Data Privacy Compliance) */}
      {user?.role === 'freelancer' && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" /> Danger Zone: Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account, profiles, and associated personal records in compliance with data privacy regulations (GDPR Right to Erasure).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Irreversible Account Removal</p>
              <p className="text-xs text-muted-foreground">
                Once deleted, all your active sessions, profile details, and portfolio attachments will be permanently removed.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="size-4 mr-1.5" /> Delete Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Account Deletion Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5 text-destructive" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>
                Are you sure you want to delete your FreelanceXchain account? This action is <strong className="text-foreground">permanent and cannot be undone</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                All profile information, preferences, and authentication sessions will be immediately erased. Note that accounts with active smart contract escrows cannot be deleted until contracts are closed.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="delete-confirm-input" className="text-xs font-semibold">
              Type <span className="font-mono text-destructive">DELETE</span> to confirm:
            </Label>
            <Input
              id="delete-confirm-input"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeletingAccount}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteConfirmationText.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
              loading={isDeletingAccount}
              loadingText="Deleting account…"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="size-4 mr-1.5" />
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={showPasswordModal}
        onOpenChange={(open) => {
          if (!isChangingPassword) {
            setShowPasswordModal(open);
            if (!open) resetPasswordForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-5 text-primary" /> Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password followed by your new password. You will be logged out upon changing it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                {passwordError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isChangingPassword}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter at least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChangingPassword}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters and include uppercase, lowercase, and a number.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isChangingPassword}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  resetPasswordForm();
                }}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                loading={isChangingPassword}
                loadingText="Updating & logging out…"
              >
                Update password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
