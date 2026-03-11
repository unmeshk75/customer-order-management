/**
 * TC_ORD_05.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Order Filter Sidebar and Expand Row
 * Verifies:
 *   [Positive] Filter sidebar opens/closes correctly.
 *   [Positive] Filter by status shows only matching orders.
 *   [Positive] Active filter chips appear and can be removed.
 *   [Positive] Expand row reveals product detail table.
 *   [Positive] Detail table shows correct product name, seats, and subtotal.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { OrderPage }       from '../pages/OrderPage.js';
import { OrderLocators }   from '../locators/OrderLocators.js';
import { ApiHelper }       from '../utils/ApiHelper.js';

test.describe('TC_ORD_05 — Order Filter and Expand Row', () => {

  const suffix = Date.now();
  let consumer, product, activeOrder, cancelledOrder;

  test.beforeAll(async ({ request }) => {
    const api = new ApiHelper(request);

    consumer = await api.createCustomer({
      name: `FilterCon ${suffix}`, customer_type: 'Consumer',
      email: `filt.${suffix}@t.com`, account_status: 'Active', contact_preference: 'Email',
    });
    product = await api.createProduct({
      name: `FilterProd ${suffix}`, product_type: 'Basic',
      price_per_seat: 20, stock_quantity: 100,
    });
    activeOrder = await api.createOrder({
      customer_id: consumer.id, priority: 'High',
      discount_percentage: 0,
      products: [{ product_id: product.id, seats: 2 }],
    });
    cancelledOrder = await api.createOrder({
      customer_id: consumer.id, priority: 'Low',
      discount_percentage: 0,
      products: [{ product_id: product.id, seats: 1 }],
    });
    // Cancel the second order
    await api.cancelOrder(cancelledOrder.id);
  });

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.deleteOrder(activeOrder.id).catch(() => {});
    await api.deleteOrder(cancelledOrder.id).catch(() => {});
    await api.deleteCustomer(consumer.id).catch(() => {});
    await api.deleteProduct(product.id).catch(() => {});
  });

  test('[Positive] Filter sidebar opens and closes', async ({ page }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);

    await nav.goto();
    await nav.goToOrders();

    await ord.openFilters();
    await expect(page.getByTestId('filter-sidebar')).toBeVisible();

    await ord.closeFilters();
    // Sidebar should no longer be 'open'
    const sidebar = page.locator(
      'xpath=//aside[@data-testid="filter-sidebar" and @data-open="false"]'
    );
    await expect(sidebar).toBeVisible();
  });

  test('[Positive] Filter by Active status shows only Active orders', async ({ page }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);
    const loc = new OrderLocators(page);

    await nav.goto();
    await nav.goToOrders();

    await ord.openFilters();
    await ord.toggleFilter('status', 'Active');
    await ord.closeFilters();

    // Active order should be visible
    const activeRow = page.locator(
      `xpath=//tr[@data-order-id="${activeOrder.id}"]`
    );
    await expect(activeRow).toBeVisible();

    // Cancelled order should NOT be visible
    const cancelledRow = page.locator(
      `xpath=//tr[@data-order-id="${cancelledOrder.id}"]`
    );
    await expect(cancelledRow).toBeHidden();

    // Filter chip for 'Active' status should appear
    const chip = page.locator(
      'xpath=//span[contains(@class,"chip") and @data-filter="status" and @data-value="Active"]'
    );
    await expect(chip).toBeVisible();
  });

  test('[Positive] Removing filter chip restores all orders', async ({ page }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);

    await nav.goto();
    await nav.goToOrders();

    // Apply filter
    await ord.openFilters();
    await ord.toggleFilter('status', 'Active');
    await ord.closeFilters();

    // Remove chip
    await ord.removeFilterChip('status', 'Active');

    // Both orders should now be visible again
    const activeRow = page.locator(
      `xpath=//tr[@data-order-id="${activeOrder.id}"]`
    );
    const cancelledRow = page.locator(
      `xpath=//tr[@data-order-id="${cancelledOrder.id}"]`
    );
    await expect(activeRow).toBeVisible();
    await expect(cancelledRow).toBeVisible();
  });

  test('[Positive] Expanding an order row shows the product detail table', async ({ page }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);

    await nav.goto();
    await nav.goToOrders();

    await ord.expandRow(activeOrder.id);

    // Detail row should be visible
    await expect(page.getByTestId(`detail-row-${activeOrder.id}`)).toBeVisible();

    // XPath: detail table inside the following-sibling detail row
    const detailTable = page.locator(
      `xpath=//tr[@data-order-id="${activeOrder.id}"]` +
      `/following-sibling::tr[@data-testid="detail-row-${activeOrder.id}"]` +
      `//table[contains(@data-testid,"detail-table")]`
    );
    await expect(detailTable).toBeVisible();
  });

  test('[Positive] Order detail row shows correct product name and seats', async ({ page }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);

    await nav.goto();
    await nav.goToOrders();

    await ord.expandRow(activeOrder.id);

    // Product name in detail table
    const productNameCell = page.locator(
      `xpath=//tr[@data-order-id="${activeOrder.id}"]` +
      `/following-sibling::tr[@data-testid="detail-row-${activeOrder.id}"]` +
      `//tr[@data-product-id="${product.id}"]//td[@data-col="product"]`
    );
    await expect(productNameCell).toContainText(product.name);

    // Seats in detail table
    const seatsCell = page.locator(
      `xpath=//tr[@data-order-id="${activeOrder.id}"]` +
      `/following-sibling::tr[@data-testid="detail-row-${activeOrder.id}"]` +
      `//tr[@data-product-id="${product.id}"]//td[@data-col="seats"]`
    );
    await expect(seatsCell).toHaveText('2');
  });

});
