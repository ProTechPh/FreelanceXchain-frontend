import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function ConversationRows() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className={cn('h-4', index % 2 === 0 ? 'w-28' : 'w-20')} />
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
            <Skeleton className={cn('h-3', index % 2 === 0 ? 'w-4/5' : 'w-3/5')} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageRows() {
  return (
    <div className="space-y-5">
      <div className="flex justify-start">
        <div className="w-2/5 space-y-2 rounded-2xl rounded-bl-md border border-border bg-card p-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="ml-auto h-3 w-12" />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="w-1/3 space-y-2 rounded-2xl rounded-br-md bg-primary-subtle p-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="ml-auto h-3 w-12" />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="w-1/2 space-y-2 rounded-2xl rounded-bl-md border border-border bg-card p-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="ml-auto h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function MessageThreadSkeleton({
  label = 'Loading conversation',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn('h-full', className)}
    >
      <span className="sr-only">{label}</span>
      <MessageRows />
    </div>
  );
}

export function MessagesWorkspaceSkeleton({
  label = 'Loading messages',
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-slot="messages-workspace-skeleton"
      className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border bg-card"
    >
      <span className="sr-only">{label}</span>

      <div
        data-slot="conversation-list-skeleton"
        className="flex w-80 shrink-0 flex-col border-r border-border"
      >
        <div className="space-y-3 border-b border-border p-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationRows />
        </div>
      </div>

      <div data-slot="chat-pane-skeleton" className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-4">
          <MessageRows />
        </div>

        <div className="flex items-center gap-3 border-t border-border p-4">
          <Skeleton className="size-9 shrink-0 rounded-md" />
          <Skeleton className="h-9 min-w-0 flex-1 rounded-md" />
          <Skeleton className="size-9 shrink-0 rounded-md" />
        </div>
      </div>
    </div>
  );
}
