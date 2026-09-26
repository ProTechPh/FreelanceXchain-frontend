import { type Page, type Locator, expect } from '@playwright/test';

export class NavigationComponent {
  readonly page: Page;
  readonly menuButton: Locator;
  readonly drawer: Locator;
  readonly navLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuButton = page.getByRole('button', { name: 'Open navigation menu' });
    this.drawer = page.getByRole('dialog', { name: 'Dashboard navigation' });
    this.navLinks = this.drawer.getByRole('link');
  }

  async open() {
    const isVisible = await this.drawer.isVisible();
    if (!isVisible) {
      await this.menuButton.click();
      await expect(this.drawer).toBeVisible();
    }
  }

  async close() {
    const isVisible = await this.drawer.isVisible();
    if (isVisible) {
      await this.page.keyboard.press('Escape');
      await expect(this.drawer).not.toBeVisible();
    }
  }

  async navigateTo(linkName: string) {
    await this.open();
    const link = this.drawer.getByRole('link', { name: linkName });
    await link.click();
  }

  async isMenuButtonVisible(): Promise<boolean> {
    await this.menuButton.waitFor({ state: 'visible', timeout: 10_000 });
    return this.menuButton.isVisible();
  }

  async getMenuButtonSize(): Promise<{ width: number; height: number } | null> {
    const box = await this.menuButton.boundingBox();
    return box;
  }

  async menuButtonOwnsCenter(): Promise<boolean> {
    const box = await this.menuButton.boundingBox();
    if (!box) return false;

    const ownsCentre = await this.page.evaluate(({ x, y, width, height }) => {
      const hit = document.elementFromPoint(x + width / 2, y + height / 2);
      return hit?.closest('button')?.getAttribute('aria-label') ?? null;
    }, box);

    return ownsCentre === 'Open navigation menu';
  }

  async getDrawerWidth(): Promise<number> {
    await this.open();
    const width = await this.drawer.evaluate((el) => el.getBoundingClientRect().width);
    return width;
  }

  async getViewportWidth(): Promise<number> {
    return this.page.evaluate(() => document.documentElement.clientWidth);
  }

  async drawerFitsInViewport(): Promise<boolean> {
    const drawerWidth = await this.getDrawerWidth();
    const viewportWidth = await this.getViewportWidth();
    return drawerWidth < viewportWidth;
  }

  async getNavLinkByName(name: string): Promise<Locator> {
    return this.drawer.getByRole('link', { name });
  }
}
