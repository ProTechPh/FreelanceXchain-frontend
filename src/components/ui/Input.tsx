import type { InputHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'minimal';
  inputSize?: 'sm' | 'md' | 'lg';
}

export function Input({
  label,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  className,
  fullWidth = true,
  disabled,
  required,
  variant = 'default',
  inputSize = 'md',
  ...props
}: InputProps) {
  const sizes = {
    sm: 'h-10 px-3 text-sm',
    md: 'h-12 px-4 text-base',
    lg: 'h-14 px-5 text-lg',
  };

  const variants = {
    default: 'bg-dark-surface border border-dark-border hover:border-gray-500',
    filled: 'bg-white/5 border border-transparent hover:bg-white/10',
    minimal: 'bg-transparent border-b border-dark-border hover:border-gray-500 rounded-none px-0',
  };

  const hasError = !!error;
  const hasSuccess = !!success;
  const showStatusIcon = hasError || hasSuccess;

  return (
    <div className={clsx('flex flex-col gap-2', fullWidth && 'w-full', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-200">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          disabled={disabled}
          required={required}
          className={clsx(
            'w-full rounded-xl transition-all duration-200',
            'text-white placeholder:text-gray-500',
            'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            sizes[inputSize],
            variants[variant],
            leftIcon && 'pl-10',
            (rightIcon || showStatusIcon) && 'pr-10',
            hasError && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
            hasSuccess && 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20'
          )}
          {...props}
        />
        
        {/* Status Icon or Right Icon */}
        {showStatusIcon ? (
          <div className={clsx(
            'absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none',
            hasError && 'text-red-400',
            hasSuccess && 'text-green-400'
          )}>
            {hasError ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
        ) : rightIcon ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-400 pointer-events-none">
            {rightIcon}
          </div>
        ) : null}
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
            <span className="text-gray-400">{helperText}</span>
          )}
        </motion.div>
      )}
    </div>
  );
}
