import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC-CUST-01: Entering "US" as country renders State dropdown', () => {

  test.beforeAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.cleanupCustomersByName('TC_CUST_01');
  });

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.cleanupCustomersByName('TC_CUST_01');
  });

  test('[Positive] Entering "US" as country renders State dropdown', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Step 2: Assert State INPUT is visible and disabled before entering country
    await expect(customerPage.loc.stateInput).toBeVisible();
    await expect(customerPage.loc.stateInput).toBeDisabled();

    // Step 3: Enter 'US' in the Country field and blur to trigger React onChange
    await customerPage.loc.countryInput.fill('US');
    await customerPage.loc.countryInput.blur();

    // Step 4: Assert State SELECT dropdown is visible (XPath: //label[@for='customer-state']/following-sibling::select)
    const stateSelectByXPath = page.locator('xpath=//label[@for="customer-state"]/following-sibling::select');
    await expect(stateSelectByXPath).toBeVisible();

    // Also assert via the page object locator
    await expect(customerPage.loc.stateSelect).toBeVisible();
    await expect(customerPage.loc.stateSelect).toBeEnabled();

    // Step 5: Assert State label text contains '*'
    await expect(customerPage.loc.stateLabel).toContainText('*');

    // Clean up
    await customerPage.cancelForm();
  });

});
