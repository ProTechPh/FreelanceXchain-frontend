import { test as base } from '@playwright/test';

export interface TestAuthUser {
  id: string;
  email: string;
  name: string;
  role: 'freelancer' | 'employer' | 'admin';
  walletAddress: string;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
}

export const test = base.extend<{
  authenticateAs: (role: 'freelancer' | 'employer' | 'admin') => Promise<TestAuthUser>;
}>({
  authenticateAs: async ({ page }, provide) => {
    const userMap: Record<'freelancer' | 'employer' | 'admin', TestAuthUser> = {
      freelancer: { id: 'freelancer-1', email: 'freelancer@example.com', name: 'Maria Santos', role: 'freelancer', walletAddress: '0x08dfcf184486bd3d8e1bc34da8d520a2689a7828', kycStatus: 'approved', createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' },
      employer: { id: 'employer-1', email: 'employer@example.com', name: 'TechVentures Inc.', role: 'employer', walletAddress: '0x08dfcf184486bd3d8e1bc34da8d520a2689a7828', kycStatus: 'approved', createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' },
      admin: { id: 'admin-1', email: 'admin@example.com', name: 'Admin', role: 'admin', walletAddress: '0x08dfcf184486bd3d8e1bc34da8d520a2689a7828', kycStatus: 'approved', createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' }
    };
    const authenticate = async (role: 'freelancer' | 'employer' | 'admin') => {
      const user = userMap[role];
      await page.route('**/api/auth/me', r => r.fulfill({ status: 200, body: JSON.stringify({ user }) }));
      await page.route('**/api/auth/mfa/factors', r => r.fulfill({ status: 200, body: JSON.stringify({ factors: [] }) }));
      await page.addInitScript((u) => { localStorage.setItem('access_token', 'app-access-token'); localStorage.setItem('refresh_token', 'app-refresh-token'); localStorage.setItem('auth-storage', JSON.stringify({ state: { user: u, isAuthenticated: true }, version: 0 })); }, user);
      return user;
    };
    await provide(authenticate);
  },
});
export { expect } from '@playwright/test';
