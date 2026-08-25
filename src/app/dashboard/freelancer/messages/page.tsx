import { Suspense } from 'react';
import { MessagesWorkspace } from '@/components/messages/MessagesWorkspace';
import { MessagesWorkspaceSkeleton } from '@/components/messages/messages-workspace-skeleton';

export default function FreelancerMessagesPage() {
  return (
    <Suspense fallback={<MessagesWorkspaceSkeleton />}>
      <MessagesWorkspace />
    </Suspense>
  );
}
