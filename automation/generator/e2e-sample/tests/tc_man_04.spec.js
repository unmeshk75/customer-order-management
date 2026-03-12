/**
 * tc_man_04.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TC-MAN-04: Consumer Customer Sees ONLY Basic & Professional Products.
 * Business rule: Consumer customers cannot order Teams or Ultra-Enterprise.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { OrderPage }  from '../pages/OrderPage.js';
import { ApiHelper }  from '../utils/ApiHelper.js';

test.describe('TC-MAN-04: Consumer Customer — Product Type Restrictions', () => {

  let customer, basic, professional, teams, ultra;

  test.beforeAll(async ({ request }) => {
    const api    = new ApiHelper(request);
    const suffix = `tc04-${Date.now()}`;

    customer     = await api.createCustomer({ name: `Alice ${suffix}`, customer_type: 'Consumer', email: `alice.${suffix}@example.com` });
    basic        = await api.createProduct({ name: `Basic ${suffix}`,        product_type: 'Basic',           price_per_seat: 9.99 });
    professional = await api.createProduct({ name: `Prof ${suffix}`,         product_type: 'Professional',    price_per_seat: 19.99 });
    teams        = await api.createProduct({ name: `Teams ${suffix}`,        product_type: 'Teams',           price_per_seat: 29.99 });
    ultra        = await api.createProduct({ name: `Ultra ${suffix}`,        product_type: 'Ultra-Enterprise', price_per_seat: 99.99 });
  });

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.deleteCustomer(customer.id).catch(() => {});
    await api.deleteProduct(basic.id).catch(() => {});
    await api.deleteProduct(professional.id).catch(() => {});
    await api.deleteProduct(teams.id).catch(() => {});
    await api.deleteProduct(ultra.id).catch(() => {});
  });

  test('[Positive] Consumer dropdown contains Basic products', async ({ page }) => {
    const orderPage = new OrderPage(page);
    await orderPage.navigateToOrders();
    await orderPage.openCreateForm();
    await orderPage.selectCustomerById(customer.id);
    await orderPage.goToStep2();

    const options = await orderPage.getAvailableProductOptions(0);
    const basicOptions = options.filter(t => t.includes('(Basic)'));
    expect(basicOptions.length).toBeGreaterThanOrEqual(1);

    await orderPage.cancelForm();
  });

  test('[Positive] Consumer dropdown contains Professional products', async ({ page }) => {
    const orderPage = new OrderPage(page);
    await orderPage.navigateToOrders();
    await orderPage.openCreateForm();
    await orderPage.selectCustomerById(customer.id);
    await orderPage.goToStep2();

    const options = await orderPage.getAvailableProductOptions(0);
    const proOptions = options.filter(t => t.includes('(Professional)'));
    expect(proOptions.length).toBeGreaterThanOrEqual(1);

    await orderPage.cancelForm();
  });

  test('[Negative] Consumer dropdown does NOT contain Teams products', async ({ page }) => {
    const orderPage = new OrderPage(page);
    await orderPage.navigateToOrders();
    await orderPage.openCreateForm();
    await orderPage.selectCustomerById(customer.id);
    await orderPage.goToStep2();

    const options = await orderPage.getAvailableProductOptions(0);
    const teamsOptions = options.filter(t => t.includes('(Teams)'));
    expect(teamsOptions.length).toBe(0);

    await orderPage.cancelForm();
  });

  test('[Negative] Consumer dropdown does NOT contain Ultra-Enterprise products', async ({ page }) => {
    const orderPage = new OrderPage(page);
    await orderPage.navigateToOrders();
    await orderPage.openCreateForm();
    await orderPage.selectCustomerById(customer.id);
    await orderPage.goToStep2();

    const options = await orderPage.getAvailableProductOptions(0);
    const ultraOptions = options.filter(t => t.includes('(Ultra-Enterprise)'));
    expect(ultraOptions.length).toBe(0);

    await orderPage.cancelForm();
  });

  test('[Positive] Consumer can create an order with a Basic product', async ({ page }) => {
    const orderPage = new OrderPage(page);
    await orderPage.navigateToOrders();
    await orderPage.openCreateForm();

    // Step 1 — select by id to avoid label mismatch
    await orderPage.selectCustomerById(customer.id);
    await orderPage.goToStep2();

    // Step 2 — select by product id value to avoid "$price/seat" suffix mismatch
    await orderPage.selectByValue(orderPage.loc.orderProductSelect(0), String(basic.id));
    await orderPage.setSeats(0, 2);
    await orderPage.goToReviewStep(false);

    // Step 3 — submit
    await orderPage.clickWhenReady(orderPage.loc.wizardSubmit);
    await orderPage.waitForVisible(orderPage.loc.orderListContainer);

    // XPath assertion: order row contains the customer name
    const customerCell = page.locator(
      `xpath=//table[@id="orders-table"]//td[contains(text(),"${customer.name}")]`
    );
    await expect(customerCell).toBeVisible();
  });

  test('[Negative] API rejects Consumer ordering a Teams product', async ({ request }) => {
    const api = new ApiHelper(request);
    const res = await api.postOrderRaw({
      customer_id: customer.id,
      products:    [{ product_id: teams.id, seats: 1 }],
    });

    expect([400, 422]).toContain(res.status());
    const body = await res.json();
    expect((body.detail || '').toLowerCase()).toContain('not available');
  });

});
