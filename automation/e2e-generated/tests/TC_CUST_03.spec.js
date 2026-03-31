import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC_CUST_01-TC03: [Positive] SMB customer — company name field appears and is submitted successfully', () => {

  let createdCustomerId;
  const testNamePattern = 'SMB_TC03_';

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.cleanupCustomersByName(testNamePattern);
  });

  test('[Positive] Company Name field is hidden by default and visible after selecting SMB, then submits successfully', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const uniqueSuffix = Date.now();
    const customerName = `${testNamePattern}${uniqueSuffix}`;
    const companyName = `SMB Corp ${uniqueSuffix}`;
    const email = `smb.tc03.${uniqueSuffix}@test.example`;
    const country = 'Canada';

    // Step 1: Navigate to Customers section
    await customerPage.navigateToCustomers();

    // Step 2: Click 'Add Customer'
    await customerPage.openCreateForm();

    // Step 3: Assert Company Name field is hidden (default type is Consumer)
    await expect(customerPage.loc.companyNameGroup).not.toBeVisible();

    // Step 4: Select Type = 'SMB'
    await customerPage.selectType('SMB');

    // Step 5: Assert Company Name field is now VISIBLE
    await expect(customerPage.loc.companyNameGroup).toBeVisible();

    // Step 6: Fill Name, Company Name, Email, Country
    await customerPage.fillName(customerName);
    await customerPage.fillCompanyName(companyName);
    await customerPage.fillEmail(email);
    await customerPage.fillCountry(country);

    // Step 7: Submit the form
    await customerPage.submitForm();

    // Step 8: Assert company name appears in the customers table row
    const tableBody = customerPage.loc.customerListContainer;
    await expect(tableBody).toBeVisible();
    await expect(page.getByText(companyName)).toBeVisible();
  });

});
