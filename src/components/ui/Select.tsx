import type { SelectHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'minimal';
  children: ReactNode;
}

export function Select({
  label,
  error,
  success,
  helperText,
  leftIcon,
  className,
  fullWidth = true,
  disabled,
  required,
  variant = 'default',
  children,
  ...props
}: SelectProps) {
  const variants = {
    default: 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 hover:border-gray-500',
    filled: 'bg-gray-100 dark:bg-white/5 border border-transparent hover:bg-gray-200 dark:hover:bg-white/10',
    minimal: 'bg-transparent border-b border-gray-200 dark:border-white/10 hover:border-gray-500 rounded-none px-0',
  };

  const hasError = !!error;
  const hasSuccess = !!success;
  const showStatusIcon = hasError || hasSuccess;

  return (
    <div className={clsx('flex flex-col gap-2', fullWidth && 'w-full', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 transition-colors group-focus-within:text-primary-400 pointer-events-none z-10">
            {leftIcon}
          </div>
        )}
        
        <select
          disabled={disabled}
          required={required}
          className={clsx(
            'w-full h-12 rounded-xl px-4 transition-all duration-200 appearance-none cursor-pointer',
            'text-gray-900 dark:text-white',
            'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            variants[variant],
            leftIcon && 'pl-10',
            'pr-10',
            hasError && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
            hasSuccess && 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20'
          )}
          {...props}
        >
          {children}
        </select>
        
        {/* Chevron or Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
          {showStatusIcon && (
            <div className={clsx(
              hasError && 'text-red-400',
              hasSuccess && 'text-green-400'
            )}>
              {hasError ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
          )}
          <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400 group-focus-within:text-primary-400 transition-colors" />
        </div>
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
