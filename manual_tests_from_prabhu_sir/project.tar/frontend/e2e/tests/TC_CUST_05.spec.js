/**
 * TC_CUST_05.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Edit Customer — verify data persistence and form state
 * Verifies:
 *   [Positive] Edit form pre-populates with existing customer data.
 *   [Positive] Updating name/email reflects in the list.
 *   [Positive] Expand customer row shows 'No orders' when customer has no orders.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { CustomerPage }    from '../pages/CustomerPage.js';
import { CustomerLocators } from '../locators/CustomerLocators.js';
import { ApiHelper }       from '../utils/ApiHelper.js';

test.describe('TC_CUST_05 — Edit Customer and Expanded Row', () => {

  let customerId;

  test.beforeEach(async ({ request }) => {
    const api = new ApiHelper(request);
    const c = await api.createCustomer({
      name: `EditCustomer ${Date.now()}`,
      customer_type: 'Consumer',
      email: `edit.${Date.now()}@test.com`,
      account_status: 'Active',
      contact_preference: 'Email',
    });
    customerId = c.id;
  });

  test.afterEach(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.deleteCustomer(customerId).catch(() => {});
  });

  test('[Positive] Edit form opens with pre-populated data', async ({ page }) => {
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);
    const loc  = new CustomerLocators(page);

    await nav.goto();
    await nav.goToCustomers();

    await cust.openEditForm(customerId);

    // Verify heading is 'Edit Customer'
    const heading = await cust.getFormHeading();
    expect(heading).toBe('Edit Customer');

    // Verify name field has pre-populated value
    const nameValue = await loc.nameInput.inputValue();
    expect(nameValue).toContain('EditCustomer');

    // Cancel
    await cust.cancelForm();
  });

  test('[Positive] Updated customer name is reflected in the list', async ({ page }) => {
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);
    const newName = `UpdatedName ${Date.now()}`;

    await nav.goto();
    await nav.goToCustomers();

    await cust.openEditForm(customerId);
    await cust.fillName(newName);
    await cust.submitForm();

    // Updated name should appear in the list
    const updatedNameCell = page.locator(
      `xpath=//tr[@data-customer-id="${customerId}"]//td[@data-testid="customer-name-${customerId}"]`
    );
    await expect(updatedNameCell).toContainText(newName);
  });

  test('[Positive] Expanding a customer row with no orders shows no-orders message', async ({ page }) => {
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);
    const loc  = new CustomerLocators(page);

    await nav.goto();
    await nav.goToCustomers();

    await cust.expandRow(customerId);

    // Wait for detail row
    await expect(page.getByTestId(`detail-row-${customerId}`)).toBeVisible();

    // XPath: following-sibling from main row — detail row contains no-orders text
    const noOrders = page.locator(
      `xpath=//tr[@data-customer-id="${customerId}"]` +
      `/following-sibling::tr[@data-testid="detail-row-${customerId}"]` +
      `//p[contains(@class,"no-data")]`
    );
    await expect(noOrders).toBeVisible();
  });

});
