'use client';

import * as React from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InputWithCountProps extends Omit<InputProps, 'maxLength'> {
  /** Maximum character count. When set, displays a counter. */
  maxLength?: number;
  /** Whether to show character count. Defaults to true when maxLength is set. */
  showCount?: boolean;
}

/**
 * Input component with visible character count.
 *
 * Shows a right-aligned character counter that changes color
 * as the user approaches the limit (warning at 90%, error at 100%).
 * This helps users understand input constraints before validation fails.
 *
 * @example
 * ```tsx
 * <InputWithCount
 *   maxLength={100}
 *   placeholder="Enter title…"
 * />
 * ```
 */
export const InputWithCount = React.forwardRef<HTMLInputElement, InputWithCountProps>(
  ({ maxLength, showCount = true, value, defaultValue, onChange, className, ...props }, ref) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue?.toString() ?? '');

    const currentValue = isControlled ? value.toString() : internalValue;
    const length = currentValue.length;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    // Determine count color based on usage
    const getCountColor = () => {
      if (!maxLength) return 'text-muted-foreground';
      const ratio = length / maxLength;
      if (ratio >= 1) return 'text-destructive';
      if (ratio >= 0.9) return 'text-amber-500';
      return 'text-muted-foreground';
    };

    const shouldShowCount = showCount && maxLength;

    return (
      <div className="relative">
        <Input
          ref={ref}
          value={isControlled ? value : internalValue}
          onChange={handleChange}
          maxLength={maxLength}
          className={className}
          {...props}
        />
        {shouldShowCount && (
          <div className="flex justify-end mt-1">
            <span
              className={cn('text-xs tabular-nums', getCountColor())}
              aria-live="polite"
            >
              {length}/{maxLength}
            </span>
          </div>
        )}
      </div>
    );
  }
);

InputWithCount.displayName = 'InputWithCount';