'use client';

import { useState } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { WebVitals } from '@/components/web-vitals';
import { isPlanUpgradeRequired } from '@/lib/plan-access';
import { RateAppProvider } from '@/components/feedback/rate-app-provider';
import { WalletProvider } from '@/components/wallet/wallet-provider';

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) =>
              !isPlanUpgradeRequired(error) && failureCount < 1,
          },
        },
      }),
  );

  return (
    <WalletProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WebVitals />
          <RateAppProvider>{children}</RateAppProvider>
          <ThemedToaster />
        </ThemeProvider>
      </QueryClientProvider>
    </WalletProvider>
  );
}