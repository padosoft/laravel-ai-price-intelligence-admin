import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('admin shell boots and navigates', async ({ page }) => {
  await page.goto('/');

  // Sidebar brand + default route.
  await expect(page.getByText('price-intel')).toBeVisible();
  await expect(page.getByTestId('page-dashboard')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // Navigate via the sidebar.
  await page.getByRole('button', { name: /Catalog/ }).click();
  await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});
