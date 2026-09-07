'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ValidatedFieldProps {
  error?: string;
  hint?: string;
  required?: boolean;
  label?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

/** Field wrapper providing consistent validation UX - validates on blur (not onChange). */
export function ValidatedField({
  error, hint, required, label, id, children, className,
}: ValidatedFieldProps) {
  const hasError = Boolean(error);
  const inputId = id ?? (label?.toLowerCase().replace(/\s+/g, '-'));
  const descriptionId = hint || error ? `${inputId}-description` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
              id: inputId,
              'aria-invalid': hasError || undefined,
              'aria-describedby': descriptionId,
              'aria-required': required || undefined,
              required,
            });
          }
          return child;
        })}
      </div>
      {(hint || error) && (
        <p id={descriptionId} className={cn('text-xs', hasError ? 'text-destructive' : 'text-muted-foreground')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

/** Hook for blur-triggered validation pattern. */
export function useBlurValidation<T extends Record<string, string>>(config: {
  validators: Partial<Record<keyof T, (value: string) => string>>;
  setErrors: (errors: Partial<T>) => void;
}) {
  const touchedRef = React.useRef(new Set<keyof T>());

  const handleBlur = React.useCallback(
    (fieldName: keyof T, value: string) => {
      touchedRef.current.add(fieldName);
      const validator = config.validators?.[fieldName];
      if (validator) {
        const error = validator(value);
        config.setErrors({ [fieldName]: error } as Partial<T>);
      }
    },
    [config]
  );

  const isFieldTouched = React.useCallback((fieldName: keyof T) => touchedRef.current.has(fieldName), []);

  return { handleBlur, isFieldTouched };
}

/** Common validation patterns for reuse across forms. */
export const validators = {
  email: (value: string): string => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
    return '';
  },
  required: (fieldName: string) => (value: string): string => (!value.trim() ? `${fieldName} is required` : ''),
  minLength: (min: number) => (value: string): string => (value.length < min ? `Must be at least ${min} characters` : ''),
  maxLength: (max: number) => (value: string): string => (value.length > max ? `Must be no more than ${max} characters` : ''),
  password: (value: string): string => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter';
    if (!/[a-z]/.test(value)) return 'Include at least one lowercase letter';
    if (!/[0-9]/.test(value)) return 'Include at least one number';
    return '';
  },
  compose: (...validators: Array<(value: string) => string>) => (value: string): string => {
    for (const validate of validators) {
      const error = validate(value);
      if (error) return error;
    }
    return '';
  },
};