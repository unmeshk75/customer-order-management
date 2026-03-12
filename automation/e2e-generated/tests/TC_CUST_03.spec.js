import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC-CUST-01-TC03: [Positive] SMB customer — company name field appears and is submitted successfully', () => {
  let api;
  let createdCustomerId;

  test.beforeAll(async ({ request }) => {
    api = new ApiHelper(request);
  });

  test.afterAll(async () => {
    await api.cleanupCustomersByName('SMB TC03');
  });

  test('[Positive] SMB customer — company name field appears and is submitted successfully', async ({ page }) => {
    const customerPage = new CustomerPage(page);

    // Step 1: Navigate to Customers section
    await customerPage.navigateToCustomers();

    // Step 2: Click 'Add Customer'
    await customerPage.openCreateForm();

    // Step 3: Assert Company Name field is hidden (default type is Consumer)
    await expect(customerPage.loc.companyNameGroup).not.toBeVisible();

    // Step 4: Select Type = 'SMB'
    await customerPage.loc.typeSelect.selectOption('SMB');

    // Step 5: Assert Company Name field is now VISIBLE
    await expect(customerPage.loc.companyNameGroup).toBeVisible();

    // Step 6: Fill Name, Company Name, Email, Country
    await customerPage.fillName('SMB TC03 User');
    await customerPage.fillCompanyName('SMB TC03 Corp');
    await customerPage.fillEmail('smb.tc03@test.example');
    await customerPage.fillCountry('Canada');

    // Step 7: Submit the form
    await customerPage.submitForm();

    // Step 8: Assert company name appears in the customers table
    await expect(customerPage.loc.customerListContainer).toBeVisible();
    const companyCell = page.locator('table').getByText('SMB TC03 Corp');
    await expect(companyCell).toBeVisible();
  });
});
