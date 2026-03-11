/**
 * tc_001.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TC-001: Customer creation — form opens, data is submitted, and the new
 *         customer appears in the list. Negative path verifies that submitting
 *         an empty form shows a validation error.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

const SEED_PREFIX = 'TC001';

test.describe('TC-001: Customer Creation Posted and Appears in the List', () => {

  /** @type {number[]} IDs of customers created during positive tests — cleaned up in afterAll */
  let createdIds = [];

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.cleanupCustomersByName(SEED_PREFIX);
  });

  // ── Positive ───────────────────────────────────────────────────────────────

  test('[Positive] Create Customer button opens the customer form', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();

    await expect(customerPage.loc.createCustomerBtn).toBeVisible();
    await expect(customerPage.loc.createCustomerBtn).toBeEnabled();

    await customerPage.openCreateForm();

    await expect(customerPage.loc.customerForm).toBeVisible();
    await expect(customerPage.loc.nameInput).toBeVisible();
    await expect(customerPage.loc.emailInput).toBeVisible();
    await expect(customerPage.loc.submitBtn).toBeVisible();
    await expect(customerPage.loc.cancelBtn).toBeVisible();

    await customerPage.cancelForm();
  });

  test('[Positive] Submit valid Consumer customer and verify it appears in the list', async ({ page }) => {
    const suffix = `${SEED_PREFIX}-${Date.now()}`;
    const data = {
      name:         `Customer ${suffix}`,
      customerType: 'Consumer',
      email:        `customer.${suffix}@test.example`,
      phone:        '5550001234',
      street:       '123 Main St',
      city:         'Springfield',
      country:      'US',
      state:        'IL',
      zip:          '62701',
    };

    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();
    await customerPage.fillCustomerForm(data);
    await customerPage.submitForm();

    // List must be visible after submit
    await expect(customerPage.loc.customerListContainer).toBeVisible();

    // Locate the new row by name
    const nameCell = page.locator(`xpath=//td[normalize-space(text())="${data.name}"]`);
    await expect(nameCell).toBeVisible();

    // Clean up via API — retrieve the id from the row's data attribute
    const api = new ApiHelper(page.request);
    await api.cleanupCustomersByName(suffix);
  });

  test('[Positive] New customer row shows correct type and email after creation', async ({ page, request }) => {
    const suffix  = `${SEED_PREFIX}-row-${Date.now()}`;
    const api     = new ApiHelper(request);
    const seeded  = await api.createCustomer({
      name:               `Customer ${suffix}`,
      customer_type:      'Consumer',
      email:              `row.${suffix}@test.example`,
      account_status:     'Active',
      contact_preference: 'Email',
    });
    createdIds.push(seeded.id);

    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();

    // Row must be present
    await expect(customerPage.loc.customerRow(seeded.id)).toBeVisible();

    // Name cell
    await expect(customerPage.loc.customerName(seeded.id)).toHaveText(`Customer ${suffix}`);

    // Type cell
    await expect(customerPage.loc.customerType(seeded.id)).toHaveText('Consumer');

    // Email cell
    await expect(customerPage.loc.customerEmail(seeded.id)).toContainText(`row.${suffix}@test.example`);

    await api.deleteCustomer(seeded.id);
    createdIds = createdIds.filter(id => id !== seeded.id);
  });

  test('[Positive] Cancel button closes the form without creating a customer', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();

    const countBefore = await customerPage.getRowCount();

    await customerPage.openCreateForm();
    await customerPage.fillName(`Customer ${SEED_PREFIX}-cancel-${Date.now()}`);
    await customerPage.cancelForm();

    // Form must be gone
    await expect(customerPage.loc.customerForm).not.toBeVisible();

    // Row count must not have changed
    const countAfter = await customerPage.getRowCount();
    expect(countAfter).toBe(countBefore);
  });

  // ── Negative ───────────────────────────────────────────────────────────────

  test('[Negative] Submitting empty form shows a validation error', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Do NOT fill any fields — submit straight away
    await customerPage.submitFormExpectError();

    // Error message must be visible; form must remain open
    await expect(customerPage.loc.formError).toBeVisible();
    await expect(customerPage.loc.customerForm).toBeVisible();

    await customerPage.cancelForm();
  });

  test('[Negative] Submitting form with name only (missing required email) shows error', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    await customerPage.fillName(`Customer ${SEED_PREFIX}-no-email-${Date.now()}`);
    // Leave email blank intentionally
    await customerPage.submitFormExpectError();

    await expect(customerPage.loc.formError).toBeVisible();
    await expect(customerPage.loc.customerForm).toBeVisible();

    await customerPage.cancelForm();
  });

});
