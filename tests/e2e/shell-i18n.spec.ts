import { test, expect } from '@playwright/test';

test('topbar language toggle switches the nav between EN and IT', async ({ page }) => {
  await page.goto('/');
  // Demo defaults to English.
  await expect(page.getByRole('button', { name: 'Catalog' })).toBeVisible();

  // Toggle to Italian.
  await page.getByRole('button', { name: /Switch language/ }).click();
  await expect(page.getByRole('button', { name: 'Catalogo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Impostazioni' })).toBeVisible();

  // Toggle back to English.
  await page.getByRole('button', { name: /Switch language/ }).click();
  await expect(page.getByRole('button', { name: 'Catalog' })).toBeVisible();
});
