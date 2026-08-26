'use client';

import { Button } from '@/components/ui/button';
import { RANGE_PRESETS, type RangePresetId } from '@/lib/analytics-range';
import { cn } from '@/lib/utils';

/**
 * Date-range presets for the analytics endpoints, which accept startDate/endDate.
 *
 * Rendered as a radiogroup rather than plain buttons so the selected range is
 * announced, not conveyed by styling alone.
 */
export function AnalyticsRangeFilter({
  value,
  onChange,
  className,
  label = 'Analytics date range',
}: {
  value: RangePresetId;
  onChange: (preset: RangePresetId) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {RANGE_PRESETS.map((preset) => {
        const selected = preset.id === value;
        return (
          <Button
            key={preset.id}
            role="radio"
            aria-checked={selected}
            variant={selected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(preset.id)}
          >
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
}
