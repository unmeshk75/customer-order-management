const { defineConfig, devices } = require('@playwright/test');

/**
 * Scoped config for automation/e2e-generated/.
 *
 * Used when running a single generated spec from inside this directory:
 *   cd automation/e2e-generated/tests
 *   npx playwright test TC_CUST_03.spec.js
 *
 * Playwright walks up parent directories looking for a config file, so it
 * finds this file when invoked from the tests/ sub-directory.
 *
 * testDir is set to ./tests so only generated specs are in scope — the
 * e2e-sample and other suites are excluded.
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    actionTimeout: 0,
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
});
