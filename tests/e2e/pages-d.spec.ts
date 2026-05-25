import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('system screens render via the sidebar', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /Repricer/ }).click();
  await expect(page.getByTestId('page-repricer')).toBeVisible();
  await expect(page.getByText('Beat Amazon by 2% with margin floor').first()).toBeVisible();

  await page.getByRole('button', { name: /Alerts/ }).click();
  await expect(page.getByTestId('page-alerts')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Alerts inbox' })).toBeVisible();

  await page.getByRole('button', { name: /Webhooks/ }).click();
  await expect(page.getByTestId('page-webhooks')).toBeVisible();
  await expect(page.getByText('https://marginos.acme.it/webhooks/price-intel')).toBeVisible();

  await page.getByRole('button', { name: /API keys/ }).click();
  await expect(page.getByTestId('page-api-keys')).toBeVisible();
  await expect(page.getByText('MarginOS production')).toBeVisible();

  await page.getByRole('button', { name: /Compliance/ }).click();
  await expect(page.getByTestId('page-compliance')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Compliance checks' })).toBeVisible();

  await page.getByRole('button', { name: /Settings/ }).click();
  await expect(page.getByTestId('page-settings')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  // color-contrast is enforced (AA-darkened tokens); only heading-order remains deferred.
  const results = await new AxeBuilder({ page })
    .disableRules(['heading-order'])
    .analyze();
  expect(results.violations).toHaveLength(0);
});

test('api key generation reveals the secret once', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /API keys/ }).click();
  await page.getByRole('button', { name: /Generate key/ }).click();
  await expect(page.getByText(/New key — shown once/)).toBeVisible();
});
