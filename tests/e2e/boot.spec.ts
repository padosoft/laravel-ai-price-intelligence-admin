import { test, expect } from '@playwright/test';

test('admin SPA boots', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('app-boot')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'price-intel · admin' })).toBeVisible();
});
