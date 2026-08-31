'use client';

import { useState } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  // The styled wrapper in components/ui/sonner supplies the per-severity icons,
  // so a warning toast is distinguishable from an error without relying on
  // colour. closeButton matters because error copy now carries a next step and
  // is worth more than the default 4s.
  return (
    <Toaster
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
      position="top-right"
      richColors
      closeButton
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  // The API sends `Cache-Control: no-store` on every /api/* response and exposes no
  // ETag, so the browser cache is off and this client cache is the only one we get.
  // staleTime mirrors the backend's 60s in-memory LRU (see FreelanceXchain-api
  // src/utils/cache.ts) — refetching sooner just re-reads the same cached value.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <ThemedToaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
