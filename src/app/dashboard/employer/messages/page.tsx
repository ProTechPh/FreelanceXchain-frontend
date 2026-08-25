import { Suspense } from 'react';
import { MessagesWorkspace } from '@/components/messages/MessagesWorkspace';
import { MessagesWorkspaceSkeleton } from '@/components/messages/messages-workspace-skeleton';

export default function EmployerMessagesPage() {
  return (
    <Suspense fallback={<MessagesWorkspaceSkeleton />}>
      <MessagesWorkspace />
    </Suspense>
  );
}
