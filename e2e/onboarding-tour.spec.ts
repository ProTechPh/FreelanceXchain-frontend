import { expect, test, type Page } from '@playwright/test';

/**
 * The onboarding tour.
 *
 * `playwright.config.ts` seeds every other spec with the tour already completed,
 * so this file opts back out and exercises real first-run behaviour.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const createdAt = '2026-08-06T00:00:00.000Z';

function buildUser(role: 'freelancer' | 'employer' | 'admin', overrides: Record<string, unknown> = {}) {
  return {
    id: `${role}-1`,
    email: `${role}@example.com`,
    name: role === 'freelancer' ? 'Maria Santos' : role === 'employer' ? 'TechVentures Inc.' : 'Admin',
    role,
    walletAddress: '',
    kycStatus: 'approved',
    emailVerification: true,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

async function authenticate(page: Page, user: ReturnType<typeof buildUser>) {
  await page.addInitScript((storedUser) => {
    localStorage.setItem('access_token', 'app-access-token');
    localStorage.setItem('refresh_token', 'app-refresh-token');
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user: storedUser, isAuthenticated: true },
      version: 0,
    }));
  }, user);

  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) }));
  await page.route('**/api/notifications/unread-count', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) }));
  await page.route('**/api/notifications/stream', (route) => route.abort());
  await page.route('**/auth/csrf-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'set-cookie': 'psifi.x-csrf-token=e2e-csrf-token; Path=/; SameSite=Lax' },
    body: JSON.stringify({ cookieName: 'psifi.x-csrf-token' }),
  }));
}

const tourDialog = (page: Page) => page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Skip tour' }) });

