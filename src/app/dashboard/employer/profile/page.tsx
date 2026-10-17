import { Suspense } from 'react';
import { ProfileEditor } from '@/components/dashboard/profile-editor';

export default function EmployerProfilePage() {
  // The employer profile reads the active tab from ?tab=, which needs a Suspense boundary.
  return (
    <Suspense>
      <ProfileEditor role="employer" />
    </Suspense>
  );
}
