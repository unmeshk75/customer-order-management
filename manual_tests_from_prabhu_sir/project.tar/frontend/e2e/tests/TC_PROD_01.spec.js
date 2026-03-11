/**
 * TC_PROD_01.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Create a product successfully (positive) + type filter
 * Verifies:
 *   [Positive] Product is created and visible in the list with correct data.
 *   [Positive] Product type filter shows only matching rows.
 *   [Negative] Creating a product with price = 0 shows a validation error.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { ProductPage }     from '../pages/ProductPage.js';
import { ApiHelper }       from '../utils/ApiHelper.js';
import { TestDataFactory } from '../utils/TestDataFactory.js';
import { AssertionHelper } from '../utils/AssertionHelper.js';

test.describe('TC_PROD_01 — Create Product and Filter', () => {

  test('[Positive] Create a Basic product and verify it appears in the list', async ({ page, request }) => {
    const nav    = new NavigationPage(page);
    const prod   = new ProductPage(page);
    const assert = new AssertionHelper(page);
    const data   = TestDataFactory.basicProduct();

    await nav.goto();
    await nav.goToProducts();
    await prod.openCreateForm();

    await prod.fillProductForm(data);
    await prod.submitForm();

    // Verify name in table
    const nameCell = page.locator(
      `xpath=//table[@id="products-table"]//td[normalize-space(text())="${data.name}"]`
    );
    await expect(nameCell).toBeVisible();

    // Verify type via following-sibling from name cell
    const typeCell = page.locator(
      `xpath=//td[normalize-space(text())="${data.name}"]/following-sibling::td[contains(text(),"Basic")]`
    );
    await expect(typeCell).toBeVisible();

    // Cleanup
    const api = new ApiHelper(request);
    const products = await api.getAllProducts();
    const created  = products.find(p => p.name === data.name);
    if (created) await api.deleteProduct(created.id).catch(() => {});
  });

  test('[Positive] Product type filter shows only selected type', async ({ page, request }) => {
    const nav  = new NavigationPage(page);
    const prod = new ProductPage(page);
    const api  = new ApiHelper(request);
    const s    = Date.now();

    // Create two products of different types
    const p1 = await api.createProduct({ name: `TeamsProd ${s}`, product_type: 'Teams', price_per_seat: 50, stock_quantity: 10 });
    const p2 = await api.createProduct({ name: `BasicProd ${s}`, product_type: 'Basic', price_per_seat: 10, stock_quantity: 10 });

    await nav.goto();
    await nav.goToProducts();

    // Filter by Teams
    await prod.filterByType('Teams');

    // Teams product should be visible
    const teamsRow = page.locator(
      `xpath=//table[@id="products-table"]//tr[@data-product-id="${p1.id}"]`
    );
    await expect(teamsRow).toBeVisible();

    // Basic product row should not be visible
    const basicRow = page.locator(
      `xpath=//table[@id="products-table"]//tr[@data-product-id="${p2.id}"]`
    );
    await expect(basicRow).toBeHidden();

    // Filter count reflects filtered results
    const filterCount = page.locator(
      'xpath=//div[@data-testid="product-filter-bar"]//span[contains(@class,"filter-count")]'
    );
    await expect(filterCount).toContainText('Showing');

    // Cleanup
    await api.deleteProduct(p1.id).catch(() => {});
    await api.deleteProduct(p2.id).catch(() => {});
  });

  test('[Negative] Creating a product with zero price shows error', async ({ page }) => {
    const nav  = new NavigationPage(page);
    const prod = new ProductPage(page);
    const data = TestDataFactory.invalidPriceProduct();

    await nav.goto();
    await nav.goToProducts();
    await prod.openCreateForm();

    await prod.fillName(data.name);
    await prod.selectType(data.type);
    await prod.fillPrice(data.price);
    await prod.fillStock(data.stock);

    await prod.submitFormExpectError();

    const error = await prod.getFormError();
    expect(error).toContain('must be a positive number');
  });

  test('[Negative] Creating a product with negative price shows error', async ({ page }) => {
    const nav  = new NavigationPage(page);
    const prod = new ProductPage(page);
    const data = TestDataFactory.negativePriceProduct();

    await nav.goto();
    await nav.goToProducts();
    await prod.openCreateForm();

    await prod.fillName(data.name);
    await prod.selectType(data.type);
    await prod.fillPrice(data.price);
    await prod.fillStock(data.stock);

    await prod.submitFormExpectError();

    const error = await prod.getFormError();
    expect(error).toContain('must be a positive number');
  });

});
