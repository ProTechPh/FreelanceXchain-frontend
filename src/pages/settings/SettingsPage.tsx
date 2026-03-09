import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Moon,
  Sun,
  Trash2,
  LogOut,
  Shield,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  Wallet,
  ExternalLink,
  Copy,
  CheckCircle,
  History
} from 'lucide-react';
import { Card, CardHeader, Button, Input, Modal } from '../../components/ui';
import { useAuthStore, useThemeStore, useWalletStore } from '../../store';
import { useToast } from '../../contexts/ToastContext';
import { TutorialLauncher } from '../../features/onboarding/components/TutorialLauncher';
import { MfaStatusCard } from '../../features/mfa/components/MfaStatusCard';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const { address, isConnected, balance, chainId, connect, disconnect } = useWalletStore();
  const { showToast } = useToast();

  // Copy wallet address
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      showToast({
        type: 'success',
        title: 'Copied',
        message: 'Wallet address copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connect();
      showToast({
        type: 'success',
        title: 'Wallet Connected',
        message: 'Your wallet has been connected successfully',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Connection Failed',
        message: error.message || 'Failed to connect wallet',
      });
    }
  };

  const handleDisconnectWallet = () => {
    disconnect();
    showToast({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Your wallet has been disconnected',
    });
  };

  // Notification Settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    proposalReceived: true,
    proposalAccepted: true,
    milestoneCompleted: true,
    paymentReleased: true,
    disputeCreated: true,
    messages: true,
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public' as 'public' | 'private',
    showEmail: false,
    showWallet: false,
  });

  // Password Change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSaveNotifications = () => {
    // TODO: Save to backend
    showToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Notification preferences saved successfully',
    });
  };

  const handleSavePrivacy = () => {
    // TODO: Save to backend
    showToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Privacy settings saved successfully',
    });
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast({
        type: 'error',
        title: 'Password Mismatch',
        message: 'Passwords do not match',
      });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast({
        type: 'error',
        title: 'Invalid Password',
        message: 'Password must be at least 8 characters',
      });
      return;
    }
    // TODO: Call API to change password
    showToast({
      type: 'success',
      title: 'Password Changed',
      message: 'Password changed successfully',
    });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleDeleteAccount = () => {
    // TODO: Call API to delete account
    showToast({
      type: 'success',
      title: 'Account Deleted',
      message: 'Your account has been deleted',
    });
    logout();
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account preferences and settings</p>
      </div>

      <Card>
        <CardHeader
          title="Onboarding Tutorial"
          description="Replay the guided tutorial walkthrough at any time"
        />
        <TutorialLauncher className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors" />
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader
          title="Account Information"
          description="Your account details"
        />
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{user?.email}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
          {/* Wallet Address - Hide for admin */}
          {user?.role !== 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Wallet Address</label>
              {isConnected && address ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-primary-500/30 rounded-lg">
                  <Wallet className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white font-mono text-sm truncate flex-1">
                    {address}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1.5 hover:bg-white/5 rounded transition-colors flex-shrink-0"
                    title="Copy address"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400 hover:text-gray-900 dark:hover:text-white" />
                    )}
                  </button>
                  <a
                    href={`https://etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-white/5 rounded transition-colors flex-shrink-0"
                    title="View on Etherscan"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-900 dark:hover:text-white" />
                  </a>
                </div>
                
                {/* Wallet Info */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Balance</p>
                    <p className="text-gray-900 dark:text-white font-medium">{balance || '0.0000'} ETH</p>
                  </div>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Network</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {chainId === 1 ? 'Ethereum Mainnet' : 
                       chainId === 11155111 ? 'Sepolia Testnet' :
                       chainId === 31337 ? 'Localhost' :
                       `Chain ID: ${chainId}`}
                    </p>
                  </div>
                </div>

                {/* Disconnect Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDisconnectWallet}
                  className="w-full"
                >
                  Disconnect Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg">
                  <Smartphone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Not connected</span>
                </div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleConnectWallet}
                  className="w-full"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
                <p className="text-xs text-gray-500">
                  Connect your MetaMask wallet to interact with smart contracts and manage payments.
                </p>
              </div>
            )}
          </div>
          )}
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader
          title="Appearance"
          description="Customize how the app looks"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-gray-400" />}
            <div>
              <p className="text-gray-900 dark:text-white font-medium">Theme</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {isDark ? 'Dark mode' : 'Light mode'}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={toggleTheme}>
            {isDark ? 'Switch to Light' : 'Switch to Dark'}
          </Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader
          title="Notifications"
          description="Manage how you receive notifications"
        />
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-dark-border">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Email Notifications</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Receive notifications via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-dark-border">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Push Notifications</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Receive push notifications in browser</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="pt-3 space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notify me about:</p>
            {[
              { key: 'proposalReceived', label: 'New proposals received' },
              { key: 'proposalAccepted', label: 'Proposal accepted' },
              { key: 'milestoneCompleted', label: 'Milestone completed' },
              { key: 'paymentReleased', label: 'Payment released' },
              { key: 'disputeCreated', label: 'Dispute created' },
              { key: 'messages', label: 'New messages' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[key as keyof typeof notifications] as boolean}
                  onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-primary-500 focus:ring-primary-500"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="pt-4">
            <Button onClick={handleSaveNotifications}>Save Notification Preferences</Button>
          </div>
        </div>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader
          title="Privacy"
          description="Control your privacy settings"
        />
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profile Visibility
            </label>
            <select
              value={privacy.profileVisibility}
              onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value as 'public' | 'private' })}
              className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
            >
              <option value="public">Public - Anyone can view your profile</option>
              <option value="private">Private - Only verified users can view</option>
            </select>
          </div>

          <label className="flex items-center gap-3 text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={privacy.showEmail}
              onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-primary-500 focus:ring-primary-500"
            />
            Show email address on profile
          </label>

          <label className="flex items-center gap-3 text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={privacy.showWallet}
              onChange={(e) => setPrivacy({ ...privacy, showWallet: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-primary-500 focus:ring-primary-500"
            />
            Show wallet address on profile
          </label>

          <div className="pt-4">
            <Button onClick={handleSavePrivacy}>Save Privacy Settings</Button>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader
          title="Security"
          description="Manage your password and security settings"
        />
        <div className="space-y-4">
          {/* Activity Log Link */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-300 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Activity Log</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">View your account activity and security events</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/settings/activity')}>
              View Log
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleChangePassword}>Change Password</Button>
          </div>

          {/* MFA */}
          <div className="border-t border-gray-200 dark:border-dark-border pt-5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">MFA</p>
            <MfaStatusCard />
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/30">
        <CardHeader
          title="Danger Zone"
          description="Irreversible actions"
        />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/30">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Log Out</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Sign out of your account</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowLogoutModal(true)}>
              Log Out
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/30">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Delete Account</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Permanently delete your account and all data</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowDeleteModal(true)}>
              Delete Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Are you sure you want to log out?</p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogout}>
              Log Out
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Deleting your account will permanently remove:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-sm mt-2 space-y-1">
              <li>Your profile and all personal information</li>
              <li>All projects and proposals</li>
              <li>Contract history</li>
              <li>Messages and notifications</li>
            </ul>
          </div>
          <p className="text-gray-700 dark:text-gray-300">Type <span className="font-mono text-gray-900 dark:text-white">DELETE</span> to confirm:</p>
          <Input
            placeholder="Type DELETE to confirm"
            onChange={() => {
              // Simple confirmation check
            }}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleDeleteAccount}>
              Delete My Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
