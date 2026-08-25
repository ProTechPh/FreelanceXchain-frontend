'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Three-state control: light -> dark -> system. `theme` (not `resolvedTheme`)
// is what we render, so "system" stays visible as a distinct choice.
const ORDER = ['light', 'dark', 'system'] as const;
type ThemeChoice = (typeof ORDER)[number];

const LABEL: Record<ThemeChoice, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

const ICON: Record<ThemeChoice, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Before hydration the stored choice is unknown; render the neutral icon so
  // the button never flashes the wrong state.
  const current: ThemeChoice = mounted && ORDER.includes(theme as ThemeChoice)
    ? (theme as ThemeChoice)
    : 'system';
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon = ICON[current];

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${LABEL[current]}. Switch to ${LABEL[next]}.`}
      title={`Theme: ${LABEL[current]}`}
      onClick={() => setTheme(next)}
    >
      <Icon className="size-5" aria-hidden="true" />
    </Button>
  );
}
