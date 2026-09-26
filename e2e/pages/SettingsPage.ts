import { type Page, type Locator, expect } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly emailPreferences: {
    proposalReceived: Locator;
    proposalAccepted: Locator;
    milestoneUpdates: Locator;
    paymentNotifications: Locator;
    disputeNotifications: Locator;
    marketingEmails: Locator;
    weeklyDigest: Locator;
  };
  readonly storageInfo: {
    fileList: Locator;
    quotaInfo: Locator;
    deleteButtons: Locator;
  };
  readonly deleteAccountButton: Locator;
  readonly connectWalletButton: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    
    this.emailPreferences = {
      proposalReceived: page.getByRole('switch', { name: 'Proposal received' }),
      proposalAccepted: page.getByRole('switch', { name: 'Proposal accepted' }),
      milestoneUpdates: page.getByRole('switch', { name: 'Milestone updates' }),
      paymentNotifications: page.getByRole('switch', { name: 'Payment notifications' }),
      disputeNotifications: page.getByRole('switch', { name: 'Dispute notifications' }),
      marketingEmails: page.getByRole('switch', { name: 'Marketing emails' }),
      weeklyDigest: page.getByRole('switch', { name: 'Weekly digest emails' }),
    };

    this.storageInfo = {
      fileList: page.locator('main'),
      quotaInfo: page.locator('text=/\\d+\\.\\d+\\s*(KB|MB|GB)/'),
      deleteButtons: page.getByRole('button', { name: /^Delete\s+/ }),
    };

    this.deleteAccountButton = page.getByRole('button', { name: /Delete Account/i });
    this.connectWalletButton = page.locator('main').getByRole('button', { name: /\b(Connect|Replace) wallet/i });
    this.heading = page.getByRole('heading', { name: 'Account settings' });
  }

  async goto(role: 'freelancer' | 'employer' | 'admin') {
    await this.page.goto(`/dashboard/${role}/settings`);
  }

  async togglePreference(name: keyof typeof this.emailPreferences) {
    const current = (await this.emailPreferences[name].getAttribute('aria-checked')) ?? 'false';
    const target = current === 'true' ? 'false' : 'true';
    await this.emailPreferences[name].click();
    await expect(this.emailPreferences[name]).toHaveAttribute('aria-checked', target);
  }

  async getHeadingText(): Promise<string> {
    return (await this.heading.textContent()) ?? '';
  }

  async getFileCount(): Promise<number> {
    return this.page.locator('ul li').count();
  }

  async getPreferenceState(name: keyof typeof this.emailPreferences): Promise<string> {
    return (await this.emailPreferences[name].getAttribute('aria-checked')) ?? 'false';
  }

  async deleteFile(filename: string) {
    const deleteButton = this.page.getByRole('button', { name: `Delete ${filename}` });
    await deleteButton.click();
    
    const confirmButton = this.page.getByRole('button', { name: 'Delete File' });
    await confirmButton.click();
    await this.page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    await this.page.getByText(filename).waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async isFileListed(filename: string): Promise<boolean> {
    const fileText = await this.page.getByText(filename).isVisible();
    return fileText;
  }

  async getStorageInfo(): Promise<string> {
    await this.storageInfo.quotaInfo.first().waitFor({ state: 'visible', timeout: 10_000 });
    return (await this.storageInfo.fileList.textContent()) ?? '';
  }

  async isDeleteAccountButtonVisible(): Promise<boolean> {
    return this.deleteAccountButton.isVisible();
  }

  async isConnectWalletButtonVisible(): Promise<boolean> {
    return this.connectWalletButton.isVisible();
  }

  async acceptDialog() {
    this.page.on('dialog', (dialog) => dialog.accept());
  }
}
