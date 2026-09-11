'use client';

import { Badge } from '@/components/ui/badge';
import { usePlan } from '@/hooks/use-plan';

/**
 * The "Pro" pill.
 *
 * Renders nothing until the session is confirmed, which avoids a Free→Pro
 * flicker in the sidebar on every page load, and nothing for admins — their
 * access comes from their role, so labelling them "Pro" would be misleading.
 */
export function PlanBadge({ className }: { className?: string }) {
  const { isPro, isResolved, isAdmin } = usePlan();

  if (!isResolved || isAdmin || !isPro) return null;

  return (
    <Badge variant="default" className={className}>
      Pro
    </Badge>
  );
}
