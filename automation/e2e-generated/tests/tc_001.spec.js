/**
 * tc_001.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TC-001: Customer Creation
 *
 * Covers:
 *  [Positive] Create a new customer and verify it appears in the list
 *  [Negative] Cancel form without creating a customer — list unchanged
 *  [Negative] Submit empty form shows a validation error
 *  [Negative] Missing required email shows error
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

const SEED_PREFIX = 'TC001';

test.describe('TC-001: Customer Creation', () => {

  /** @type {import('@playwright/test').APIRequestContext} */
  let request;
  /** @type {ApiHelper} */
  let api;

  const createdIds = [];

  test.beforeAll(async ({ request: req }) => {
    request = req;
    api = new ApiHelper(request);
  });

  test.afterAll(async () => {
    for (const id of createdIds) {
      await api.deleteCustomer(id).catch(() => {});
    }
    await api.cleanupCustomersByName(SEED_PREFIX);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Positive
  // ──────────────────────────────────────────────────────────────────────────

  test('[Positive] Create a new customer and verify it appears in the list', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const uniqueName = `${SEED_PREFIX}-Alice-${Date.now()}`;

    await customerPage.navigateToCustomers();

    const rowsBefore = await customerPage.getRowCount();

    await customerPage.openCreateForm();
    await customerPage.fillCustomerForm({
      name:         uniqueName,
      customerType: 'Consumer',
      email:        `alice.${Date.now()}@tc001.test`,
      phone:        '555-0100',
      street:       '123 Main St',
      city:         'Springfield',
      country:      'US',
      state:        'IL',
      zip:          '62701',
    });
    await customerPage.submitForm();

    // List should have one more row
    await expect(customerPage.loc.customerTableRows).toHaveCount(rowsBefore + 1);

    // The new customer's name should appear in the table
    const nameCell = page.locator(`xpath=//td[normalize-space(text())="${uniqueName}"]`);
    await expect(nameCell).toBeVisible();

    // Record ID for afterAll cleanup
    const customers = await api.getAllCustomers();
    const created = customers.find(c => c.name === uniqueName);
    if (created) createdIds.push(created.id);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Negative
  // ──────────────────────────────────────────────────────────────────────────

  test('[Negative] Cancel form without creating a customer — list is unchanged', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();

    const rowsBefore = await customerPage.getRowCount();

    await customerPage.openCreateForm();
    await customerPage.fillName(`${SEED_PREFIX}-Cancelled-${Date.now()}`);
    await customerPage.cancelForm();

    // Form should be gone
    await expect(customerPage.loc.customerForm).not.toBeVisible();

    // Row count must remain the same
    await expect(customerPage.loc.customerTableRows).toHaveCount(rowsBefore);
  });

  test('[Negative] Submit empty form shows a validation error', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();

    await customerPage.openCreateForm();

    // Submit without filling anything
    await customerPage.submitFormExpectError();

    // Form must still be visible (not submitted)
    await expect(customerPage.loc.customerForm).toBeVisible();

    // A validation error message must appear
    await expect(customerPage.loc.formError).toBeVisible();
    await expect(customerPage.loc.formError).not.toHaveText('');

    await customerPage.cancelForm();
  });

  test('[Negative] Missing required email shows error', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();

    await customerPage.openCreateForm();

    // Fill all required fields except email
    await customerPage.fillCustomerForm({
      name:         `${SEED_PREFIX}-NoEmail-${Date.now()}`,
      customerType: 'Consumer',
    });

    await customerPage.submitFormExpectError();

    // Form must still be open
    await expect(customerPage.loc.customerForm).toBeVisible();

    // Error message must be visible
    await expect(customerPage.loc.formError).toBeVisible();
    await expect(customerPage.loc.formError).not.toHaveText('');

    await customerPage.cancelForm();
  });

});
