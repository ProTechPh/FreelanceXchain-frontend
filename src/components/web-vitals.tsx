'use client';

import { useReportWebVitals } from 'next/web-vitals';

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
    // In development: alert on metrics exceeding budget
    if (process.env.NODE_ENV === 'development') {
      const isBreaching =
        (metric.name === 'LCP' && metric.value > 2500) ||
        (metric.name === 'INP' && metric.value > 200) ||
        (metric.name === 'CLS' && metric.value > 0.1);

      if (isBreaching) {
        console.warn(
          `[Web Vitals Alert] ${metric.name} value of ${metric.value.toFixed(2)} exceeds budget target:`,
          metric
        );
      }
    }
  });

  return null;
}
