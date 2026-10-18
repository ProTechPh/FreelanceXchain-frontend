'use client';

import type { ContractStatus } from '@/types';
import { Stepper } from '@/components/ui/stepper';
import { Card, CardContent } from '@/components/ui/card';
import { LIFECYCLE_STEPS, getLifecycleStepIndex } from '@/lib/contract-lifecycle';

/** Negotiate → Sign → Fund → Work → Complete progress for the contract workspace. */
export function ContractLifecycleStepper({ status }: { status: ContractStatus }) {
  const index = getLifecycleStepIndex(status);
  if (index < 0) return null;
  return (
    <Card>
      <CardContent className="overflow-x-auto p-4">
        <Stepper
          steps={LIFECYCLE_STEPS.map((step) => ({ id: step.id, label: step.label }))}
          currentStep={index}
          size="sm"
          className="min-w-[30rem]"
        />
      </CardContent>
    </Card>
  );
}
