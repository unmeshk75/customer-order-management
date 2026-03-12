/**
 * TC_CUST_02.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TC_CUST_01-TC03: SMB customer — company name field appears and is submitted
 *                  successfully.
 *
 * Scenarios covered:
 *  1. Company Name field is hidden when the default Consumer type is selected.
 *  2. Selecting SMB makes the Company Name group visible.
 *  3. Full form submission: SMB customer with company name saves and the
 *     company name appears in the customers table.
 *
 * Locators used (from CustomerLocators):
 *  • companyNameGroup  → getByTestId('company-name-group')   (conditional wrapper)
 *  • companyNameInput  → getByTestId('customer-company-input')
 *  • typeSelect        → getByTestId('customer-type-select')
 *  • nameInput         → getByTestId('customer-name-input')
 *  • emailInput        → getByTestId('customer-email-input')
 *  • countryInput      → getByTestId('customer-country-input')
 *  • customersTable    → #customers-table  (XPath assertion for company cell)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

const NAME_PREFIX = 'TC_CUST_02';

test.describe('TC_CUST_01-TC03: SMB customer — company name field appears and is submitted successfully', () => {

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.cleanupCustomersByName(NAME_PREFIX);
  });

  // ── Test 1: default hidden state ─────────────────────────────────────────

  test('[Positive] Company Name field is hidden when Consumer type is selected by default', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Default customer type is Consumer — the Company Name group must not render
    await expect(customerPage.loc.companyNameGroup).not.toBeVisible();

    await customerPage.cancelForm();
  });

  // ── Test 2: conditional visibility on SMB selection ──────────────────────

  test('[Positive] Company Name field becomes visible after selecting SMB type', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Confirm hidden before type switch
    await expect(customerPage.loc.companyNameGroup).not.toBeVisible();

    // Switch to SMB
    await customerPage.loc.typeSelect.selectOption('SMB');

    // Company Name group and its input must now be visible and interactive
    await expect(customerPage.loc.companyNameGroup).toBeVisible();
    await expect(customerPage.loc.companyNameInput).toBeVisible();
    await expect(customerPage.loc.companyNameInput).toBeEnabled();

    await customerPage.cancelForm();
  });

  // ── Test 3: full submit flow — company name appears in table ─────────────

  test('[Positive] SMB customer form submits and company name appears in the customers table', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const suffix       = Date.now();
    const customerName = `${NAME_PREFIX} SMB ${suffix}`;
    const companyName  = `${NAME_PREFIX} Corp ${suffix}`;

    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Step 3 — Assert Company Name field is hidden (default type is Consumer)
    await expect(customerPage.loc.companyNameGroup).not.toBeVisible();

    // Step 4 — Select Type = SMB
    await customerPage.loc.typeSelect.selectOption('SMB');

    // Step 5 — Assert Company Name field is now VISIBLE
    await expect(customerPage.loc.companyNameGroup).toBeVisible();
    await expect(customerPage.loc.companyNameInput).toBeEnabled();

    // Step 6 — Fill Name, Company Name, Email, Country
    await customerPage.loc.nameInput.fill(customerName);
    await customerPage.loc.companyNameInput.fill(companyName);
    await customerPage.loc.emailInput.fill(`smb.${suffix}@example.test`);
    await customerPage.loc.countryInput.fill('US');

    // Step 7 — Submit the form
    await customerPage.submitForm();

    // Step 8 — Assert company name appears in the customers table row
    const companyCell = page.locator(
      `xpath=//table[@id="customers-table"]//td[contains(text(),"${companyName}")]`
    );
    await expect(companyCell).toBeVisible();
  });

});
