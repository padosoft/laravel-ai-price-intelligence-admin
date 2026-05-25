import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('matches review: candidate renders and approve advances the queue', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Matches/ }).click();
  await expect(page.getByTestId('page-matches')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Matches review' })).toBeVisible();
  await expect(page.getByText(/Acme X1 Pro 5G 128GB/)).toBeVisible();

  // Approve → toast + advance to the next candidate.
  await page.getByRole('button', { name: /Confirm/ }).click();
  await expect(page.getByText('Match approved')).toBeVisible();
  await expect(page.getByText(/AirBuds 3 Pro/)).toBeVisible();
});

test('competitors: list, host filter, and drill into detail', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Competitors/ }).click();
  await expect(page.getByTestId('page-competitors')).toBeVisible();
  await expect(page.getByText('https://trovaprezzi.it/x')).toBeVisible();

  // Filter to mediaworld → trovaprezzi row disappears.
  await page.getByRole('button', { name: /^mediaworld\.it/ }).click();
  await expect(page.getByText('https://trovaprezzi.it/x')).toBeHidden();

  // Back to all, then open a listing's detail.
  await page.getByRole('button', { name: 'All hosts' }).click();
  await page.getByText('https://amazon.it/dp/B0XYZ').click();
  await expect(page.getByTestId('page-competitor-detail')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Price history' })).toBeVisible();

  // Tab switch.
  await page.getByRole('button', { name: 'Audit' }).click();
  await expect(page.getByText('Fetch audit log')).toBeVisible();

  // color-contrast (.badge/.price-delta token ratios) and heading-order (the global h1→h3
  // card-title pattern) are inherited verbatim from the pixel-perfect prototype's design
  // system; the contrast/dark-parity sweep is the dedicated A7 phase. Everything else
  // (roles, names, labels, landmarks) must be clean here.
  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast', 'heading-order'])
    .analyze();
  expect(results.violations).toHaveLength(0);
});

test('prices explorer: product select and competitor table', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Prices/ }).click();
  await expect(page.getByTestId('page-prices')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Prices explorer' })).toBeVisible();
  await expect(page.getByLabel('Product')).toBeVisible();
  await expect(page.getByText('Competitor prices')).toBeVisible();
});
