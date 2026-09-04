import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3100';

/** Mirrors the shape zustand's `persist` writes for the `onboarding-tour` store. */
const TOUR_ALREADY_SEEN = {
  cookies: [],
  origins: [
    {
      origin: BASE_URL,
      localStorage: [
        {
          name: 'onboarding-tour',
          value: JSON.stringify({
            state: { completedByRole: { freelancer: 1, employer: 1 }, autoStart: true },
            version: 0,
          }),
        },
      ],
    },
  ],
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? 'github' : 'list',
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    // The onboarding tour auto-starts for a participant who has never seen it,
    // which would put a scrim over every dashboard assertion in this suite.
    // Seeding it as already completed here keeps all the existing specs honest
    // without editing any of them; `e2e/onboarding-tour.spec.ts` opts back out
    // with its own `test.use({ storageState: … })`.
    storageState: TOUR_ALREADY_SEEN,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      // The responsive suite asserts phone-only chrome (the drawer trigger, the
      // collapsed search row), none of which exists at desktop widths.
      testIgnore: /responsive\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // The narrowest phone still in use. Everything must work here, so the
    // responsive suite runs against it as well as a current handset.
    {
      name: 'mobile-320',
      testMatch: /responsive\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 568 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'mobile-393',
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'pnpm dev --hostname 127.0.0.1 --port 3100',
    env: {
      NEXT_DIST_DIR: '.next-e2e',
      NEXT_PUBLIC_API_URL: 'http://127.0.0.1:3100/api',
    },
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
