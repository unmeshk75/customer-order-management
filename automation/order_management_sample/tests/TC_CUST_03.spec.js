import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC-CUST-01-TC03: [Positive] SMB customer — company name field appears and is submitted successfully', () => {

  const TEST_NAME_PATTERN = 'SMB_TC03_';

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.cleanupCustomersByName(TEST_NAME_PATTERN);
  });

  test('[Positive] Company Name field is hidden by default (Consumer type) and visible after selecting SMB, then submits successfully', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const uniqueSuffix = Date.now();
    const customerName = `${TEST_NAME_PATTERN}${uniqueSuffix}`;
    const companyName = `SMB Corp ${uniqueSuffix}`;

    // Step 1: Navigate to Customers section
    await customerPage.navigateToCustomers();

    // Step 2: Click 'Add Customer'
    await customerPage.openCreateForm();

    // Step 3: Assert Company Name field is hidden (default type is Consumer)
    await expect(customerPage.loc.customerCompanyInput).not.toBeVisible();

    // Step 4: Select Type = 'SMB'
    await customerPage.selectType('SMB');

    // Step 5: Assert Company Name field is now VISIBLE
    await expect(customerPage.loc.customerCompanyInput).toBeVisible();

    // Step 6: Fill Name, Company Name, Email, Country
    await customerPage.fillName(customerName);
    await customerPage.fillCompany(companyName);
    await customerPage.fillEmail(`smb.tc03.${uniqueSuffix}@test.com`);
    await customerPage.loc.customerCountryInput.fill('DE');
    await expect(customerPage.loc.customerStateInput).toBeVisible();

    // Step 7: Submit the form
    await customerPage.submitForm();

    // Step 8: Assert company name appears in the customers table row
    await expect(customerPage.loc.customerList).toBeVisible();
    await expect(
      customerPage.loc.customerList.locator(`text=${companyName}`)
    ).toBeVisible();
  });

});
