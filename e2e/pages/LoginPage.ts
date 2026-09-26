import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly oauthButtons: {
    google: Locator;
    github: Locator;
    emailMagicLink: Locator;
  };
  readonly backToHomeLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email Address', { exact: true });
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.loginButton = page.locator('form button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"]');
    this.oauthButtons = {
      google: page.getByRole('button', { name: /^google$/i }),
      github: page.getByRole('button', { name: /^github$/i }),
      emailMagicLink: page.getByRole('button', { name: /email code or magic link/i }),
    };
    this.backToHomeLink = page.getByRole('link', { name: 'Back to home' });
  }

  async goto(path: 'login' | 'register' = 'login') {
    await this.page.goto(`/${path}`);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return this.errorMessage.textContent();
    }
    return null;
  }

  async isSubmitDisabled(): Promise<boolean> {
    return this.loginButton.isDisabled();
  }

  async isSubmitBusy(): Promise<boolean> {
    const ariaBusy = await this.loginButton.getAttribute('aria-busy');
    return ariaBusy === 'true';
  }

  async getSubmitText(): Promise<string> {
    return this.loginButton.textContent();
  }

  async isSpinnerVisible(): Promise<boolean> {
    const spinner = this.loginButton.locator('svg.animate-spin');
    return spinner.isVisible();
  }

  async clickBackToHome() {
    await this.backToHomeLink.click();
  }

  async getHeadingText(): Promise<string> {
    const heading = this.page.getByRole('heading');
    return heading.textContent();
  }

  async hasHeroImage(): Promise<boolean> {
    const heroElements = await this.page.locator('[style*="background-image"]').count();
    return heroElements > 0;
  }
}
