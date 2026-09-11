'use client';

import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLAN_COMPARISON, PLAN_FOOTNOTES } from '@/lib/plan-features';

/**
 * Free vs Pro, rendered from PLAN_COMPARISON so the claims stay in sync with
 * what is actually gated (plan-features.test.mjs enforces that).
 */
export function PlanComparison({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <caption className="sr-only">Feature comparison between the Free and Pro plans</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-3 pr-4 text-left font-semibold text-foreground">
                Feature
              </th>
              <th scope="col" className="w-24 py-3 text-center font-semibold text-foreground">
                Free
              </th>
              <th scope="col" className="w-24 py-3 text-center font-semibold text-primary">
                Pro
              </th>
            </tr>
          </thead>
          <tbody>
            {PLAN_COMPARISON.map((row) => (
              <tr key={row.feature} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 text-muted-foreground">{row.feature}</td>
                <td className="py-3 text-center">
                  <PlanCell included={row.free} plan="Free" feature={row.feature} />
                </td>
                <td className="py-3 text-center">
                  <PlanCell included={row.pro} plan="Pro" feature={row.feature} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-1.5 text-xs text-muted-foreground">
        {PLAN_FOOTNOTES.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

/** Icon plus a screen-reader sentence — never colour or glyph alone. */
function PlanCell({ included, plan, feature }: { included: boolean; plan: string; feature: string }) {
  return (
    <>
      {included ? (
        <Check className="mx-auto size-4 text-success" aria-hidden="true" />
      ) : (
        <Minus className="mx-auto size-4 text-muted-foreground" aria-hidden="true" />
      )}
      <span className="sr-only">
        {feature} is {included ? 'included' : 'not included'} in {plan}
      </span>
    </>
  );
}
