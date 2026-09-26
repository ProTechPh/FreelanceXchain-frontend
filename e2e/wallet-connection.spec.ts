import { expect, test, type Page } from '@playwright/test';

const createdAt = '2026-08-06T00:00:00.000Z';
const walletA = '0x1111111111111111111111111111111111111111';
const walletB = '0x2222222222222222222222222222222222222222';

async function authenticate(page: Page) {
  const user = { id: 'freelancer-1', email: 'freelancer@example.com', name: 'freelancer', role: 'freelancer', plan: 'free', walletAddress: '', kycStatus: 'approved', createdAt, updatedAt: createdAt };
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: storedUser, isAuthenticated: true }, version: 0 }));
  }, user);
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route('**/auth/csrf-token', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' }, body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }) }));
}

/** Injected EIP-1193 wallet whose selected account the test can switch. */
async function installMockWallet(page: Page) {
  await page.addInitScript((initialAccount) => {
    const listeners: Record<string, Array<(data: unknown) => void>> = {};
    const state = { account: initialAccount, permitted: false };
    const w = window as unknown as Record<string, unknown>;
    w.__mockWallet = {
      setAccount(next: string) {
        state.account = next;
        if (state.permitted) (listeners.accountsChanged ?? []).forEach((cb) => cb([next]));
      },
    };
    w.ethereum = {
      isMetaMask: true,
      async request({ method }: { method: string }) {
        switch (method) {
          case 'eth_requestAccounts':
            state.permitted = true;
            return [state.account];
          case 'eth_accounts':
            return state.permitted ? [state.account] : [];
          case 'eth_chainId':
            return '0x539';
          case 'eth_getBalance':
            return '0xde0b6b3a7640000';
          case 'wallet_revokePermissions':
            state.permitted = false;
            return null;
          default:
            throw new Error(`Unsupported method ${method}`);
        }
      },
      on(event: string, cb: (data: unknown) => void) {
        (listeners[event] ??= []).push(cb);
      },
      removeListener(event: string, cb: (data: unknown) => void) {
        listeners[event] = (listeners[event] ?? []).filter((item) => item !== cb);
      },
    };
  }, walletA);
}

/** Mirrors the API: one linked wallet, which must be unlinked before it can change. */
async function mockWalletApi(page: Page) {
  const calls = { link: [] as string[], unlink: 0 };
  let linked = '';
  await page.route('**/api/auth/wallet', async (route) => {
    const method = route.request().method();
    if (method === 'PATCH') {
      const { walletAddress } = route.request().postDataJSON() as { walletAddress: string };
      calls.link.push(walletAddress);
      if (linked && linked.toLowerCase() !== walletAddress.toLowerCase()) {
        await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: { code: 'WALLET_LOCKED', message: 'Wallet address is already set and cannot be changed' } }) });
        return;
      }
      linked = walletAddress;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Wallet address updated successfully', walletAddress }) });
      return;
    }
    if (method === 'DELETE') {
      calls.unlink += 1;
      linked = '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Wallet address disconnected successfully', walletAddress: '' }) });
      return;
    }
    await route.fallback();
  });
  return calls;
}

test('switching to a different wallet after disconnecting links it once without sync errors', async ({ page }) => {
  await authenticate(page);
  await installMockWallet(page);
  const calls = await mockWalletApi(page);

  await page.goto('/dashboard/freelancer');
  const header = page.getByRole('banner');

  await header.getByRole('button', { name: 'Connect Wallet' }).click();
  await expect(page.getByText('Wallet connected successfully')).toBeVisible();
  await expect(header.getByRole('button', { name: /Wallet 0x1111/ })).toBeVisible();

  await header.getByRole('button', { name: /Wallet 0x1111/ }).click();
  await page.getByRole('menuitem', { name: 'Disconnect Wallet' }).click();
  await expect(page.getByText('Wallet disconnected successfully')).toBeVisible();
  await expect(header.getByRole('button', { name: 'Connect Wallet' })).toBeVisible();

  await page.evaluate((next) => (window as unknown as { __mockWallet: { setAccount: (a: string) => void } }).__mockWallet.setAccount(next), walletB);
  await header.getByRole('button', { name: 'Connect Wallet' }).click();
  await expect(header.getByRole('button', { name: /Wallet 0x2222/ })).toBeVisible();

  // Give any stray background sync time to fire before asserting it did not.
  await page.waitForTimeout(1500);
  await expect(page.getByText(/failed to sync/i)).toHaveCount(0);
  expect(calls.link).toEqual([walletA, walletB]);
  expect(calls.unlink).toBe(1);
});

test('a server refusal keeps the wallet disconnected and explains why', async ({ page }) => {
  await authenticate(page);
  await installMockWallet(page);
  await page.route('**/api/auth/wallet', (route) => route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: { code: 'WALLET_LOCKED', message: 'Wallet address is already set and cannot be changed' } }) }));

  await page.goto('/dashboard/freelancer');
  const header = page.getByRole('banner');
  await header.getByRole('button', { name: 'Connect Wallet' }).click();

  await expect(page.getByText(/Disconnect it first, then connect the new wallet/)).toBeVisible();
  await expect(page.getByText('Wallet connected successfully')).toHaveCount(0);
  await expect(header.getByRole('button', { name: 'Connect Wallet' })).toBeVisible();
});
