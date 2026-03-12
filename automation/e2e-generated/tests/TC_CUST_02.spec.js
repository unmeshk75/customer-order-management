import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC_CUST_01-TC02: [Negative] Non-US country keeps State as disabled input', () => {

  test.beforeAll(async ({ request }) => {
    // No seed data required for this UI-only negative test
  });

  test.afterAll(async ({ request }) => {
    // No seeded data to clean up
  });

  test('[Negative] Non-US country keeps State as disabled input', async ({ page }) => {
    const customerPage = new CustomerPage(page);

    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Enter a non-US country
    await customerPage.loc.countryInput.fill('Canada');
    await customerPage.loc.countryInput.blur();

    // Wait for the state input to appear (non-US path)
    await expect(customerPage.loc.stateInput).toBeVisible();

    // State SELECT must NOT be present / visible
    await expect(customerPage.loc.stateSelect).not.toBeVisible();

    // State INPUT must be visible and disabled
    await expect(customerPage.loc.stateInput).toBeVisible();
    await expect(customerPage.loc.stateInput).toBeDisabled();

    await customerPage.cancelForm();
  });

});
