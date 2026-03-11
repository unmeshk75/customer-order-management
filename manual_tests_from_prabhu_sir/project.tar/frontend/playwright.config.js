/**
 * playwright.config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Playwright configuration for the Customer Order Management automation suite.
 *
 * Environment variables:
 *   FRONTEND_URL   — Frontend base URL  (default: http://localhost:5173)
 *   API_BASE_URL   — Backend API URL    (default: http://localhost:8000/api)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // ── Test discovery ────────────────────────────────────────────────────────
  testDir: './e2e/tests',

  // ── Timeouts ──────────────────────────────────────────────────────────────
  timeout:         60 * 1000,   // 60 s per test
  expect: {
    timeout:       10 * 1000,   // 10 s for each expect() assertion
  },

  // ── Parallelism ───────────────────────────────────────────────────────────
  fullyParallel:   true,
  workers:         process.env.CI ? 1 : 2,

  // ── CI safety ─────────────────────────────────────────────────────────────
  forbidOnly:      !!process.env.CI,
  retries:         process.env.CI ? 2 : 0,

  // ── Reporters ─────────────────────────────────────────────────────────────
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // ── Global settings ───────────────────────────────────────────────────────
  use: {
    baseURL:        process.env.FRONTEND_URL || 'http://localhost:5173',
    actionTimeout:  15 * 1000,   // 15 s per action (click, fill, etc.)
    navigationTimeout: 30 * 1000,

    // Screenshot only on failure
    screenshot:     'only-on-failure',
    // Collect trace on first retry
    trace:          'on-first-retry',
    // Video on retry
    video:          'retain-on-failure',

    // Headless by default; set HEADLESS=false to watch locally
    headless:       process.env.HEADLESS !== 'false',
  },

  // ── Projects ──────────────────────────────────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
    // Uncomment to run on Firefox or WebKit:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
