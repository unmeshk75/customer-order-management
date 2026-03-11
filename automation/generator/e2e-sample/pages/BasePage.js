/**
 * BasePage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Base class for all Page Objects.
 *
 * ❌ No hardcoded waits / timeouts anywhere.
 * ✅ Explicit locator-based waits:
 *     • locator.waitFor({ state })
 *     • expect(locator).toBeVisible/Enabled/HaveText  — built-in retry
 *     • expect(async () => …).toPass()               — custom retry loop
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { expect } from '@playwright/test';

export class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page    = page;
    this.baseURL = process.env.BASE_URL || 'http://localhost:5173';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ══════════════════════════════════════════════════════════════════════════

  /** Navigate to the application root. Waits only for 'load'. */
  async goto() {
    await this.page.goto(this.baseURL, { waitUntil: 'load' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Explicit-wait helpers  (NO hardcoded ms anywhere)
  // ══════════════════════════════════════════════════════════════════════════

  /** Wait until a locator becomes visible in the DOM. */
  async waitForVisible(locator) {
    await locator.waitFor({ state: 'visible' });
  }

  /** Wait until a locator is removed / hidden from the DOM. */
  async waitForHidden(locator) {
    await locator.waitFor({ state: 'hidden' });
  }

  /** Wait until a locator is attached to the DOM (may still be invisible). */
  async waitForAttached(locator) {
    await locator.waitFor({ state: 'attached' });
  }

  /** Wait until a locator is detached from the DOM entirely. */
  async waitForDetached(locator) {
    await locator.waitFor({ state: 'detached' });
  }

  /** Wait until a locator is enabled (interactive). */
  async waitForEnabled(locator) {
    await expect(locator).toBeEnabled();
  }

  /** Wait until a locator count reaches an expected value. */
  async waitForCount(locator, count) {
    await expect(locator).toHaveCount(count);
  }

  /** Wait until a locator count is greater than a minimum value. */
  async waitForCountGreaterThan(locator, minCount) {
    await expect(async () => {
      const c = await locator.count();
      expect(c).toBeGreaterThan(minCount);
    }).toPass();
  }

  /** Wait until a locator's text content matches an expected value. */
  async waitForText(locator, expectedText) {
    await expect(locator).toHaveText(expectedText);
  }

  /** Wait until a locator's text content contains an expected substring. */
  async waitForTextContaining(locator, substring) {
    await expect(locator).toContainText(substring);
  }

  /** Wait until a locator has a specific attribute value. */
  async waitForAttribute(locator, attribute, value) {
    await expect(locator).toHaveAttribute(attribute, value);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Branching helpers  (return booleans for if/else logic)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Returns true if the locator is currently visible.
   * Safe — never throws; returns false on any error.
   */
  async isVisible(locator) {
    return locator.isVisible().catch(() => false);
  }

  /** Returns true if the locator is currently enabled. */
  async isEnabled(locator) {
    return locator.isEnabled().catch(() => false);
  }

  /** Returns true if the locator is currently disabled. */
  async isDisabled(locator) {
    return locator.isDisabled().catch(() => true);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DOM helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** Scroll element into view before interacting. */
  async scrollTo(locator) {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Returns trimmed text content of a locator.
   * Waits for the locator to be attached before reading.
   */
  async getText(locator) {
    await this.waitForAttached(locator);
    return (await locator.textContent()).trim();
  }

  /**
   * Clear an input and fill it with a new value.
   * Waits for the field to be enabled before clearing.
   */
  async clearAndFill(locator, value) {
    await this.waitForEnabled(locator);
    await locator.clear();
    await locator.fill(value);
  }

  /**
   * Select an option in a <select> element by visible text.
   * Waits for the select to be enabled.
   */
  async selectByText(locator, text) {
    await this.waitForEnabled(locator);
    await locator.selectOption({ label: text });
  }

  /**
   * Select an option in a <select> element by value.
   * Waits for the select to be enabled.
   */
  async selectByValue(locator, value) {
    await this.waitForEnabled(locator);
    await locator.selectOption({ value });
  }

  /**
   * Scroll into view, wait for enabled, then click.
   */
  async clickWhenReady(locator) {
    await this.scrollTo(locator);
    await this.waitForEnabled(locator);
    await locator.click();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dialog helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** Register a one-time accept handler BEFORE the action that triggers it. */
  async acceptDialog() {
    this.page.once('dialog', (dialog) => dialog.accept());
  }

  /** Register a one-time dismiss handler BEFORE the action that triggers it. */
  async dismissDialog() {
    this.page.once('dialog', (dialog) => dialog.dismiss());
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Numeric extraction helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Extract a numeric value from a locator's text content.
   * Strips currency symbols and commas.
   */
  async getNumericText(locator) {
    const text = await this.getText(locator);
    return parseFloat(text.replace(/[$,]/g, '')) || 0;
  }

  /**
   * Extract an integer from a locator's text content.
   */
  async getIntText(locator) {
    const text = await this.getText(locator);
    return parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
  }
}
