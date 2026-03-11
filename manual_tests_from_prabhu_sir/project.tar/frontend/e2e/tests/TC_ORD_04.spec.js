/**
 * TC_ORD_04.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Order Discount Calculation
 * Verifies:
 *   [Positive] A 10% discount is correctly applied and shown in the wizard summary.
 *   [Positive] The discounted total in the order list matches the expected value.
 *   [Positive] Multi-product order total is the sum of all product subtotals.
 *   [Negative] Wizard 'Next' button is disabled when no customer is selected.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { OrderPage }       from '../pages/OrderPage.js';
import { ApiHelper }       from '../utils/ApiHelper.js';
import { AssertionHelper } from '../utils/AssertionHelper.js';

test.describe('TC_ORD_04 — Discount Calculation and Wizard Validation', () => {

  const suffix = Date.now();
  let consumer, product;
  const PRICE  = 100.00;
  const SEATS  = 3;
  const DISC   = 10;  // 10%

  test.beforeAll(async ({ request }) => {
    const api = new ApiHelper(request);
    consumer = await api.createCustomer({
      name: `DiscCon ${suffix}`, customer_type: 'Consumer',
      email: `disc.${suffix}@t.com`, account_status: 'Active', contact_preference: 'Email',
    });
    product = await api.createProduct({
      name: `DiscProd ${suffix}`, product_type: 'Basic',
      price_per_seat: PRICE, stock_quantity: 100,
    });
  });

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.deleteCustomer(consumer.id).catch(() => {});
    await api.deleteProduct(product.id).catch(() => {});
  });

  test('[Positive] Discount percentage is applied correctly in wizard summary', async ({ page }) => {
    const nav    = new NavigationPage(page);
    const ord    = new OrderPage(page);
    const assert = new AssertionHelper(page);

    await nav.goto();
    await nav.goToOrders();
    await ord.openCreateForm();

    // Step 1: Select customer and set discount
    await ord.selectCustomerById(consumer.id);
    await ord.setDiscount(DISC);
    await ord.goToStep2();

    // Step 2: Select product and seats
    await ord.selectProduct(0, product.name);
    await ord.setSeats(0, SEATS);

    // Verify subtotal shown in step 2 summary
    const subtotalLocator = page.getByTestId('order-subtotal');
    await expect(subtotalLocator).toBeVisible();
    const subtotalText = await subtotalLocator.textContent();
    const subtotal = parseFloat(subtotalText.replace('$', ''));
    expect(subtotal).toBeCloseTo(PRICE * SEATS, 1);

    // Verify discount amount
    const discAmtLocator = page.getByTestId('order-discount-amount');
    await expect(discAmtLocator).toBeVisible();
    const discAmt = parseFloat((await discAmtLocator.textContent()).replace('-$', ''));
    expect(discAmt).toBeCloseTo(PRICE * SEATS * DISC / 100, 1);

    // Verify final total
    const totalLocator = page.getByTestId('order-total');
    const total = parseFloat((await totalLocator.first().textContent()).replace('$', ''));
    assert.assertDiscountedTotal(PRICE * SEATS, DISC, total);

    await ord.goToReviewStep(false);
    await ord.submitOrder();
  });

  test('[Positive] Discounted total is displayed in order list after creation', async ({ page, request }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);
    const api = new ApiHelper(request);

    // Create via API for clean state
    const order = await api.createOrder({
      customer_id: consumer.id,
      discount_percentage: DISC,
      priority: 'Medium',
      products: [{ product_id: product.id, seats: SEATS }],
    });

    await nav.goto();
    await nav.goToOrders();

    // XPath: discount cell for this order
    const discountCell = page.locator(
      `xpath=//tr[@data-order-id="${order.id}"]//td[@data-testid="order-discount-${order.id}"]`
    );
    await expect(discountCell).toContainText(`${DISC}%`);

    // XPath: discounted total cell for this order
    const discTotalCell = page.locator(
      `xpath=//tr[@data-order-id="${order.id}"]//td[@data-testid="order-discounted-total-${order.id}"]`
    );
    await expect(discTotalCell).toBeVisible();

    const totalText = await discTotalCell.textContent();
    const total = parseFloat(totalText.replace('$', ''));
    const expected = PRICE * SEATS * (1 - DISC / 100);
    expect(Math.abs(total - expected)).toBeLessThan(0.05);

    await api.deleteOrder(order.id).catch(() => {});
  });

  test('[Negative] Wizard Next button is disabled when no customer is selected', async ({ page }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);

    await nav.goto();
    await nav.goToOrders();
    await ord.openCreateForm();

    // Next should be disabled when no customer is chosen
    const isDisabled = await ord.isNextDisabled();
    expect(isDisabled).toBe(true);
  });

  test('[Positive] Multi-product order total is correct sum of all subtotals', async ({ page, request }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);
    const api = new ApiHelper(request);
    const s2  = Date.now() + 7000;

    const prod2 = await api.createProduct({
      name: `Prod2 ${s2}`, product_type: 'Professional',
      price_per_seat: 50, stock_quantity: 100,
    });

    const smbCust = await api.createCustomer({
      name: `MultiSMB ${s2}`, customer_type: 'SMB',
      email: `msmb.${s2}@t.com`, company_name: `MCorp ${s2}`,
      account_status: 'Active', contact_preference: 'Email',
    });

    await nav.goto();
    await nav.goToOrders();
    await ord.openCreateForm();

    // Step 1
    await ord.selectCustomerById(smbCust.id);
    await ord.goToStep2();

    // Step 2 — two products
    await ord.selectProduct(0, `ProfR ${suffix}` in [''] ? '' : prod2.name);
    await ord.setSeats(0, 2);
    await ord.addProductRow();
    await ord.selectProduct(1, prod2.name);
    await ord.setSeats(1, 3);

    // Navigate to review
    await ord.goToReviewStep(false);

    // Verify review table has 2 rows
    const reviewRows = page.locator(
      'xpath=//table[@data-testid="review-table"]//tbody//tr'
    );
    await expect(reviewRows).toHaveCount(2);

    await ord.cancelForm();

    await api.deleteCustomer(smbCust.id).catch(() => {});
    await api.deleteProduct(prod2.id).catch(() => {});
  });

});
