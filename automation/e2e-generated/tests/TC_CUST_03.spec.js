import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC-CUST-01-TC03: [Positive] SMB customer — company name field appears and is submitted successfully', () => {

  let createdCustomerId;
  const TEST_NAME = 'SMB_TC03_Test';

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.cleanupCustomersByName(TEST_NAME);
  });

  test('[Positive] SMB customer — company name field appears and is submitted successfully', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Assert Company Name field is hidden before SMB is selected (default type is Consumer)
    await expect(customerPage.loc.companyNameGroup).not.toBeVisible();

    // Select Type = 'SMB'
    await customerPage.selectType('SMB');

    // Assert Company Name field is now VISIBLE
    await expect(customerPage.loc.companyNameGroup).toBeVisible();

    // Fill all required fields
    await customerPage.fillName(`${TEST_NAME}_User`);
    await customerPage.fillCompanyName(`${TEST_NAME}_Corp`);
    await customerPage.fillEmail('smb_tc03@example.com');
    await customerPage.fillCountry('Canada');

    // Submit the form
    await customerPage.submitForm();

    // Assert company name appears in the customers table
    await expect(customerPage.loc.customerListContainer).toBeVisible();
    await expect(page.getByText(`${TEST_NAME}_Corp`)).toBeVisible();
  });

});
