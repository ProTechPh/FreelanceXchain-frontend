import { Suspense } from 'react';
import { MessagesWorkspace } from '@/components/messages/MessagesWorkspace';

export default function EmployerMessagesPage() {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Loading messages…</p>}>
      <MessagesWorkspace />
    </Suspense>
  );
}
