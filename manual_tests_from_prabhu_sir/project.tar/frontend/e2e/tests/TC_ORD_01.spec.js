/**
 * TC_ORD_01.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Customer Type → Product Restriction (Consumer)
 * Business Rule: Consumer customers can ONLY order Basic and Professional products.
 * Verifies:
 *   [Positive] Consumer sees Basic and Professional options in the product dropdown.
 *   [Negative] Consumer does NOT see Teams or Ultra-Enterprise in product dropdown.
 *   [Positive] Info text confirms the allowed product types.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { OrderPage }       from '../pages/OrderPage.js';
import { ApiHelper }       from '../utils/ApiHelper.js';
import { AssertionHelper } from '../utils/AssertionHelper.js';

test.describe('TC_ORD_01 — Consumer Product Restrictions', () => {

  let consumer, basicProd, professionalProd, teamsProd;
  const suffix = Date.now();

  test.beforeAll(async ({ request }) => {
    const api = new ApiHelper(request);
    consumer         = await api.createCustomer({ name: `Consumer ${suffix}`, customer_type: 'Consumer', email: `con.${suffix}@t.com`, account_status: 'Active', contact_preference: 'Email' });
    basicProd        = await api.createProduct({ name: `Basic ${suffix}`,  product_type: 'Basic',        price_per_seat: 10, stock_quantity: 50 });
    professionalProd = await api.createProduct({ name: `Prof ${suffix}`,   product_type: 'Professional', price_per_seat: 30, stock_quantity: 50 });
    teamsProd        = await api.createProduct({ name: `Teams ${suffix}`,  product_type: 'Teams',        price_per_seat: 50, stock_quantity: 50 });
  });

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.cleanupCustomersByName(`Consumer ${suffix}`).catch(() => {});
    await api.deleteProduct(basicProd.id).catch(() => {});
    await api.deleteProduct(professionalProd.id).catch(() => {});
    await api.deleteProduct(teamsProd.id).catch(() => {});
  });

  test('[Positive] Consumer product dropdown contains Basic and Professional', async ({ page }) => {
    const nav    = new NavigationPage(page);
    const ord    = new OrderPage(page);
    const assert = new AssertionHelper(page);

    await nav.goto();
    await nav.goToOrders();
    await ord.openCreateForm();

    // Step 1 — select the Consumer customer
    await ord.selectCustomerById(consumer.id);
    await ord.goToStep2();

    // Step 2 — get available product options
    const options = await ord.getAvailableProductOptions(0);

    // Should contain Basic and Professional
    assert.assertProductOptionsMatchAllowedTypes(options, ['Basic', 'Professional']);
  });

  test('[Negative] Consumer product dropdown does NOT contain Teams or Ultra-Enterprise', async ({ page }) => {
    const nav    = new NavigationPage(page);
    const ord    = new OrderPage(page);
    const assert = new AssertionHelper(page);

    await nav.goto();
    await nav.goToOrders();
    await ord.openCreateForm();

    await ord.selectCustomerById(consumer.id);
    await ord.goToStep2();

    const options = await ord.getAvailableProductOptions(0);

    // Must NOT contain Teams or Ultra-Enterprise
    assert.assertProductOptionsExcludeForbiddenTypes(options, ['Teams', 'Ultra-Enterprise']);
  });

  test('[Positive] Info text lists correct allowed product types for Consumer', async ({ page }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);

    await nav.goto();
    await nav.goToOrders();
    await ord.openCreateForm();

    await ord.selectCustomerById(consumer.id);
    await ord.goToStep2();

    const infoText = await ord.getAvailableProductsInfoText();
    expect(infoText).toContain('Consumer');
    expect(infoText).toContain('Basic');
    expect(infoText).toContain('Professional');
  });

  test('[Positive] Consumer can successfully create an order with a Basic product', async ({ page }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);

    await nav.goto();
    await nav.goToOrders();

    // The product label will contain the name we created
    const productLabel = basicProd.name;
    await ord.createOrder({
      customerName: consumer.name,
      productLabel,
      seats: 3,
    });

    // Verify the order appears in the list with the correct customer
    const customerCell = page.locator(
      `xpath=//table[@id="orders-table"]//td[contains(text(),"${consumer.name}")]`
    );
    await expect(customerCell).toBeVisible();
  });

});
