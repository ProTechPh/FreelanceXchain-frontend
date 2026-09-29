import assert from 'node:assert/strict';
import test from 'node:test';
import {
  shouldWarnForWebVital,
  webVitalsConsoleAlertsEnabled,
} from './web-vitals-budget.ts';

test('web vitals console alerts are opt-in', () => {
  assert.equal(webVitalsConsoleAlertsEnabled(undefined), false);
  assert.equal(webVitalsConsoleAlertsEnabled('false'), false);
  assert.equal(webVitalsConsoleAlertsEnabled('true'), true);
  assert.equal(webVitalsConsoleAlertsEnabled('1'), true);
});

test('does not warn about slow synthetic metrics when console alerts are disabled', () => {
  assert.equal(shouldWarnForWebVital({ name: 'LCP', value: 8000 }, false), false);
  assert.equal(shouldWarnForWebVital({ name: 'INP', value: 600 }, false), false);
  assert.equal(shouldWarnForWebVital({ name: 'CLS', value: 0.4 }, false), false);
});

test('warns only for enabled metrics that exceed their budgets', () => {
  assert.equal(shouldWarnForWebVital({ name: 'LCP', value: 2500 }, true), false);
  assert.equal(shouldWarnForWebVital({ name: 'LCP', value: 2501 }, true), true);
  assert.equal(shouldWarnForWebVital({ name: 'INP', value: 201 }, true), true);
  assert.equal(shouldWarnForWebVital({ name: 'CLS', value: 0.101 }, true), true);
  assert.equal(shouldWarnForWebVital({ name: 'FCP', value: 5000 }, true), false);
});
