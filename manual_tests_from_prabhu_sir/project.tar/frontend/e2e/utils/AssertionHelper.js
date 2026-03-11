/**
 * AssertionHelper.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom assertion helpers that wrap Playwright's expect() with
 * domain-specific, readable assertion methods.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { expect } from '@playwright/test';

export class AssertionHelper {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Visibility assertions
  // ══════════════════════════════════════════════════════════════════════════

  async assertVisible(locator, description = '') {
    await expect(locator, description).toBeVisible();
  }

  async assertHidden(locator, description = '') {
    await expect(locator, description).toBeHidden();
  }

  async assertEnabled(locator, description = '') {
    await expect(locator, description).toBeEnabled();
  }

  async assertDisabled(locator, description = '') {
    await expect(locator, description).toBeDisabled();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Text assertions
  // ══════════════════════════════════════════════════════════════════════════

  async assertText(locator, expected) {
    await expect(locator).toHaveText(expected);
  }

  async assertContainsText(locator, substring) {
    await expect(locator).toContainText(substring);
  }

  async assertNotContainsText(locator, substring) {
    await expect(locator).not.toContainText(substring);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Count / list assertions
  // ══════════════════════════════════════════════════════════════════════════

  async assertCount(locator, count) {
    await expect(locator).toHaveCount(count);
  }

  async assertCountGreaterThan(locator, min) {
    const count = await locator.count();
    expect(count).toBeGreaterThan(min);
  }

  async assertCountAtLeast(locator, min) {
    const count = await locator.count();
    expect(count).toBeGreaterThanOrEqual(min);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Value assertions
  // ══════════════════════════════════════════════════════════════════════════

  async assertInputValue(locator, expected) {
    await expect(locator).toHaveValue(expected);
  }

  async assertSelectValue(locator, expected) {
    await expect(locator).toHaveValue(expected);
  }

  async assertAttribute(locator, attr, value) {
    await expect(locator).toHaveAttribute(attr, value);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Numeric / business assertions
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Assert that a numeric locator's value is strictly greater than a minimum.
   */
  async assertNumericGreaterThan(locator, min) {
    const text = (await locator.textContent()).trim();
    const val  = parseFloat(text.replace(/[$,]/g, ''));
    expect(val).toBeGreaterThan(min);
  }

  /**
   * Assert that the stock count decreased after an operation.
   * @param {number} before
   * @param {number} after
   */
  assertStockDecreased(before, after) {
    expect(after).toBeLessThan(before);
  }

  /**
   * Assert that the stock count increased after a cancellation.
   * @param {number} before
   * @param {number} after
   */
  assertStockIncreased(before, after) {
    expect(after).toBeGreaterThan(before);
  }

  /**
   * Assert that a dashboard count increased by a specific amount.
   * @param {number} before
   * @param {number} after
   * @param {number} delta
   */
  assertCountIncreasedBy(before, after, delta = 1) {
    expect(after - before).toBe(delta);
  }

  /**
   * Assert that a dashboard count decreased by a specific amount.
   */
  assertCountDecreasedBy(before, after, delta = 1) {
    expect(before - after).toBe(delta);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Customer-specific assertions
  // ══════════════════════════════════════════════════════════════════════════

  /** Assert state SELECT is visible (US country). */
  async assertStateSelectVisible() {
    await expect(this.page.getByTestId('customer-state-select')).toBeVisible();
  }

  /** Assert state INPUT is visible and disabled (non-US country). */
  async assertStateInputDisabled() {
    const input = this.page.getByTestId('customer-state-input');
    await expect(input).toBeVisible();
    await expect(input).toBeDisabled();
  }

  /** Assert company name field is visible. */
  async assertCompanyNameVisible() {
    await expect(this.page.getByTestId('customer-company-input')).toBeVisible();
  }

  /** Assert company name field is NOT visible. */
  async assertCompanyNameHidden() {
    await expect(this.page.getByTestId('customer-company-input')).toBeHidden();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Product restriction assertions
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Assert that available product options contain ONLY the expected types.
   * @param {string[]} actualOptions  - visible label strings from the select
   * @param {string[]} allowedTypes   - e.g. ['Basic', 'Professional']
   */
  assertProductOptionsMatchAllowedTypes(actualOptions, allowedTypes) {
    for (const label of actualOptions) {
      const matchesAny = allowedTypes.some(t => label.includes(t));
      expect(matchesAny, `Product option "${label}" not allowed for this customer type`).toBe(true);
    }
  }

  /**
   * Assert that none of the available product options contain a forbidden type.
   * @param {string[]} actualOptions
   * @param {string[]} forbiddenTypes
   */
  assertProductOptionsExcludeForbiddenTypes(actualOptions, forbiddenTypes) {
    for (const label of actualOptions) {
      for (const forbidden of forbiddenTypes) {
        expect(
          label.includes(forbidden),
          `Forbidden product type "${forbidden}" found in options: "${label}"`
        ).toBe(false);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Order total calculation assertion
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Assert that a discounted total equals the expected value within tolerance.
   * @param {number} subtotal
   * @param {number} discountPct
   * @param {number} actualTotal  - value read from the UI
   */
  assertDiscountedTotal(subtotal, discountPct, actualTotal) {
    const expected = parseFloat((subtotal * (1 - discountPct / 100)).toFixed(2));
    expect(Math.abs(actualTotal - expected)).toBeLessThan(0.02);
  }
}
