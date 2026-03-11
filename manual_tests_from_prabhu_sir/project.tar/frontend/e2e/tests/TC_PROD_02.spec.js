/**
 * TC_PROD_02.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Edit Product — stock and price update correctly
 * Verifies:
 *   [Positive] Editing a product's stock quantity reflects in the list.
 *   [Positive] Stock badge class changes based on quantity level.
 *   [Positive] Delete product works when it has no orders.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { ProductPage }     from '../pages/ProductPage.js';
import { ProductLocators } from '../locators/ProductLocators.js';
import { ApiHelper }       from '../utils/ApiHelper.js';

test.describe('TC_PROD_02 — Edit and Delete Product', () => {

  let productId;
  let suffix;

  test.beforeEach(async ({ request }) => {
    suffix = Date.now();
    const api = new ApiHelper(request);
    const p = await api.createProduct({
      name: `EditProduct ${suffix}`,
      product_type: 'Professional',
      price_per_seat: 25.00,
      stock_quantity: 75,
    });
    productId = p.id;
  });

  test.afterEach(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.deleteProduct(productId).catch(() => {});
  });

  test('[Positive] Editing product stock is reflected in the table', async ({ page }) => {
    const nav  = new NavigationPage(page);
    const prod = new ProductPage(page);
    const loc  = new ProductLocators(page);

    await nav.goto();
    await nav.goToProducts();

    await prod.openEditForm(productId);

    // Verify form heading
    const heading = page.locator('xpath=//div[contains(@class,"form-container")]//h3');
    await expect(heading).toHaveText('Edit Product');

    // Update stock quantity
    await prod.fillStock(200);
    await prod.submitForm();

    // Verify updated stock in the list
    const stockBadge = loc.productStock(productId);
    await expect(stockBadge).toHaveText('200');

    // Stock badge should have green class (>=50)
    const badgeClass = await stockBadge.getAttribute('class');
    expect(badgeClass).toContain('stock-green');
  });

  test('[Positive] Low-stock badge turns red when quantity < 10', async ({ page, request }) => {
    const nav  = new NavigationPage(page);
    const prod = new ProductPage(page);
    const api  = new ApiHelper(request);
    const loc  = new ProductLocators(page);
    const s2   = Date.now() + 5000;

    // Create a product with low stock directly via API
    const lowProd = await api.createProduct({
      name: `LowStock ${s2}`,
      product_type: 'Basic',
      price_per_seat: 5,
      stock_quantity: 3,
    });

    await nav.goto();
    await nav.goToProducts();

    // XPath: stock badge with stock-red class inside the low-stock product row
    const redBadge = page.locator(
      `xpath=//tr[@data-product-id="${lowProd.id}"]` +
      `//span[contains(@class,"stock-badge") and contains(@class,"stock-red")]`
    );
    await expect(redBadge).toBeVisible();

    await api.deleteProduct(lowProd.id).catch(() => {});
  });

  test('[Positive] Yellow stock badge appears for quantities 10–49', async ({ page, request }) => {
    const nav  = new NavigationPage(page);
    const prod = new ProductPage(page);
    const api  = new ApiHelper(request);
    const s3   = Date.now() + 9000;

    const yellowProd = await api.createProduct({
      name: `YellowStock ${s3}`,
      product_type: 'Teams',
      price_per_seat: 45,
      stock_quantity: 25,
    });

    await nav.goto();
    await nav.goToProducts();

    // XPath: stock badge with stock-yellow class
    const yellowBadge = page.locator(
      `xpath=//tr[@data-product-id="${yellowProd.id}"]` +
      `//span[contains(@class,"stock-badge") and contains(@class,"stock-yellow")]`
    );
    await expect(yellowBadge).toBeVisible();

    await api.deleteProduct(yellowProd.id).catch(() => {});
  });

  test('[Positive] Delete product (no orders) removes it from the list', async ({ page, request }) => {
    const nav  = new NavigationPage(page);
    const prod = new ProductPage(page);
    const api  = new ApiHelper(request);
    const s4   = Date.now() + 13000;

    const toDelete = await api.createProduct({
      name: `DeleteMe ${s4}`,
      product_type: 'Basic',
      price_per_seat: 10,
      stock_quantity: 50,
    });

    await nav.goto();
    await nav.goToProducts();

    await prod.deleteProduct(toDelete.id);

    // Row should no longer be in the table
    const deletedRow = page.locator(
      `xpath=//tr[@data-product-id="${toDelete.id}"]`
    );
    await expect(deletedRow).toBeHidden();
  });

});
