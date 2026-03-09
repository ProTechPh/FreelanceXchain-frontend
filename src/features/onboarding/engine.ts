import type { TutorialStep } from './types';

export function getStepByIndex(steps: TutorialStep[], index: number): TutorialStep | null {
  if (index < 0 || index >= steps.length) return null;
  return steps[index];
}

export function getStepIndexById(steps: TutorialStep[], stepId?: string): number {
  if (!stepId) return 0;
  const index = steps.findIndex((step) => step.id === stepId);
  return index >= 0 ? index : 0;
}

export function canAccessStep(step: TutorialStep, isKycApproved: boolean): boolean {
  if (step.guard?.requiresKycApproved && !isKycApproved) return false;
  return true;
}

export function resolveAnchorElement(step: TutorialStep): HTMLElement | null {
  const primary = document.querySelector(step.anchor.selector);
  if (primary instanceof HTMLElement) return primary;

  if (step.anchor.fallbackSelector) {
    const fallback = document.querySelector(step.anchor.fallbackSelector);
    if (fallback instanceof HTMLElement) return fallback;
  }

  return null;
}

export async function waitForAnchor(
  step: TutorialStep,
  timeoutMs: number = step.guard?.waitForElementMs ?? 2500
): Promise<HTMLElement | null> {
  const immediate = resolveAnchorElement(step);
  if (immediate) return immediate;

  const pollIntervalMs = 120;
  const start = Date.now();

  return new Promise((resolve) => {
    const timer = window.setInterval(() => {
      const el = resolveAnchorElement(step);
      if (el) {
        clearInterval(timer);
        resolve(el);
        return;
      }

      if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, pollIntervalMs);
  });
}
