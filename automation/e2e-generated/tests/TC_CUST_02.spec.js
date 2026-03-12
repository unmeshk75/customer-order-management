import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC-CUST_01-TC02: [Negative] Non-US country keeps State as disabled input', () => {

  test.beforeAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.cleanupCustomersByName('TC02');
  });

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.cleanupCustomersByName('TC02');
  });

  test('[Negative] Non-US country keeps State as disabled input', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Enter a non-US country
    await customerPage.loc.countryInput.fill('Canada');
    await customerPage.loc.countryInput.blur();

    // Wait for stateInput to be visible (non-US branch)
    await customerPage.loc.stateInput.waitFor({ state: 'visible' });

    // Assert State SELECT is NOT present / not visible
    await expect(customerPage.loc.stateSelect).not.toBeVisible();

    // Assert State INPUT is visible and disabled
    await expect(customerPage.loc.stateInput).toBeVisible();
    await expect(customerPage.loc.stateInput).toBeDisabled();

    await customerPage.cancelForm();
  });

});
