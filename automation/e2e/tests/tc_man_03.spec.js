/**
 * tc_man_03.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TC-MAN-03: Selecting a Customer in the Order Wizard dynamically loads
 *            the Products Section and enables the Next button.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { OrderPage }   from '../pages/OrderPage.js';
import { ApiHelper }   from '../utils/ApiHelper.js';

test.describe('TC-MAN-03: Selecting a Customer Dynamically Loads Products Section', () => {

  let customer, basic, pro;

  test.beforeAll(async ({ request }) => {
    const api = new ApiHelper(request);
    const suffix = `tc03-${Date.now()}`;

    customer = await api.createCustomer({
      name: `Alice ${suffix}`, customer_type: 'Consumer', email: `alice.${suffix}@example.com`,
    });
    basic = await api.createProduct({ name: `Basic ${suffix}`,        product_type: 'Basic',        price_per_seat: 9.99 });
    pro   = await api.createProduct({ name: `Professional ${suffix}`, product_type: 'Professional', price_per_seat: 19.99 });
  });

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.deleteCustomer(customer.id).catch(() => {});
    await api.deleteProduct(basic.id).catch(() => {});
    await api.deleteProduct(pro.id).catch(() => {});
  });

  test('[Positive] Products section is NOT visible before customer is selected', async ({ page }) => {
    const orderPage = new OrderPage(page);
    await orderPage.navigateToOrders();
    await orderPage.openCreateForm();

    // Products section should not be visible on Step 1
    await expect(orderPage.loc.productsSection).not.toBeVisible();

    await orderPage.cancelForm();
  });

  test('[Positive] Next button is DISABLED before customer is selected', async ({ page }) => {
    const orderPage = new OrderPage(page);
    await orderPage.navigateToOrders();
    await orderPage.openCreateForm();

    await expect(orderPage.loc.wizardNext).toBeDisabled();

    await orderPage.cancelForm();
  });

  test('[Positive] Customer dropdown lists customers in Name (Type) format', async ({ page }) => {
    const orderPage = new OrderPage(page);
    await orderPage.navigateToOrders();
    await orderPage.openCreateForm();

    const options = await orderPage.loc.customerSelect.locator('option').allTextContents();
    const hasConsumer = options.some(opt => opt.includes('Consumer'));
    expect(hasConsumer).toBeTruthy();

    await orderPage.cancelForm();
  });

  test('[Positive] Selecting a customer enables Next and shows products section', async ({ page }) => {
    const orderPage = new OrderPage(page);
    await orderPage.navigateToOrders();
    await orderPage.openCreateForm();

    // Select customer by id
    await orderPage.selectCustomerById(customer.id);

    // Next button is now enabled
    await expect(orderPage.loc.wizardNext).toBeEnabled();

    // Advance to Step 2 (Products)
    await orderPage.goToStep2();

    // Products section is now visible — compound XPath assertion
    const productsSection = page.locator('xpath=//fieldset[@id="order-products-section"]');
    await expect(productsSection).toBeVisible();

    // Product row 0 and seats input are visible
    await expect(orderPage.loc.productRow(0)).toBeVisible();
    await expect(orderPage.loc.orderSeatsInput(0)).toBeVisible();
    await expect(orderPage.loc.addProductBtn).toBeVisible();

    await orderPage.cancelForm();
  });

  test('[Positive] Info text shows allowed product types for Consumer', async ({ page }) => {
    const orderPage = new OrderPage(page);
    await orderPage.navigateToOrders();
    await orderPage.openCreateForm();

    await orderPage.selectCustomerById(customer.id);
    await orderPage.goToStep2();

    const infoText = await orderPage.getAvailableProductsInfoText();
    expect(infoText).toContain('Consumer');
    expect(infoText).toContain('Basic');
    expect(infoText).toContain('Professional');

    await orderPage.cancelForm();
  });

});
