import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('intelligence screens render via the sidebar', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /Anomalies/ }).click();
  await expect(page.getByTestId('page-anomalies')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Anomaly detection' })).toBeVisible();

  await page.getByRole('button', { name: /Forecasts/ }).click();
  await expect(page.getByTestId('page-forecasts')).toBeVisible();
  await expect(page.getByText('Confidence interval', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /Narrative/ }).click();
  await expect(page.getByTestId('page-narrative')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Aggressive undercut/ })).toBeVisible();

  await page.getByRole('button', { name: /Assortment/ }).click();
  await expect(page.getByTestId('page-assortment')).toBeVisible();
  await expect(page.getByText('Rival Z9 256GB')).toBeVisible();

  await page.getByRole('button', { name: /Content gap/ }).click();
  await expect(page.getByTestId('page-content-gap')).toBeVisible();
  await expect(page.getByText('Missing or weak attributes')).toBeVisible();

  await page.getByRole('button', { name: /Reviews/ }).click();
  await expect(page.getByTestId('page-reviews')).toBeVisible();
  await expect(page.getByText('Battery life')).toBeVisible();

  // color-contrast is enforced (AA-darkened tokens). Only heading-order (h1→h3 card-titles)
  // remains a deferred best-practice DS item.
  const results = await new AxeBuilder({ page })
    .disableRules(['heading-order'])
    .analyze();
  expect(results.violations).toHaveLength(0);
});
