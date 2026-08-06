import { expect, test } from '@playwright/test';

const userId = '123e4567-e89b-12d3-a456-426614174070';
const createdAt = '2026-08-06T00:00:00.000Z';
const user = { id: userId, email: 'freelancer@example.com', name: 'Freelancer', role: 'freelancer', walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt };

test('reputation page presents backend score, history, work, and leaderboard', async ({ page }) => {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route(`**/api/reputation/${userId}/score`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ userId, averageRating: 4.7, totalRatings: 12, workQuality: 4.8, communication: 4.6, professionalism: 4.9, wouldWorkAgainPercentage: 92, completedContracts: 8, onTimeDeliveryRate: 88 }) }));
  await page.route(`**/api/reputation/${userId}/breakdown`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ fiveStars: 9, fourStars: 2, threeStars: 1, twoStars: 0, oneStar: 0, recentRatings: [{ rating: 5, comment: 'Excellent delivery.', reviewerName: 'Northstar Labs', projectTitle: 'Analytics platform', createdAt }] }) }));
  await page.route(`**/api/reputation/${userId}/reputation-history**`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ month: '2026-08', averageRating: 4.7, count: 3 }]) }));
  await page.route(`**/api/reputation/${userId}/history`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ contractId: 'contract-1', projectId: 'project-1', projectTitle: 'Analytics platform', role: 'freelancer', completedAt: createdAt, rating: 5, ratingComment: 'Excellent delivery.' }]) }));
  await page.route('**/api/reputation/leaderboard**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ userId, userName: 'Ada Developer', averageRating: 4.9, totalRatings: 18 }]) }));
  await page.route(`**/api/reputation/${userId}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ userId, score: 4.6, totalRatings: 12, averageRating: 4.7, ratings: [] }) }));

  await page.goto('/dashboard/freelancer/reputation');
  await expect(page.getByText('4.7').first()).toBeVisible();
  await expect(page.getByText('92%')).toBeVisible();
  await expect(page.getByText('88%')).toBeVisible();
  await expect(page.getByText('Analytics platform').first()).toBeVisible();
  await expect(page.getByText('Ada Developer')).toBeVisible();
  await expect(page.getByText('No blockchain transaction references are available for these ratings.')).toBeVisible();
});
