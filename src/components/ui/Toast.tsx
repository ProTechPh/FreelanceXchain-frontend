import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ToastType } from '../../contexts/ToastContext';

interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  showProgress?: boolean;
  onClose: () => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: {
    bg: 'bg-green-500/10 border-green-500/30',
    icon: 'text-green-400',
    progress: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-500/10 border-red-500/30',
    icon: 'text-red-400',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: 'text-amber-400',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    icon: 'text-blue-400',
    progress: 'bg-blue-500',
  },
};

export function Toast({
  type,
  title,
  message,
  duration = 5000,
  action,
  showProgress = true,
  onClose,
}: ToastProps) {
  const [progress, setProgress] = useState(100);
  const Icon = icons[type];
  const style = styles[type];

  useEffect(() => {
    if (!showProgress || duration <= 0) return;

    const interval = 50;
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement;
        return next <= 0 ? 0 : next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, showProgress]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative pointer-events-auto backdrop-blur-xl border rounded-xl shadow-2xl overflow-hidden ${style.bg}`}
    >
      <div className="p-4 pr-12">
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} />
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
            )}
            <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
            {action && (
              <button
                onClick={action.onClick}
                className="mt-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
              >
                {action.label}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      {showProgress && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
          <motion.div
            className={`h-full ${style.progress}`}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
}
