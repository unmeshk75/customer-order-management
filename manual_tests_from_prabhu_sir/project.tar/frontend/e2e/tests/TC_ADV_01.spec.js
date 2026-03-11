/**
 * TC_ADV_01.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Advanced Scenarios
 *   1. Customer with orders — expand row shows order history.
 *   2. Delete customer with associated orders — cascade delete removes orders.
 *   3. Priority filter on orders (compound filter).
 *   4. Order with Critical priority displays correct priority badge.
 *   5. Customer account status badge reflects status correctly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { CustomerPage }    from '../pages/CustomerPage.js';
import { OrderPage }       from '../pages/OrderPage.js';
import { ApiHelper }       from '../utils/ApiHelper.js';

test.describe('TC_ADV_01 — Advanced Complex Scenarios', () => {

  test('[ADV] Customer row expansion shows order history', async ({ page, request }) => {
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);
    const api  = new ApiHelper(request);
    const suffix = Date.now();

    const { customer, product, order } = await api.setupConsumerOrderWithBasic(suffix);

    await nav.goto();
    await nav.goToCustomers();

    // Expand the customer row
    await cust.expandRow(customer.id);

    // Detail row should be visible
    await expect(page.getByTestId(`detail-row-${customer.id}`)).toBeVisible();

    // The detail table should contain the order
    const orderIdCell = page.locator(
      `xpath=//tr[@data-testid="detail-row-${customer.id}"]` +
      `//tr[@data-order-id="${order.id}"]//td[@data-col="order-id"]`
    );
    await expect(orderIdCell).toContainText(String(order.id));

    // Collapse the row
    await cust.collapseRow(customer.id);
    await expect(page.getByTestId(`detail-row-${customer.id}`)).toBeHidden();

    // Cleanup
    await api.deleteOrder(order.id).catch(() => {});
    await api.deleteCustomer(customer.id).catch(() => {});
    await api.deleteProduct(product.id).catch(() => {});
  });

  test('[ADV] Deleting a customer also removes their associated orders (cascade)', async ({ page, request }) => {
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);
    const api  = new ApiHelper(request);
    const suffix = Date.now();

    const { customer, product, order } = await api.setupConsumerOrderWithBasic(suffix);

    await nav.goto();
    await nav.goToCustomers();

    // Delete customer — modal confirms cascade
    await cust.deleteCustomer(customer.id);

    // Customer row should be gone
    const customerRow = page.locator(
      `xpath=//tr[@data-customer-id="${customer.id}"]`
    );
    await expect(customerRow).toBeHidden();

    // Verify order is also deleted via API
    const allOrders = await api.getAllOrders();
    const orderStillExists = allOrders.some(o => o.id === order.id);
    expect(orderStillExists).toBe(false);

    await api.deleteProduct(product.id).catch(() => {});
  });

  test('[ADV] Compound filter (Status + Priority) narrows order results', async ({ page, request }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);
    const api = new ApiHelper(request);
    const suffix = Date.now();

    const consumer = await api.createCustomer({
      name: `CompoundCon ${suffix}`, customer_type: 'Consumer',
      email: `comp.${suffix}@t.com`, account_status: 'Active', contact_preference: 'Email',
    });
    const product = await api.createProduct({
      name: `CompoundProd ${suffix}`, product_type: 'Basic',
      price_per_seat: 10, stock_quantity: 100,
    });

    const hiOrder = await api.createOrder({
      customer_id: consumer.id, priority: 'High',
      discount_percentage: 0,
      products: [{ product_id: product.id, seats: 1 }],
    });
    const lowOrder = await api.createOrder({
      customer_id: consumer.id, priority: 'Low',
      discount_percentage: 0,
      products: [{ product_id: product.id, seats: 1 }],
    });

    await nav.goto();
    await nav.goToOrders();

    // Apply both Status=Active AND Priority=High filters
    await ord.openFilters();
    await ord.toggleFilter('status', 'Active');
    await ord.toggleFilter('priority', 'High');
    await ord.closeFilters();

    // High priority order visible
    const hiRow = page.locator(`xpath=//tr[@data-order-id="${hiOrder.id}"]`);
    await expect(hiRow).toBeVisible();

    // Low priority order NOT visible (filtered out)
    const lowRow = page.locator(`xpath=//tr[@data-order-id="${lowOrder.id}"]`);
    await expect(lowRow).toBeHidden();

    // Two filter chips should appear
    const chips = page.locator('[data-testid="filter-chips"] .chip');
    await expect(chips).toHaveCount(2);

    // Cleanup
    await api.deleteOrder(hiOrder.id).catch(() => {});
    await api.deleteOrder(lowOrder.id).catch(() => {});
    await api.deleteCustomer(consumer.id).catch(() => {});
    await api.deleteProduct(product.id).catch(() => {});
  });

  test('[ADV] Critical priority order displays correct priority badge', async ({ page, request }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);
    const api = new ApiHelper(request);
    const suffix = Date.now();

    const { customer, product, order: baseOrder } = await api.setupConsumerOrderWithBasic(suffix);
    // Re-create with Critical priority
    await api.deleteOrder(baseOrder.id).catch(() => {});
    const criticalOrder = await api.createOrder({
      customer_id: consumer.id ?? customer.id,
      priority: 'Critical',
      discount_percentage: 0,
      products: [{ product_id: product.id, seats: 1 }],
    });

    await nav.goto();
    await nav.goToOrders();

    // Priority badge for critical — XPath contains() on class
    const priorityBadge = page.locator(
      `xpath=//tr[@data-order-id="${criticalOrder.id}"]` +
      `//span[contains(@class,"priority-badge") and contains(@class,"priority-critical")]`
    );
    await expect(priorityBadge).toBeVisible();
    await expect(priorityBadge).toHaveText('Critical');

    await api.deleteOrder(criticalOrder.id).catch(() => {});
    await api.deleteCustomer(customer.id).catch(() => {});
    await api.deleteProduct(product.id).catch(() => {});
  });

  test('[ADV] Suspended customer account shows correct status badge in list', async ({ page, request }) => {
    const nav  = new NavigationPage(page);
    const api  = new ApiHelper(request);
    const suffix = Date.now();

    const suspended = await api.createCustomer({
      name: `Suspended ${suffix}`, customer_type: 'Consumer',
      email: `susp.${suffix}@t.com`, account_status: 'Suspended', contact_preference: 'Email',
    });

    await nav.goto();
    await nav.goToCustomers();

    // XPath: status badge with 'Suspended' text inside that customer's row
    const badge = page.locator(
      `xpath=//tr[@data-customer-id="${suspended.id}"]` +
      `//span[contains(@class,"status-badge") and contains(@class,"status-suspended")]`
    );
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('Suspended');

    await api.deleteCustomer(suspended.id).catch(() => {});
  });

});
