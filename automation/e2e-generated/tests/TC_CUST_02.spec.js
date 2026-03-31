import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC-CUST-01-TC02: [Negative] Non-US country keeps State as disabled input', () => {

  test('[Negative] Non-US country keeps State as disabled input', async ({ page }) => {
    const customerPage = new CustomerPage(page);

    // 1. Navigate to Customers and open 'Add Customer' form
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // 2. Enter 'Canada' in the Country field
    await customerPage.loc.countryInput.fill('Canada');
    await customerPage.loc.countryInput.blur();

    // Wait for the state input to appear (non-US branch)
    await customerPage.waitForVisible(customerPage.loc.stateInput);

    // 3. Assert State SELECT (data-testid='customer-state-select') is NOT present / hidden
    await expect(customerPage.loc.stateSelect).not.toBeVisible();

    // 4. Assert State INPUT is visible and disabled
    await expect(customerPage.loc.stateInput).toBeVisible();
    await expect(customerPage.loc.stateInput).toBeDisabled();

    // Clean up — cancel the form
    await customerPage.cancelForm();
  });

});
