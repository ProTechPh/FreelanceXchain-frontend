'use client';

import { useMediaQuery as useBaseMediaQuery } from '@base-ui/react/unstable-use-media-query';

/**
 * Matches a media query in JS.
 *
 * The house style for responsive layout is duplicated DOM gated by Tailwind
 * (`lg:hidden` / `hidden lg:block`), and that stays the default. This exists for
 * the one case classes cannot cover: the onboarding tour has to pick which
 * *element* to spotlight, and below `lg` the sidebar is not in the layout at all.
 *
 * Returns `false` on the server and during the first client render, so nothing
 * can hydrate against a width the server never knew.
 */
export function useMediaQuery(query: string): boolean {
  return useBaseMediaQuery(query, { defaultMatches: false });
}

/** `true` below the `lg` breakpoint, where the dashboard sidebar is a drawer. */
export function useIsBelowLarge(): boolean {
  return useMediaQuery('(max-width: 1023.98px)');
}
