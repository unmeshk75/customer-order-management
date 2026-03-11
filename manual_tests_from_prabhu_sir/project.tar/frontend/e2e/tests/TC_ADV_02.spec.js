/**
 * TC_ADV_02.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Advanced edge cases
 *   1. Duplicate email customer creation is rejected.
 *   2. Submit required-field form without any input shows validation.
 *   3. Delete product that is used in an order is prevented.
 *   4. Edit order and verify readonly customer field.
 *   5. Customer type change does NOT affect already-created orders.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { CustomerPage }    from '../pages/CustomerPage.js';
import { ProductPage }     from '../pages/ProductPage.js';
import { OrderPage }       from '../pages/OrderPage.js';
import { ApiHelper }       from '../utils/ApiHelper.js';
import { ModalLocators }   from '../locators/ModalLocators.js';

test.describe('TC_ADV_02 — Negative and Edge Cases', () => {

  test('[Negative] Duplicate email is rejected by the backend', async ({ page, request }) => {
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);
    const api  = new ApiHelper(request);
    const suffix = Date.now();

    const existing = await api.createCustomer({
      name: `Duplic ${suffix}`, customer_type: 'Consumer',
      email: `dup.${suffix}@t.com`, account_status: 'Active', contact_preference: 'Email',
    });

    await nav.goto();
    await nav.goToCustomers();
    await cust.openCreateForm();

    await cust.fillName('Duplicate Attempt');
    await cust.selectType('Consumer');
    await cust.fillEmail(existing.email);   // same email
    await cust.fillCountry('UK');

    // Submit — backend should reject with unique constraint error
    await page.getByTestId('submit-customer-btn').click();

    // Form error should appear (either from form or backend)
    await expect(page.locator('#customer-form-error')).toBeVisible({ timeout: 8000 });

    await api.deleteCustomer(existing.id).catch(() => {});
  });

  test('[Negative] Submitting empty customer form shows HTML5 required validation', async ({ page }) => {
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);

    await nav.goto();
    await nav.goToCustomers();
    await cust.openCreateForm();

    // Click submit without filling anything
    await page.getByTestId('submit-customer-btn').click();

    // Form should still be present (browser prevents submission)
    await expect(page.locator('#customer-form')).toBeVisible();
  });

  test('[Negative] Deleting a product used in an order shows an error', async ({ page, request }) => {
    const nav  = new NavigationPage(page);
    const prod = new ProductPage(page);
    const api  = new ApiHelper(request);
    const modal = new ModalLocators(page);
    const suffix = Date.now();

    const { customer, product, order } = await api.setupConsumerOrderWithBasic(suffix);

    await nav.goto();
    await nav.goToProducts();

    // Try to delete the product that has an order
    await page.getByTestId(`delete-product-${product.id}`).click();

    // Modal opens — confirm deletion
    await expect(modal.openOverlay).toBeVisible();
    await modal.confirmBtn.click();
    await expect(modal.overlay).toBeHidden();

    // An error message should appear in the product list
    const errorMsg = page.locator('#product-list-error');
    await expect(errorMsg).toBeVisible({ timeout: 8000 });

    // Cleanup
    await api.deleteOrder(order.id).catch(() => {});
    await api.deleteCustomer(customer.id).catch(() => {});
    await api.deleteProduct(product.id).catch(() => {});
  });

  test('[Positive] Edit order shows customer name in readonly field', async ({ page, request }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);
    const api = new ApiHelper(request);
    const suffix = Date.now();

    const { customer, product, order } = await api.setupConsumerOrderWithBasic(suffix);

    await nav.goto();
    await nav.goToOrders();

    await ord.openEditForm(order.id);

    // Customer should be shown as readonly text (not a select)
    const readonly = page.getByTestId('order-customer-readonly');
    await expect(readonly).toBeVisible();
    await expect(readonly).toContainText(customer.name);

    // Customer select should NOT be in the DOM (edit mode)
    await expect(page.getByTestId('order-customer-select')).toBeHidden();

    await ord.cancelForm();

    await api.deleteOrder(order.id).catch(() => {});
    await api.deleteCustomer(customer.id).catch(() => {});
    await api.deleteProduct(product.id).catch(() => {});
  });

  test('[Negative] Wizard step 2 Next is disabled when no product selected', async ({ page, request }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);
    const api = new ApiHelper(request);
    const suffix = Date.now();

    const consumer = await api.createCustomer({
      name: `WizardTest ${suffix}`, customer_type: 'Consumer',
      email: `wiz.${suffix}@t.com`, account_status: 'Active', contact_preference: 'Email',
    });

    await nav.goto();
    await nav.goToOrders();
    await ord.openCreateForm();

    // Step 1 — select customer and go to step 2
    await ord.selectCustomerById(consumer.id);
    await ord.goToStep2();

    // In step 2 — do NOT select any product
    // 'Next' button (to review step) should be disabled
    const nextBtn = page.getByTestId('wizard-next');
    await expect(nextBtn).toBeDisabled();

    await ord.cancelForm();
    await api.deleteCustomer(consumer.id).catch(() => {});
  });

  test('[ADV] Changing order priority on edit is reflected in the list', async ({ page, request }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);
    const api = new ApiHelper(request);
    const suffix = Date.now();

    const { customer, product, order } = await api.setupSMBOrderWithProfessional(suffix);

    await nav.goto();
    await nav.goToOrders();

    // Edit the order — change priority to Critical
    await ord.openEditForm(order.id);
    await ord.selectPriority('Critical');
    await ord.goToReviewStep(true);
    await ord.submitOrder();

    // Verify priority badge in the list
    const priorityBadge = page.locator(
      `xpath=//tr[@data-order-id="${order.id}"]//span[contains(@class,"priority-badge")]`
    );
    await expect(priorityBadge).toContainText('Critical');

    await api.deleteOrder(order.id).catch(() => {});
    await api.deleteCustomer(customer.id).catch(() => {});
    await api.deleteProduct(product.id).catch(() => {});
  });

});
