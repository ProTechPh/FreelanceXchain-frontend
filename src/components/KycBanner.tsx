import { motion } from 'framer-motion';
import { AlertTriangle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKycStatus } from '../hooks/useKycGuard';
import { Button } from './ui';

export function KycBanner() {
  const { isKycApproved, kycStatus, needsSubmission } = useKycStatus();
  const navigate = useNavigate();

  // Don't show banner if KYC is approved
  if (isKycApproved) return null;

  const bannerConfig = {
    pending: {
      icon: Clock,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      title: 'KYC Verification Pending',
      message: 'Your KYC verification is being reviewed. This usually takes 24-48 hours.',
      buttonText: 'View Status',
      buttonVariant: 'secondary' as const,
    },
    submitted: {
      icon: Clock,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      title: 'KYC Verification Submitted',
      message: 'Your KYC documents have been submitted and are awaiting review.',
      buttonText: 'View Status',
      buttonVariant: 'secondary' as const,
    },
    under_review: {
      icon: Clock,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      title: 'KYC Under Review',
      message: 'Our team is currently reviewing your KYC documents.',
      buttonText: 'View Status',
      buttonVariant: 'secondary' as const,
    },
    rejected: {
      icon: XCircle,
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      title: 'KYC Verification Rejected',
      message: 'Your KYC verification was rejected. Please review the feedback and resubmit.',
      buttonText: 'Resubmit KYC',
      buttonVariant: 'primary' as const,
    },
    default: {
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      title: 'KYC Verification Required',
      message: 'Complete KYC verification to unlock all features including projects, proposals, and payments.',
      buttonText: 'Start KYC Verification',
      buttonVariant: 'glow' as const,
    },
  };

  const config = kycStatus && kycStatus in bannerConfig 
    ? bannerConfig[kycStatus as keyof typeof bannerConfig]
    : bannerConfig.default;

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.bgColor} ${config.borderColor} border rounded-xl p-6 backdrop-blur-xl mb-6`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${config.bgColor} ${config.borderColor} border`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-1">{config.title}</h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">{config.message}</p>
          
          {!isKycApproved && (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={config.buttonVariant}
                size="sm"
                onClick={() => navigate('/kyc')}
              >
                {config.buttonText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              {needsSubmission && (
                <p className="text-xs text-gray-400">
                  Required for: Projects • Proposals • Contracts • Payments
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
