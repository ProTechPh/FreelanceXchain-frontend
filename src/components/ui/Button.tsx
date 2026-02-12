import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glow' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className,
  fullWidth = false,
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 border border-transparent',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-dark-card dark:hover:bg-dark-border text-gray-900 dark:text-white border border-gray-300 dark:border-dark-border hover:border-gray-400 dark:hover:border-gray-500 shadow-sm',
    outline: 'bg-white dark:bg-transparent border-2 border-gray-300 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500/50 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-white hover:bg-primary-50 dark:hover:bg-white/5 shadow-sm',
    ghost: 'hover:bg-gray-200 dark:hover:bg-white/5 text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/20',
    glow: 'bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/30 dark:to-indigo-900/30 border-2 border-primary-400 dark:border-primary-500/50 text-primary-700 dark:text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/50 hover:border-primary-500 dark:hover:border-primary-400',
    glass: 'bg-white/80 hover:bg-white/90 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 backdrop-blur-md shadow-lg',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-8 py-3.5 text-base gap-2.5',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {/* Shimmer effect on hover */}
      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      )}
      
      <span className="relative z-10 flex items-center gap-2">
        {loading && (
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 text-currentColor"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </motion.svg>
        )}
        {children}
      </span>
    </motion.button>
  );
}
