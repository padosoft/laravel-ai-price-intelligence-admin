import { test, expect } from '@playwright/test';

// Visual-regression baselines on key screens, rendered against the deterministic MSW mock
// preview so screenshots are stable. Baselines are platform-suffixed by Playwright and are
// generated on Linux (the CI platform) via the official Playwright Docker image — see
// `npm run e2e:visual:baseline`. Animations are disabled and dynamic regions masked so a diff
// reflects a real layout/style regression, not timing or relative-time noise.

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

    // Let any entrance transitions settle; animations are disabled for the comparison.
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot(`${screen.name}.png`, {
      fullPage: true,
      animations: 'disabled',
      // Relative timestamps / sparklines can jitter; absorb sub-1% AA noise across runs.
      maxDiffPixelRatio: 0.01,
    });
  });
}
