/**
 * TC_CUST_03.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TC_CUST_01-TC03: [Positive] SMB customer — company name field appears
 *                  and is submitted successfully.
 *
 * Assertions use:
 *  • Locator-based waits (no hardcoded ms)
 *  • customersPage.loc.* — XPath locators from CustomerPage
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

const TEST_NAME_PATTERN = 'SMB_TC03_';

test.describe('TC_CUST_01-TC03: SMB Customer — Company Name Field Appears and Submits Successfully', () => {

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.cleanupCustomersByName(TEST_NAME_PATTERN);
  });

  test('[Positive] Company Name field is hidden when default Consumer type is selected', async ({ page }) => {
    const customersPage = new CustomerPage(page);
    await customersPage.navigateToCustomers();
    await customersPage.openCreateForm();

    // Company Name group should be hidden when default type is Consumer
    await expect(customersPage.loc.companyNameGroup).not.toBeVisible();

    await customersPage.cancelForm();
  });

  test('[Positive] Company Name field becomes visible after selecting SMB type', async ({ page }) => {
    const customersPage = new CustomerPage(page);
    await customersPage.navigateToCustomers();
    await customersPage.openCreateForm();

    // Confirm Company Name is hidden before selecting SMB
    await expect(customersPage.loc.companyNameGroup).not.toBeVisible();

    // Select SMB type
    await customersPage.loc.customerTypeSelect.selectOption('SMB');

    // Company Name group should now be visible
    await expect(customersPage.loc.companyNameGroup).toBeVisible();
    await expect(customersPage.loc.companyNameInput).toBeVisible();
    await expect(customersPage.loc.companyNameInput).toBeEnabled();

    await customersPage.cancelForm();
  });

  test('[Positive] SMB customer with company name submits successfully and appears in customer list', async ({ page, request }) => {
    const api = new ApiHelper(request);
    const customersPage = new CustomerPage(page);

    const suffix = Date.now();
    const customerName = `${TEST_NAME_PATTERN}${suffix}`;
    const companyName = `SMB Corp ${suffix}`;
    const email = `smb.tc03.${suffix}@test.example`;
    const country = 'US';

    await customersPage.navigateToCustomers();
    await customersPage.openCreateForm();

    // Assert Company Name is hidden before SMB selection
    await expect(customersPage.loc.companyNameGroup).not.toBeVisible();

    // Select Type = SMB
    await customersPage.loc.customerTypeSelect.selectOption('SMB');

    // Assert Company Name is now visible
    await expect(customersPage.loc.companyNameGroup).toBeVisible();
    await expect(customersPage.loc.companyNameInput).toBeEnabled();

    // Fill in the form fields
    await customersPage.loc.nameInput.fill(customerName);
    await customersPage.loc.companyNameInput.fill(companyName);
    await customersPage.loc.emailInput.fill(email);
    await customersPage.loc.countryInput.fill(country);

    // Submit the form
    await customersPage.submitForm();

    // Assert the customer table shows the new company name
    await expect(customersPage.loc.customerTable).toBeVisible();

    const companyCell = page.locator(`text=${companyName}`);
    await expect(companyCell).toBeVisible();

    // Cleanup
    await api.cleanupCustomersByName(TEST_NAME_PATTERN);
  });

});
