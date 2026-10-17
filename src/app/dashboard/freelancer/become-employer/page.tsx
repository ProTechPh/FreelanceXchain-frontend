'use client';

import { Suspense, useEffect, useState } from 'react';
import { ProfileEditor } from '@/components/dashboard/profile-editor';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { employersApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';

/**
 * "Become an employer" setup for a freelancer. Creates the employer profile if
 * it does not exist yet, then shows the employer profile editor in onboarding
 * mode; the switch to employer unlocks once every required item is complete.
 */
export default function BecomeEmployerPage() {
  const [status, setStatus] = useState<{ ready: boolean; error: string | null }>({ ready: false, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    employersApi
      .ensureProfile()
      .then(() => {
        if (active) setStatus({ ready: true, error: null });
      })
      .catch((error) => {
        if (active) setStatus({ ready: false, error: getApiErrorMessage(error, 'Unable to start your employer setup.') });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  if (status.error) {
    return (
      <div className="mx-auto max-w-5xl">
        <Alert
          title="Couldn't start your employer setup"
          description={status.error}
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setStatus({ ready: false, error: null });
                setAttempt((count) => count + 1);
              }}
            >
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  if (!status.ready) return <DetailSkeleton />;

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProfileEditor role="employer" onboarding />
    </Suspense>
  );
}
