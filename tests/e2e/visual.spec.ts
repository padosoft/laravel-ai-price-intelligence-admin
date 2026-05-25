import { test, expect } from '@playwright/test';

// Visual-regression baselines on key screens, rendered against the deterministic MSW mock
// preview so screenshots are stable. Baselines are platform-suffixed by Playwright and are
// generated on Windows (windows-latest, matching this runner's font rendering) — regenerate
// with `npm run e2e:visual:update` on Windows when an intentional UI change lands. Animations
// are disabled and dynamic regions masked so a diff reflects a real layout/style regression,
// not timing or relative-time noise.

const screens: { nav: RegExp; heading: RegExp; testId: string; name: string }[] = [
  { nav: /Dashboard/, heading: /Dashboard/, testId: 'page-dashboard', name: 'dashboard' },
  { nav: /Catalog/, heading: /Catalog/, testId: 'page-catalog', name: 'catalog' },
  { nav: /Competitors/, heading: /Competitors/, testId: 'page-competitors', name: 'competitors' },
  { nav: /Compliance/, heading: /Compliance/, testId: 'page-compliance', name: 'compliance' },
];

for (const screen of screens) {
  test(`visual: ${screen.name}`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: screen.nav }).click();
    await expect(page.getByTestId(screen.testId)).toBeVisible();
    await expect(page.getByRole('heading', { name: screen.heading }).first()).toBeVisible();

    // Wait for any data/network activity to settle before capturing the baseline.
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot(`${screen.name}.png`, {
      fullPage: true,
      animations: 'disabled',
      // The Topbar live-pill renders a wall-clock time that ticks every 5s — mask it so a diff
      // reflects a real layout/style regression, not the moving clock.
      mask: [page.locator('.live-pill')],
      // Tiny tolerance for cross-run antialiasing noise.
      maxDiffPixelRatio: 0.01,
    });
  });
}
