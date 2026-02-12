import type { InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

export function Checkbox({
  label,
  description,
  error,
  className,
  disabled,
  checked,
  ...props
}: CheckboxProps) {
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <label className={clsx(
        'flex items-start gap-3 cursor-pointer group',
        disabled && 'cursor-not-allowed opacity-50'
      )}>
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            disabled={disabled}
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <div className={clsx(
            'w-5 h-5 rounded-md border-2 transition-all duration-200',
            'peer-focus:ring-2 peer-focus:ring-primary-500/20',
            'group-hover:border-primary-400',
            checked
              ? 'bg-primary-600 border-primary-600'
              : 'bg-white dark:bg-dark-surface border-gray-300 dark:border-white/20',
            error && 'border-red-500'
          )}>
            <motion.div
              initial={false}
              animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </motion.div>
          </div>
        </div>
        
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 block">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-gray-600 dark:text-gray-400 block mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
      
      {error && (
        <motion.span
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 ml-8"
        >
          {error}
        </motion.span>
      )}
    </div>
  );
}
