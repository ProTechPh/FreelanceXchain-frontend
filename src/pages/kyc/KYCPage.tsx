import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ExternalLink,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, PageLoader, Button } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';
import type { KycVerification } from '../../types';

export function KYCPage() {
  const [kycData, setKycData] = useState<KycVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<string | null>(null);
  const [cooldownHours, setCooldownHours] = useState<number>(0);
  const { showToast } = useToast();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const POLLING_INTERVAL = 15000; // 15 seconds
  const MAX_POLLING_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    fetchKycStatus();

    // Auto-refresh status when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden && kycData && (kycData.status === 'pending' || kycData.status === 'in_progress')) {
        fetchKycStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup polling and event listener on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Calculate cooldown hours from retryAfter timestamp
  useEffect(() => {
    if (!retryAfter) {
      setCooldownHours(0);
      return;
    }

    const calculateCooldown = () => {
      const now = new Date();
      const retryTime = new Date(retryAfter);
      const hoursRemaining = Math.max(0, Math.ceil((retryTime.getTime() - now.getTime()) / (1000 * 60 * 60)));
      setCooldownHours(hoursRemaining);

      if (hoursRemaining === 0) {
        setRetryAfter(null);
      }
    };

    calculateCooldown();
    const interval = setInterval(calculateCooldown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [retryAfter]);

  const fetchKycStatus = async () => {
    try {
      const data = await api.getKycStatus();
      setKycData(data);
      
      // Stop polling if verification is complete or approved
      if (data && (data.status === 'approved' || data.status === 'rejected')) {
        stopPolling();
      }
    } catch (error) {
      // KYC not submitted yet
      console.log('KYC not submitted yet');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    setIsPolling(true);
    pollingStartTimeRef.current = Date.now();
    
    // Poll every 15 seconds (webhook handles real updates)
    pollingIntervalRef.current = setInterval(() => {
      // Stop polling after 5 minutes (assume webhook handled it)
      if (pollingStartTimeRef.current && Date.now() - pollingStartTimeRef.current > MAX_POLLING_DURATION) {
        stopPolling();
        showToast({
          type: 'info',
          title: 'Polling Stopped',
          message: 'Status will be updated automatically. Refresh the page to check manually.',
        });
        return;
      }
      
      fetchKycStatus();
    }, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const openInNewTab = (url: string) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Popup was blocked
      setPopupBlocked(true);
      setSessionUrl(url);
      showToast({
        type: 'warning',
        title: 'Popup Blocked',
        message: 'Please allow popups for this site or use the manual link below',
      });
    } else {
      setPopupBlocked(false);
      startPolling();
      showToast({
        type: 'info',
        title: 'Verification Opened',
        message: 'Complete the verification in the new tab. This page will update automatically.',
      });
    }
  };

  const handleInitiateVerification = async () => {
    setInitiating(true);
    try {
      const result = await api.initiateKycVerification();

      showToast({
        type: 'success',
        title: 'Verification Session Created',
        message: 'Opening Didit verification in new tab...',
      });

      // Clear any previous cooldown
      setRetryAfter(null);
      setCooldownHours(0);

      // Open in new tab instead of redirecting
      openInNewTab(result.didit_session_url);
    } catch (error: any) {
      console.error('Error initiating KYC:', error);

      // Handle cooldown error
      if (error.message && error.message.includes('wait') && error.message.includes('hour')) {
        // Extract retryAfter from error if available
        const match = error.message.match(/(\d+)\s+hour/);
        if (match) {
          const hours = parseInt(match[1]);
          const retryTime = new Date(Date.now() + hours * 60 * 60 * 1000);
          setRetryAfter(retryTime.toISOString());
          setCooldownHours(hours);
        }

        showToast({
          type: 'warning',
          title: 'Cooldown Active',
          message: error.message,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Failed to Start Verification',
          message: error instanceof Error ? error.message : 'Please try again later',
        });
      }
    } finally {
      setInitiating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'pending':
      case 'in_progress':
        return <Clock className="w-8 h-8 text-yellow-400" />;
      case 'completed':
        return <FileCheck className="w-8 h-8 text-blue-400" />;
      case 'rejected':
        return <XCircle className="w-8 h-8 text-red-400" />;
      case 'expired':
        return <AlertTriangle className="w-8 h-8 text-orange-400" />;
      default:
        return <Shield className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 border-green-500/30';
      case 'pending':
      case 'in_progress':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'completed':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'rejected':
        return 'bg-red-500/10 border-red-500/30';
      case 'expired':
        return 'bg-orange-500/10 border-orange-500/30';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Verification Approved';
      case 'pending':
        return 'Verification Pending';
      case 'in_progress':
        return 'Verification In Progress';
      case 'completed':
        return 'Verification Completed';
      case 'rejected':
        return 'Verification Rejected';
      case 'expired':
        return 'Verification Expired';
      default:
        return 'Verification Status';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Your identity has been verified. You have full access to all platform features.';
      case 'pending':
        return 'Your verification session has been created. Please complete the verification process.';
      case 'in_progress':
        return 'You have started the verification process. Please complete all required steps.';
      case 'completed':
        return 'Your verification is complete and awaiting admin review. This usually takes 24-48 hours.';
      case 'rejected':
        return 'Your verification was rejected. Please review the feedback and try again.';
      case 'expired':
        return 'Your verification session has expired. Please start a new verification.';
      default:
        return 'Unknown status';
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  // KYC Already Submitted - Show Status
  if (kycData) {
    const canContinue = kycData.status === 'in_progress';
    const canRetry = kycData.status === 'pending' || kycData.status === 'rejected' || kycData.status === 'expired';
    const isInCooldown = cooldownHours > 0;

    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">KYC Verification</h1>
          <p className="text-gray-600 dark:text-gray-400">Your identity verification status</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card data-tour-id="kyc-start-card" className={`border-2 ${getStatusColor(kycData.status)}`}>
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center mb-6"
              >
                {getStatusIcon(kycData.status)}
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {getStatusTitle(kycData.status)}
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto mb-6">
                {getStatusMessage(kycData.status)}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {canContinue && kycData.didit_session_url && (
                  <>
                    <Button
                      variant="glow"
                      onClick={() => openInNewTab(kycData.didit_session_url!)}
                    >
                      Continue Verification
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>

                    {isPolling && (
                      <Button
                        variant="secondary"
                        onClick={fetchKycStatus}
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Check Status Now
                      </Button>
                    )}
                  </>
                )}

                {canRetry && (
                  <>
                    <Button
                      variant="primary"
                      onClick={handleInitiateVerification}
                      disabled={initiating || isInCooldown}
                      loading={initiating}
                    >
                      {isInCooldown ? (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Retry in {cooldownHours}h
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {kycData.status === 'pending' ? 'Retry Verification' : 'Start New Verification'}
                        </>
                      )}
                    </Button>

                    {isInCooldown && (
                      <p className="text-sm text-gray-400 w-full text-center mt-2">
                        You can retry verification in {cooldownHours} hour{cooldownHours !== 1 ? 's' : ''}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Popup blocked fallback */}
              {popupBlocked && sessionUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
                >
                  <p className="text-yellow-400 text-sm mb-3">
                    Popup was blocked. Click the link below to open verification manually:
                  </p>
                  <a
                    href={sessionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      startPolling();
                      setPopupBlocked(false);
                    }}
                    className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 underline text-sm"
                  >
                    Open Didit Verification
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </motion.div>
              )}

              {/* Polling indicator */}
              {isPolling && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-400"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                  <span className="text-gray-600 dark:text-gray-400">Checking status every 15 seconds (webhook will update automatically)...</span>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Verification Details */}
        {kycData.status === 'approved' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader title="Verification Details" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                    <p className="text-gray-900 dark:text-white font-medium capitalize">{kycData.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Verified On</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {kycData.completed_at ? new Date(kycData.completed_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-green-400 font-medium">Account Fully Verified</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">You have access to all platform features</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Rejection Reason */}
        {kycData.status === 'rejected' && kycData.admin_notes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-red-500/50">
              <CardHeader title="Rejection Reason" />
              <p className="text-red-400 mb-4">{kycData.admin_notes}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please address the issues mentioned above and start a new verification.
              </p>
            </Card>
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-primary-900/20 border-primary-500/30">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-primary-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Powered by Didit</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Your verification is processed securely by Didit, a trusted identity verification provider.
                  All your personal data is encrypted and handled according to industry standards.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // No KYC - Show Start Verification
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-primary-500/30"
        >
          <Shield className="w-12 h-12 text-white" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Identity Verification</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Complete KYC verification to unlock all platform features
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card data-tour-id="kyc-start-card">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Why Verify Your Identity?</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">Full Access</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create projects, submit proposals, and manage contracts
                </p>
              </div>
              
              <div className="p-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">Trust & Safety</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Build trust with verified identity and secure transactions
                </p>
              </div>
              
              <div className="p-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <FileCheck className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">Compliance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Meet regulatory requirements for blockchain transactions
                </p>
              </div>
            </div>

            <Button
              variant="glow"
              size="lg"
              onClick={handleInitiateVerification}
              disabled={initiating}
              loading={initiating}
            >
              {initiating ? 'Creating Session...' : 'Start Verification'}
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-dark-surface/50">
          <CardHeader title="What You'll Need" />
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">Government-issued ID (Passport, Driver's License, or National ID)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">Clear photos of your document (front and back)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">Selfie for identity verification</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">5-10 minutes to complete the process</span>
            </li>
          </ul>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-primary-900/20 border-primary-500/30">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-primary-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Your Data is Secure</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                We use Didit, a trusted identity verification provider, to process your verification securely.
                Your personal information is encrypted and protected according to industry standards.
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                By continuing, you agree to share your identity information with Didit for verification purposes.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
