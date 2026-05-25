import { defineConfig, devices } from '@playwright/test';

// Visual-regression project. Runs the deterministic MSW mock preview and compares
// `toHaveScreenshot` baselines. Baselines are OS-specific (font antialiasing differs across
// platforms), so this suite runs on the SAME OS the baselines were generated on — see the
// `visual` CI job (windows-latest) and `npm run e2e:visual:update` to regenerate.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/visual.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
