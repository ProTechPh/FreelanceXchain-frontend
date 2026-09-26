import { type Page, type Locator, expect } from '@playwright/test';
import { NavigationComponent } from './NavigationComponent';

export class DashboardPage {
  readonly page: Page;
  readonly navigation: NavigationComponent;
  readonly searchField: Locator;
  readonly userMenu: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navigation = new NavigationComponent(page);
    this.searchField = page.locator('#dashboard-marketplace-search-mobile');
    this.userMenu = page.getByRole('button', { name: /^Search projects$/i }).first();
    this.heading = page.getByRole('heading');
  }

  async goto(role: 'freelancer' | 'employer' | 'admin', path = '') {
    await this.page.goto(`/dashboard/${role}${path}`);
  }

  async openSearch() {
    const toggle = this.page.getByRole('button', { name: /^Search projects$/i }).first();
    await toggle.click();
  }

  async isVisible(): Promise<boolean> {
    return this.heading.isVisible();
  }

  async getHeadingText(): Promise<string> {
    return this.heading.textContent();
  }

  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle') {
    await this.page.waitForLoadState(state);
  }
}
