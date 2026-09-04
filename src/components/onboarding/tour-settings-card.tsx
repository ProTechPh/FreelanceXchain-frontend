'use client';

import { Compass } from 'lucide-react';

import { useTourStore } from '@/stores/tourStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useStartTour } from './tour-launcher';

/**
 * The "Product tour" section of Account settings.
 *
 * Kept out of `account-settings.tsx` (already ~850 lines) so that file gains one
 * import and one line.
 */
export function TourSettingsCard() {
  const { startTour, canStartTour } = useStartTour();
  const autoStart = useTourStore((state) => state.autoStart);
  const setAutoStart = useTourStore((state) => state.setAutoStart);

  if (!canStartTour) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="size-5" /> Product tour
        </CardTitle>
        <CardDescription className="mt-1">
          A short walkthrough of your dashboard. It is stored on this device, so it will not follow you to another
          browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex min-h-12 items-center justify-between gap-4 border-b border-border py-2">
          <span className="text-sm">Show the tour on my next visit</span>
          <Switch
            checked={autoStart}
            aria-label="Show the tour on my next visit"
            onCheckedChange={(checked) => setAutoStart(checked)}
          />
        </div>
        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Take the walkthrough again from the beginning.</p>
          <Button id="tour-replay" variant="outline" className="shrink-0" onClick={() => startTour()}>
            Restart tour
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
