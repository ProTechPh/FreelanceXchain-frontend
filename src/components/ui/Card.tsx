import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  variant?: 'default' | 'glass' | 'neon';
  onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
}

export function Card({
  children,
  className,
  padding = 'md',
  hover = false,
  variant = 'glass',
  onClick
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-300 relative overflow-hidden';

  const variants = {
    default: 'bg-white dark:bg-dark-card border-2 border-gray-300 dark:border-dark-border shadow-md',
    glass: 'glass-card text-gray-900 dark:text-white shadow-lg',
    neon: 'bg-white dark:bg-dark-bg border-2 border-primary-400 dark:border-primary-500/30 shadow-lg shadow-primary-500/20 dark:shadow-[0_0_15px_rgba(139,92,246,0.15)]',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const CardComponent = hover ? motion.div : 'div';
  const hoverProps = hover ? {
    whileHover: { y: -4, scale: 1.01 },
    transition: { duration: 0.3 }
  } : {};

  return (
    <CardComponent
      onClick={onClick}
      className={clsx(
        baseStyles,
        variants[variant],
        paddings[padding],
        hover && 'cursor-pointer hover:shadow-2xl hover:shadow-primary-500/30 dark:hover:shadow-primary-900/20 hover:border-primary-400 dark:hover:border-primary-500/30',
        className
      )}
      {...hoverProps}
    >
      {/* Subtle gradient overlay for extra depth */}
      {variant === 'glass' && (
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </CardComponent>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
