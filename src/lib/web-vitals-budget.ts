export type WebVitalBudgetMetric = {
  name: string;
  value: number;
};

export const WEB_VITAL_BUDGETS = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
} as const;

export function webVitalsConsoleAlertsEnabled(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export function shouldWarnForWebVital(
  metric: WebVitalBudgetMetric,
  consoleAlertsEnabled: boolean,
): boolean {
  if (!consoleAlertsEnabled) return false;

  const budget = WEB_VITAL_BUDGETS[metric.name as keyof typeof WEB_VITAL_BUDGETS];
  return typeof budget === 'number' && metric.value > budget;
}
