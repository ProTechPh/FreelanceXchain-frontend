'use client';

import { useReportWebVitals } from 'next/web-vitals';
import {
  shouldWarnForWebVital,
  webVitalsConsoleAlertsEnabled,
} from '@/lib/web-vitals-budget';

/**
 * Real User Monitoring (RUM) for Core Web Vitals.
 *
 * Tracks:
 * - LCP (Largest Contentful Paint) <= 2.5s
 * - INP (Interaction to Next Paint) <= 200ms
 * - CLS (Cumulative Layout Shift) <= 0.1
 * - FCP (First Contentful Paint) <= 1.8s
 * - TTFB (Time to First Byte) <= 800ms
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    // `next dev` and Playwright add synthetic latency, so local console budget
    // alerts are opt-in. Enable with NEXT_PUBLIC_WEB_VITALS_CONSOLE_ALERTS=true.
    if (
      shouldWarnForWebVital(
        metric,
        webVitalsConsoleAlertsEnabled(process.env.NEXT_PUBLIC_WEB_VITALS_CONSOLE_ALERTS),
      )
    ) {
      console.warn(
        `[Web Vitals Alert] ${metric.name} value of ${metric.value.toFixed(2)} exceeds budget target:`,
        metric,
      );
    }
  });

  return null;
}
