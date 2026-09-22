'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  navigable?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: { circle: 'size-6', icon: 'size-3', text: 'text-xs', gap: 'gap-2' },
  default: { circle: 'size-8', icon: 'size-4', text: 'text-sm', gap: 'gap-3' },
  lg: { circle: 'size-10', icon: 'size-5', text: 'text-base', gap: 'gap-4' },
};

/**
 * Progress indicator for multi-step flows.
 * Shows current position, completed steps, and upcoming steps.
 */
export function Stepper({
  steps,
  currentStep,
  onStepClick,
  navigable = false,
  orientation = 'horizontal',
  size = 'default',
  className,
}: StepperProps) {
  const classes = sizeClasses[size];

  const getStepStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <nav aria-label="Progress" className={cn(className, orientation === 'horizontal' ? 'flex items-center' : 'flex flex-col')}>
      <ol className={cn('flex', orientation === 'horizontal' ? 'flex-row items-center gap-0' : 'flex-col gap-4')} role="list">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isClickable = navigable && status !== 'current';

          return (
            <li key={step.id} className={cn('flex', orientation === 'horizontal' && index < steps.length - 1 && 'flex-1')}>
              <button
                type="button"
                onClick={() => navigable && onStepClick && onStepClick(index)}
                disabled={!isClickable}
                className={cn('group flex items-center', classes.gap, 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', isClickable ? 'cursor-pointer' : 'cursor-default')}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                {/* Circle */}
                <div className={cn('flex shrink-0 items-center justify-center rounded-full border-2 transition-colors', classes.circle,
                  status === 'completed' && 'border-primary bg-primary text-primary-foreground',
                  status === 'current' && 'border-primary bg-background text-primary',
                  status === 'upcoming' && 'border-muted-foreground/30 bg-background text-muted-foreground'
                )} aria-hidden="true">
                  {status === 'completed' ? <Check className={cn('stroke-[3]', classes.icon)} /> : <span className={cn('font-semibold', classes.text)}>{index + 1}</span>}
                </div>
                {/* Label */}
                <div className="flex flex-col items-start">
                  <span className={cn('font-medium', classes.text, status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground')}>{step.label}</span>
                  {step.description && orientation === 'vertical' && <span className="text-xs text-muted-foreground">{step.description}</span>}
                </div>
              </button>
              {/* Connector line */}
              {orientation === 'horizontal' && index < steps.length - 1 && (
                <div className={cn('mx-3 h-0.5 flex-1 transition-colors', status === 'completed' ? 'bg-primary' : 'bg-muted-foreground/30')} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Simple horizontal step indicator for forms. Shows step dots without labels. */
export function StepIndicator({ steps, currentStep, className }: { steps: number; currentStep: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)} role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps} aria-label={`Step ${currentStep + 1} of ${steps}`}>
      {Array.from({ length: steps }).map((_, index) => (
        <div key={index} className={cn('h-1.5 rounded-full transition-all duration-200', index < currentStep && 'w-6 bg-primary', index === currentStep && 'w-8 bg-primary', index > currentStep && 'w-6 bg-muted-foreground/30')} aria-hidden="true" />
      ))}
    </div>
  );
}

// StepperProps and Step are already exported at the top of this file.