/** The same contract the rest of the suite holds every route to. */
async function expectNoHorizontalScroll(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow, `${label} scrolls horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
}

/**
 * The spotlight, read off the ring.
 *
 * The ring and the hole cut in the scrim are driven by the same rect, and the
 * ring is the one that is actually rendered -- its twin lives inside `<defs>`,
 * where `getBoundingClientRect()` reports zeros.
 */
async function readHoleRect(page: Page) {
  return page.evaluate(() => {
    const rect = document.querySelector('[data-tour-spotlight]');
    if (!rect) return null;
    const box = rect.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  });
}

async function readTourState(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('onboarding-tour');
    return raw ? JSON.parse(raw).state : null;
  });
}

test.describe('first run', () => {
  test('the tour opens on a freelancer\'s first visit and walks through every step', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');

    const dialog = tourDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Step 1 of 9')).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Welcome to FreelanceXchain' })).toBeVisible();

    // Back is unavailable on the first step, and says so rather than vanishing.
    await expect(dialog.getByRole('button', { name: 'Back' })).toBeDisabled();

    for (let step = 2; step <= 9; step += 1) {
      await dialog.getByRole('button', { name: 'Next' }).click();
      await expect(dialog.getByText(`Step ${step} of 9`)).toBeVisible();
    }

    await expect(dialog.getByRole('button', { name: 'Finish' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Finish' }).click();
    await expect(dialog).toHaveCount(0);

    expect((await readTourState(page)).progressByUser).toEqual({
      'freelancer-1': { freelancer: { completedVersion: 1 } },
    });
  });

  test('a completed tour does not come back on reload', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');
    await expect(tourDialog(page)).toBeVisible();

    await tourDialog(page).getByRole('button', { name: 'Skip tour' }).click();
    await expect(tourDialog(page)).toHaveCount(0);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(tourDialog(page)).toHaveCount(0);
  });

  test('Escape ends the tour and hands focus back to the dashboard', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');
    await expect(tourDialog(page)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(tourDialog(page)).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('dashboard-content');
  });

  test('arrow keys move between steps', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');
    const dialog = tourDialog(page);
    await expect(dialog).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByText('Step 2 of 9')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.getByText('Step 1 of 9')).toBeVisible();
  });

  test('Tab is contained inside the step card', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');
    await expect(tourDialog(page)).toBeVisible();

    for (let press = 0; press < 8; press += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('[data-tour-card]')));
      expect(inside, `focus escaped the card after ${press + 1} tabs`).toBe(true);
    }
  });

  test('the employer tour teaches the hiring side', async ({ page }) => {
    await authenticate(page, buildUser('employer'));
    await page.goto('/dashboard/employer');

    const dialog = tourDialog(page);
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Next' }).click();
    await dialog.getByRole('button', { name: 'Next' }).click();
    await expect(dialog.getByRole('heading', { name: 'Post your first project' })).toBeVisible();
  });
});

test.describe('who does not get it', () => {
  test('administrators are never shown a participant tour', async ({ page }) => {
    await authenticate(page, buildUser('admin'));
    await page.goto('/dashboard/admin');
    await page.waitForLoadState('networkidle');

    await expect(tourDialog(page)).toHaveCount(0);
  });

  test('the tour stays out of the way while email is unverified', async ({ page }) => {
    await authenticate(page, buildUser('freelancer', { emailVerification: false }));
    await page.goto('/dashboard/freelancer');
    await page.waitForLoadState('networkidle');

    // The verification gate owns the screen; a tour behind it would be unusable.
    await expect(tourDialog(page)).toHaveCount(0);
  });

  test('the tour does not start away from the dashboard home', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.route('**/api/contracts**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], hasMore: false }) }));
    await page.goto('/dashboard/freelancer/contracts');
    await page.waitForLoadState('networkidle');

    await expect(tourDialog(page)).toHaveCount(0);
  });
});

test.describe('replaying it', () => {
  test('the account menu starts the tour and navigates home first', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');
    await tourDialog(page).getByRole('button', { name: 'Skip tour' }).click();
    await expect(tourDialog(page)).toHaveCount(0);

    await page.goto('/dashboard/freelancer/settings');
    await expect(page.getByRole('heading', { name: 'Account settings' })).toBeVisible();

    await page.getByRole('button', { name: 'Open account menu' }).click();
    await page.getByRole('menuitem', { name: 'Product tour' }).click();

    // The steps point at the home page's own controls, so it has to get there.
    await expect(page).toHaveURL(/\/dashboard\/freelancer$/);
    await expect(tourDialog(page)).toBeVisible();
  });

  test('Settings restarts the tour and remembers the auto-start preference', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer/settings');

    const toggle = page.getByRole('switch', { name: 'Show the tour on my next visit' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    await page.reload();
    await expect(page.getByRole('switch', { name: 'Show the tour on my next visit' })).toHaveAttribute('aria-checked', 'false');

    // Turned off, it must not ambush them on the dashboard home either.
    await page.goto('/dashboard/freelancer');
    await page.waitForLoadState('networkidle');
    await expect(tourDialog(page)).toHaveCount(0);

    await page.goto('/dashboard/freelancer/settings');
    await page.getByRole('button', { name: 'Restart tour' }).click();
    await expect(page).toHaveURL(/\/dashboard\/freelancer$/);
    await expect(tourDialog(page)).toBeVisible();
  });
});

test.describe('feature coverage', () => {
  test('each step names the features it covers', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');

    const dialog = tourDialog(page);
    await expect(dialog).toBeVisible();
    // The opening step introduces the product; it has nothing to enumerate.
    await expect(dialog.getByRole('listitem')).toHaveCount(0);

    await dialog.getByRole('button', { name: 'Next' }).click();
    await expect(dialog.getByText('Step 2 of 9')).toBeVisible();
    // The navigation step spotlights the navigation itself, so it lists nothing
    // -- repeating the group names would crowd out what it is pointing at.
    await expect(dialog.getByRole('listitem')).toHaveCount(0);

    // Every remaining step must actually cover something.
    for (let step = 3; step <= 9; step += 1) {
      await dialog.getByRole('button', { name: 'Next' }).click();
      await expect(dialog.getByText(`Step ${step} of 9`)).toBeVisible();
      expect(await dialog.getByRole('listitem').count(), `step ${step} lists nothing`).toBeGreaterThanOrEqual(2);
    }
  });

  test('the tour reaches the areas it used to skip', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');

    const dialog = tourDialog(page);
    await expect(dialog).toBeVisible();

    const seen: string[] = [];
    for (let step = 1; step <= 9; step += 1) {
      seen.push((await dialog.getByRole('heading').first().textContent()) ?? '');
      const body = await dialog.textContent();
      seen.push(body ?? '');
      if (step < 9) await dialog.getByRole('button', { name: 'Next' }).click();
      await expect(dialog.getByText(`Step ${Math.min(step + 1, 9)} of 9`)).toBeVisible();
    }

    const transcript = seen.join(' ').toLowerCase();
    for (const topic of ['recommended', 'proposal', 'escrow', 'milestone', 'earnings', 'transactions', 'messages', 'disputes', 'portfolio', 'reputation', 'verification', 'skill']) {
      expect(transcript, `the tour never mentions ${topic}`).toContain(topic);
    }
  });
});

test.describe('the right thing is spotlit', () => {
  // Anchors used to be positional (`index === 0` of the stats grid). That is the
  // money tile for a freelancer and Active Projects for an employer, so the
  // employer's "what you have spent" step pointed at the wrong card. These
  // assert the ringed element by its own text, per role.
  const expectations: Record<'freelancer' | 'employer', Array<{ step: number; contains: string }>> = {
    freelancer: [
      { step: 4, contains: 'Recent Proposals' },
      { step: 6, contains: 'Active Contracts' },
      { step: 7, contains: 'Total Earned' },
    ],
    employer: [
      { step: 4, contains: 'Recent Proposals' },
      { step: 6, contains: 'Active Projects' },
      { step: 7, contains: 'Total Spent' },
    ],
  };

  for (const role of ['freelancer', 'employer'] as const) {
    test(`the ${role} tour rings the card each step is talking about`, async ({ page }) => {
      await authenticate(page, buildUser(role));
      await page.goto(`/dashboard/${role}`);

      const dialog = tourDialog(page);
      await expect(dialog).toBeVisible();

      for (let step = 2; step <= 9; step += 1) {
        await dialog.getByRole('button', { name: 'Next' }).click();
        await expect(dialog.getByText(`Step ${step} of 9`)).toBeVisible();

        const expected = expectations[role].find((item) => item.step === step);
        if (!expected) continue;

        // Whatever sits under the middle of the spotlight is what the reader
        // sees highlighted, so ask the document rather than trusting a selector.
        await expect.poll(async () => {
          const hole = await readHoleRect(page);
          if (!hole) return null;
          return page.evaluate(({ x, y, w, h }) => {
            // The overlay's pointer-blocker is on top of everything, so look
            // down the stack past it to whatever the reader actually sees ringed.
            const stack = document.elementsFromPoint(x + w / 2, Math.min(y + h / 2, window.innerHeight - 2));
            const el = stack.find((node) => !node.closest('[data-tour-overlay]'));
            return el?.closest('[data-slot="card"]')?.textContent ?? el?.textContent ?? '';
          }, { x: hole.x, y: hole.y, w: hole.width, h: hole.height });
        }, { message: `step ${step} did not settle on "${expected.contains}"` }).toContain(expected.contains);
      }
    });
  }
});

test.describe('contextual help', () => {
  test('a help hint explains escrow in place and can hand off to the tour', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');
    await tourDialog(page).getByRole('button', { name: 'Skip tour' }).click();
    await expect(tourDialog(page)).toHaveCount(0);

    const hint = page.getByRole('button', { name: 'Why do I need a wallet?' });
    await expect(hint).toBeVisible();
    await expect(hint).toHaveAttribute('aria-expanded', 'false');

    await hint.click();
    await expect(hint).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(/Escrow settles on Ethereum/)).toBeVisible();

    // The hand-off lands on the step that covers it, not back at step 1.
    await page.getByRole('button', { name: 'Show me in the tour' }).click();
    await expect(tourDialog(page)).toBeVisible();
    await expect(tourDialog(page).getByText('Step 5 of 9')).toBeVisible();
  });

  test('identity verification explains why it is worth doing', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.route('**/api/kyc/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'not_started' }) }));
    await page.goto('/dashboard/freelancer/verification');

    const hint = page.getByRole('button', { name: 'Why verify my identity?' });
    await expect(hint).toBeVisible();
    await hint.click();
    await expect(page.getByText(/Only an approved status counts/)).toBeVisible();
  });

  test('an empty state offers the step that explains it', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');
    await tourDialog(page).getByRole('button', { name: 'Skip tour' }).click();
    await expect(tourDialog(page)).toHaveCount(0);

    await page.getByRole('button', { name: /How contracts and milestones work/ }).click();
    await expect(tourDialog(page)).toBeVisible();
    await expect(tourDialog(page).getByText('Step 6 of 9')).toBeVisible();
    await expect(tourDialog(page).getByRole('heading', { name: 'Deliver in the contract workspace' })).toBeVisible();
  });

  test('help hints do not widen the page on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');
    await tourDialog(page).getByRole('button', { name: 'Skip tour' }).click();

    const hint = page.getByRole('button', { name: 'Why do I need a wallet?' });
    await hint.click();
    await expect(page.getByText(/Escrow settles on Ethereum/)).toBeVisible();
    await expectNoHorizontalScroll(page, 'dashboard with a help hint open at 320px');
  });
});

test.describe('the spotlight itself', () => {
  test('the hole tracks the element the step is talking about', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');

    const dialog = tourDialog(page);
    await expect(dialog).toBeVisible();
    // Step 1 is the centred welcome, so there is nothing to spotlight yet.
    expect(await readHoleRect(page)).toBeNull();

    await dialog.getByRole('button', { name: 'Next' }).click();
    await expect(dialog.getByText('Step 2 of 9')).toBeVisible();

    const target = await page.locator('[data-tour="nav"]').boundingBox();
    expect(target).not.toBeNull();
    // 6px of padding on every side, clamped to the viewport. The hole animates
    // into place, so assert where it settles.
    await expect.poll(async () => {
      const hole = await readHoleRect(page);
      if (!hole) return null;
      return Math.max(Math.abs(hole.x - Math.max(0, target!.x - 6)), Math.abs(hole.y - Math.max(0, target!.y - 6)));
    }, { message: 'the spotlight never settled on the sidebar' }).toBeLessThanOrEqual(1.5);
  });

  test('the page is not aria-hidden, so the highlighted control stays perceivable', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');
    await expect(tourDialog(page)).toBeVisible();

    // The point of a spotlight is that assistive tech can still reach what it
    // points at, which `aria-modal="true"` would forbid.
    await expect(tourDialog(page)).toHaveAttribute('aria-modal', 'false');
    await expect(page.locator('[data-tour="nav"]')).not.toHaveAttribute('aria-hidden', 'true');
  });

  test('the overlay leaves no trace once the tour ends', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');
    await expect(tourDialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tourDialog(page)).toHaveCount(0);

    // The regression guard: the responsive suite hit-tests the centre point of
    // the navigation button on every route, and a leftover layer would own it.
    const bell = await page.locator('[data-tour="notifications"]').boundingBox();
    const owner = await page.evaluate(({ x, y, width, height }) => {
      const hit = document.elementFromPoint(x + width / 2, y + height / 2);
      return hit?.closest('[data-tour="notifications"]') !== null;
    }, bell!);
    expect(owner).toBe(true);
  });
});

// A phone in landscape is the shortest viewport a real device produces, and the
// one where the card comes closest to owning the whole screen.
test.describe('on a phone in landscape', () => {
  test.use({ viewport: { width: 667, height: 375 }, hasTouch: true, isMobile: true });

  test('every step still shows its title and its controls', async ({ page }) => {
    await authenticate(page, buildUser('freelancer'));
    await page.goto('/dashboard/freelancer');

    const dialog = tourDialog(page);
    await expect(dialog).toBeVisible();

    for (let step = 1; step <= 9; step += 1) {
      await expect(dialog.getByText(`Step ${step} of 9`)).toBeVisible();
      await expectNoHorizontalScroll(page, `landscape step ${step}`);

      // `toBeVisible` only means "rendered". On a short screen what actually
      // goes wrong is the control sitting below the card's own internal fold,
      // so assert the geometry rather than the rendering.
      for (const name of ['Skip tour', step === 9 ? 'Finish' : 'Next']) {
        const box = await dialog.getByRole('button', { name }).boundingBox();
        expect(box, `${name} is not rendered on step ${step}`).not.toBeNull();
        expect(box!.y, `${name} is above the viewport on step ${step}`).toBeGreaterThanOrEqual(-1);
        expect(box!.y + box!.height, `${name} is below the viewport on step ${step}`).toBeLessThanOrEqual(376);
      }

      // And the title has to be readable without scrolling the card first.
      const title = await dialog.getByRole('heading').first().boundingBox();
      expect(title, `no title on step ${step}`).not.toBeNull();
      expect(title!.y, `the title is off the top on step ${step}`).toBeGreaterThanOrEqual(-1);
      expect(title!.y + title!.height, `the title is off the bottom on step ${step}`).toBeLessThanOrEqual(376);

      const card = await dialog.boundingBox();
      expect(card!.y + card!.height).toBeLessThanOrEqual(376);
      if (step < 9) await dialog.getByRole('button', { name: 'Next' }).click();
    }
  });
});

for (const viewport of [{ width: 320, height: 568 }, { width: 393, height: 852 }]) {
  test.describe(`on a ${viewport.width}px screen`, () => {
    test.use({ viewport, hasTouch: true, isMobile: true });

    test('the navigation step opens the drawer and spotlights it', async ({ page }) => {
      await authenticate(page, buildUser('freelancer'));
      await page.goto('/dashboard/freelancer');

      const dialog = tourDialog(page);
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Next' }).click();
      await expect(dialog.getByText('Step 2 of 9')).toBeVisible();

      // A closed hamburger tells nobody what is behind it. On a phone the drawer
      // holds the only copy of the navigation, so the step that talks about
      // navigation has to actually show it.
      const drawer = page.getByRole('dialog', { name: 'Dashboard navigation' });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole('link', { name: 'Browse projects' })).toBeVisible();
      await expect(drawer.getByRole('link', { name: 'Contracts' })).toBeVisible();

      // And the spotlight is on the drawer, not on the button that opened it.
      const box = await drawer.boundingBox();
      await expect.poll(async () => {
        const hole = await readHoleRect(page);
        if (!hole) return null;
        return Math.abs(hole.x - Math.max(0, box!.x - 6));
      }, { message: 'the spotlight never settled on the drawer' }).toBeLessThanOrEqual(1.5);

      // The tour card has to stay readable while the drawer is up: a modal
      // drawer would mark it `aria-hidden` and trap focus inside itself.
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate((el) => el.closest('[aria-hidden="true"]') !== null)).toBe(false);

      // And enough of the navigation has to clear the card to be worth showing.
      // Polled: the card gives back height once it sees how tall the drawer is,
      // and reading it before that settles measures the wrong card.
      await expect.poll(async () => {
        const card = await dialog.boundingBox();
        if (!card) return 0;
        return page.evaluate((cardTop) => {
          const links = Array.from(document.querySelectorAll('[data-tour="nav-drawer"] a'));
          return links.filter((link) => {
            const box = link.getBoundingClientRect();
            return box.top >= 0 && box.bottom <= cardTop + 1;
          }).length;
        }, card.y);
        // Three is what a 568px screen can honestly give: any more and the card
        // itself gets too short to read the step in.
      }, { message: 'too little of the navigation cleared the tour card' }).toBeGreaterThanOrEqual(3);
    });

    test('the logo mark actually paints inside the drawer', async ({ page }) => {
      await authenticate(page, buildUser('freelancer'));
      await page.goto('/dashboard/freelancer');

      const dialog = tourDialog(page);
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('dialog', { name: 'Dashboard navigation' })).toBeVisible();

      // The mark's gradients and mask used to carry fixed ids. `url(#id)`
      // resolves to the first match in the document, and on a phone that was the
      // desktop sidebar's copy inside `hidden lg:flex` -- a `display: none`
      // subtree supplies no paint, so the mark took up its space and drew
      // nothing. Every reference must resolve within its own svg.
      const resolved = await page.evaluate(() => {
        const svg = document.querySelector('[data-tour="nav-drawer"] svg[viewBox="0 0 100 100"]');
        if (!svg) return null;
        const refs = Array.from(svg.querySelectorAll('*'))
          .flatMap((el) => ['stroke', 'mask', 'clip-path'].map((attr) => el.getAttribute(attr)))
          .filter((value): value is string => !!value && value.startsWith('url(#'))
          .map((value) => value.slice(5, -1));
        return { count: refs.length, allInside: refs.every((id) => svg.contains(document.getElementById(id))) };
      });

      expect(resolved, 'the drawer has no logo mark').not.toBeNull();
      expect(resolved!.count, 'the mark stopped using paint servers').toBeGreaterThan(0);
      expect(resolved!.allInside, 'a paint reference escaped to another instance').toBe(true);
    });

    test('the drawer closes again when the step moves on', async ({ page }) => {
      await authenticate(page, buildUser('freelancer'));
      await page.goto('/dashboard/freelancer');

      const dialog = tourDialog(page);
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('dialog', { name: 'Dashboard navigation' })).toBeVisible();

      await dialog.getByRole('button', { name: 'Next' }).click();
      await expect(dialog.getByText('Step 3 of 9')).toBeVisible();
      await expect(page.getByRole('dialog', { name: 'Dashboard navigation' })).toHaveCount(0);

      // And it must not be left open once the tour is over.
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: 'Dashboard navigation' })).toHaveCount(0);
    });

    test('no step scrolls the page sideways', async ({ page }) => {
      await authenticate(page, buildUser('freelancer'));
      await page.goto('/dashboard/freelancer');

      const dialog = tourDialog(page);
      await expect(dialog).toBeVisible();

      for (let step = 1; step <= 9; step += 1) {
        await expect(dialog.getByText(`Step ${step} of 9`)).toBeVisible();
        await expectNoHorizontalScroll(page, `tour step ${step} at ${viewport.width}px`);

        // A step that opens already scrolled past its own title is unreadable.
        expect(await dialog.evaluate((el) => el.scrollTop), `step ${step} opened mid-scroll`).toBe(0);

        const card = await dialog.boundingBox();
        expect(card!.x, `card starts off-screen on step ${step}`).toBeGreaterThanOrEqual(-1);
        expect(card!.x + card!.width, `card overhangs the right edge on step ${step}`).toBeLessThanOrEqual(viewport.width + 1);
        expect(card!.y + card!.height, `card hangs below the fold on step ${step}`).toBeLessThanOrEqual(viewport.height + 1);

        if (step < 9) await dialog.getByRole('button', { name: 'Next' }).click();
      }
    });

    test('the docked card never covers the thing it is describing', async ({ page }) => {
      await authenticate(page, buildUser('freelancer'));
      await page.goto('/dashboard/freelancer');

      const dialog = tourDialog(page);
      await expect(dialog).toBeVisible();

      for (let step = 2; step <= 9; step += 1) {
        await dialog.getByRole('button', { name: 'Next' }).click();
        await expect(dialog.getByText(`Step ${step} of 9`)).toBeVisible();

        if ((await readHoleRect(page)) === null) continue;

        // Step 2 opens the full-height navigation drawer. A docked card is
        // always going to cover part of something that tall, so what matters
        // there is how many nav links stay readable -- asserted on its own, in
        // 'the navigation step opens the drawer and spotlights it'.
        if (step === 2) continue;

        // A target taller than the band between the sticky header and the docked
        // card cannot be shown whole -- the "Recent Proposals" card at 320px is
        // one. What must never happen is the one this test was written for: the
        // spotlight sitting entirely behind the card, pointing at nothing the
        // reader can see. So assert a usable amount of it is above the card.
        // Proportional, not absolute: a 40px button's spotlight is only ~52px
        // tall in total, so any fixed pixel floor either passes trivially for a
        // tall card or fails a small button that is entirely on screen.
        await expect.poll(async () => {
          const hole = await readHoleRect(page);
          const card = await dialog.boundingBox();
          if (!hole || !card || hole.height === 0) return Number.NEGATIVE_INFINITY;
          // Pushing it off the top instead is just as bad, so it fails the same
          // check rather than a separate read that could land mid-scroll.
          if (hole.y < -1) return Number.NEGATIVE_INFINITY;
          const visible = Math.min(hole.y + hole.height, card.y) - Math.max(hole.y, 0);
          return visible / hole.height;
        }, { message: `step ${step} left too little of the spotlight visible` }).toBeGreaterThanOrEqual(0.6);
      }
    });
  });
}
