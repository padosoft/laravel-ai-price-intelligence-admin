import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('admin SPA boots', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('app-boot')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'price-intel · admin' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});
