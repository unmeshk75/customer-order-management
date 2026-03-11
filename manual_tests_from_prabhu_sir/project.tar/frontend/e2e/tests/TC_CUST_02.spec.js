/**
 * TC_CUST_02.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Company Name is required for SMB and Enterprise customers (positive)
 * Verifies: Company name field appears for SMB/Enterprise, is required,
 *           and the customer is created successfully when filled.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { CustomerPage }    from '../pages/CustomerPage.js';
import { AssertionHelper } from '../utils/AssertionHelper.js';
import { TestDataFactory } from '../utils/TestDataFactory.js';

test.describe('TC_CUST_02 — SMB/Enterprise Customer Requires Company Name', () => {

  test('[Positive] SMB customer — company name field appears and is submitted successfully', async ({ page }) => {
    const nav    = new NavigationPage(page);
    const cust   = new CustomerPage(page);
    const assert = new AssertionHelper(page);
    const data   = TestDataFactory.smbCustomer();

    await nav.goto();
    await nav.goToCustomers();
    await cust.openCreateForm();

    // Before selecting SMB — company name should be hidden
    await assert.assertCompanyNameHidden();

    // Select SMB type
    await cust.selectType('SMB');

    // Company name group should now be VISIBLE
    await assert.assertCompanyNameVisible();

    // Fill the rest
    await cust.fillName(data.name);
    await cust.fillCompanyName(data.companyName);
    await cust.fillEmail(data.email);
    await cust.fillCountry(data.country);

    await cust.submitForm();

    // Verify row exists in table with company name shown
    const companyCell = page.locator(
      `xpath=//table[@id="customers-table"]//div[@class="customer-company" and contains(text(),"${data.companyName}")]`
    );
    await expect(companyCell).toBeVisible();
  });

  test('[Positive] Enterprise customer — company name field appears and is submitted successfully', async ({ page }) => {
    const nav    = new NavigationPage(page);
    const cust   = new CustomerPage(page);
    const assert = new AssertionHelper(page);
    const data   = TestDataFactory.enterpriseCustomer();

    await nav.goto();
    await nav.goToCustomers();
    await cust.openCreateForm();

    // Select Enterprise type — company name should appear
    await cust.selectType('Enterprise');
    await assert.assertCompanyNameVisible();

    await cust.fillName(data.name);
    await cust.fillCompanyName(data.companyName);
    await cust.fillEmail(data.email);
    await cust.fillCountry(data.country);

    await cust.submitForm();

    // Company name visible in the list
    const companyCell = page.locator(
      `xpath=//table[@id="customers-table"]//div[contains(@class,"customer-company") and contains(text(),"${data.companyName}")]`
    );
    await expect(companyCell).toBeVisible();
  });

  test('[Negative] SMB customer — submitting without company name shows error', async ({ page }) => {
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);
    const data = TestDataFactory.smbCustomer();

    await nav.goto();
    await nav.goToCustomers();
    await cust.openCreateForm();

    await cust.fillName(data.name);
    await cust.selectType('SMB');
    // Intentionally do NOT fill company name
    await cust.fillEmail(data.email);
    await cust.fillCountry(data.country);

    // Submit — expect client-side error
    await cust.submitFormExpectError();

    const errorText = await cust.getFormError();
    expect(errorText).toContain('Company Name is required');
  });

});
