/**
 * BasePage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Base class for all Page Objects.
 *
 * ❌ REMOVED  : waitForTimeout() / hardcoded ms waits
 * ❌ REMOVED  : waitForLoadState('networkidle')   — unreliable in SPAs
 * ✅ REPLACED : explicit locator-based waits only
 *              • locator.waitFor({ state })
 *              • locator.isVisible() / isEnabled()   — for branching logic
 *              • expect(locator).toBeVisible/Enabled  — built-in retry
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { expect } from '@playwright/test';

export class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page    = page;
    this.baseURL = process.env.BASE_URL || 'http://localhost:5173';
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Navigate to the application root.
   * Waits only for 'load' (DOM + subresources) — avoids flaky 'networkidle'.
   * Concrete page navigation then waits for a visible landmark locator.
   */
  async goto() {
    await this.page.goto(this.baseURL, { waitUntil: 'load' });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Dialog helpers
  // ──────────────────────────────────────────────────────────────────────────

  /** Register a one-time accept handler BEFORE the action that triggers it. */
  async acceptDialog() {
    this.page.once('dialog', (dialog) => dialog.accept());
  }

  /** Register a one-time dismiss handler BEFORE the action that triggers it. */
  async dismissDialog() {
    this.page.once('dialog', (dialog) => dialog.dismiss());
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Explicit-wait helpers  (NO hardcoded ms anywhere)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Wait until a locator becomes visible in the DOM.
   * Uses Playwright's built-in retry loop — no ms value needed.
   * @param {import('@playwright/test').Locator} locator
   */
  async waitForVisible(locator) {
    await locator.waitFor({ state: 'visible' });
  }

  /**
   * Wait until a locator is removed / hidden from the DOM.
   * @param {import('@playwright/test').Locator} locator
   */
  async waitForHidden(locator) {
    await locator.waitFor({ state: 'hidden' });
  }

  /**
   * Wait until a locator is attached to the DOM (may still be invisible).
   * @param {import('@playwright/test').Locator} locator
   */
  async waitForAttached(locator) {
    await locator.waitFor({ state: 'attached' });
  }

  /**
   * Wait until a locator is detached from the DOM entirely.
   * @param {import('@playwright/test').Locator} locator
   */
  async waitForDetached(locator) {
    await locator.waitFor({ state: 'detached' });
  }

  /**
   * Wait until a locator is enabled (interactive).
   * Uses expect() retry semantics.
   * @param {import('@playwright/test').Locator} locator
   */
  async waitForEnabled(locator) {
    await expect(locator).toBeEnabled();
  }

  /**
   * Wait until a locator count reaches an expected value.
   * Uses expect() retry semantics.
   * @param {import('@playwright/test').Locator} locator
   * @param {number} count
   */
  async waitForCount(locator, count) {
    await expect(locator).toHaveCount(count);
  }

  /**
   * Wait until a locator count is greater than a minimum value.
   * Polls via expect() retry until condition is met.
   * @param {import('@playwright/test').Locator} locator
   * @param {number} minCount
   */
  async waitForCountGreaterThan(locator, minCount) {
    await expect(async () => {
      const c = await locator.count();
      expect(c).toBeGreaterThan(minCount);
    }).toPass();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Branching helpers  (return booleans for if/else logic)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Returns true if the locator is currently visible in the DOM.
   * Safe — never throws; returns false on any error.
   * @param {import('@playwright/test').Locator} locator
   * @returns {Promise<boolean>}
   */
  async isVisible(locator) {
    return locator.isVisible().catch(() => false);
  }

  /**
   * Returns true if the locator is currently enabled (not disabled).
   * @param {import('@playwright/test').Locator} locator
   * @returns {Promise<boolean>}
   */
  async isEnabled(locator) {
    return locator.isEnabled().catch(() => false);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DOM helpers
  // ──────────────────────────────────────────────────────────────────────────

  /** Scroll element into view before interacting. */
  async scrollTo(locator) {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Returns trimmed text content of a locator.
   * Waits for the locator to be attached before reading.
   * @param {import('@playwright/test').Locator} locator
   * @returns {Promise<string>}
   */
  async getText(locator) {
    await this.waitForAttached(locator);
    return (await locator.textContent()).trim();
  }

  /**
   * Clear an input and fill it with a new value.
   * Waits for the field to be enabled before clearing.
   * @param {import('@playwright/test').Locator} locator
   * @param {string} value
   */
  async clearAndFill(locator, value) {
    await this.waitForEnabled(locator);
    await locator.clear();
    await locator.fill(value);
  }
}


