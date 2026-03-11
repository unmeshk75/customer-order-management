/**
 * TC_CUST_01.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Create a Consumer customer successfully (positive)
 * Verifies: Customer appears in the list with correct data after creation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage } from '../pages/NavigationPage.js';
import { CustomerPage }   from '../pages/CustomerPage.js';
import { TestDataFactory } from '../utils/TestDataFactory.js';

test.describe('TC_CUST_01 — Create Consumer Customer (Positive)', () => {

  test('should create a Consumer customer and display it in the list', async ({ page }) => {
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);
    const data = TestDataFactory.consumerCustomer();

    // ── Setup ──────────────────────────────────────────────────────────────
    await nav.goto();
    await nav.goToCustomers();

    // ── Open form ──────────────────────────────────────────────────────────
    await cust.openCreateForm();

    // Verify heading shows 'Create Customer'
    const heading = await cust.getFormHeading();
    expect(heading).toBe('Create Customer');

    // ── Fill form ──────────────────────────────────────────────────────────
    await cust.fillConsumerCustomer(data);

    // Company name field should NOT be visible for Consumer
    const companyVisible = await cust.isCompanyNameVisible();
    expect(companyVisible).toBe(false);

    // ── Submit ─────────────────────────────────────────────────────────────
    await cust.submitForm();

    // ── Assertions: customer appears in the table ──────────────────────────
    // XPath: find the row containing the customer email
    const emailCell = page.locator(
      `xpath=//table[@id="customers-table"]//tbody//td[normalize-space(text())="${data.email}"]`
    );
    await expect(emailCell).toBeVisible();

    // Verify customer type column in the same row — compound XPath with ancestor
    const typeCell = page.locator(
      `xpath=//td[normalize-space(text())="${data.email}"]/ancestor::tr//td[@data-testid[contains(.,"customer-type-")]]`
    );
    await expect(typeCell).toContainText('Consumer');
  });

});
