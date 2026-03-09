import type { TextareaHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'minimal';
  showCharCount?: boolean;
  maxLength?: number;
}

export function Textarea({
  label,
  error,
  success,
  helperText,
  className,
  fullWidth = true,
  disabled,
  required,
  variant = 'default',
  showCharCount = false,
  maxLength,
  value,
  ...props
}: TextareaProps) {
  const variants = {
    default: 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 hover:border-gray-500',
    filled: 'bg-gray-100 dark:bg-white/5 border border-transparent hover:bg-gray-200 dark:hover:bg-white/10',
    minimal: 'bg-transparent border-b border-gray-200 dark:border-white/10 hover:border-gray-500 rounded-none px-0',
  };

  const hasError = !!error;
  const hasSuccess = !!success;
  const charCount = typeof value === 'string' ? value.length : 0;

  return (
    <div className={clsx('flex flex-col gap-2', fullWidth && 'w-full', className)}>
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        {showCharCount && maxLength && (
          <span className={clsx(
            'text-xs',
            charCount > maxLength ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'
          )}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
      
      <div className="relative group">
        <textarea
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          className={clsx(
            'w-full rounded-xl px-4 py-3 transition-all duration-200 resize-none',
            'text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            variants[variant],
            hasError && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
            hasSuccess && 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20'
          )}
          {...props}
        />
        
        {/* Status Icon */}
        {(hasError || hasSuccess) && (
          <div className={clsx(
            'absolute right-3 top-3 pointer-events-none',
            hasError && 'text-red-400',
            hasSuccess && 'text-green-400'
          )}>
            {hasError ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
        )}
      </div>
      
      {/* Helper/Error/Success Text */}
      {(error || success || helperText) && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm flex items-start gap-1.5"
        >
          {error && (
            <>
              <span className="inline-block w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
              <span className="text-red-400">{error}</span>
            </>
          )}
          {success && !error && (
            <>
              <span className="inline-block w-1 h-1 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
              <span className="text-green-400">{success}</span>
            </>
          )}
          {helperText && !error && !success && (
            <span className="text-gray-600 dark:text-gray-400">{helperText}</span>
          )}
        </motion.div>
      )}
    </div>
  );
}
