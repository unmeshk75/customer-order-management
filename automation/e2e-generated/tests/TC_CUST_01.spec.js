import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC-CUST-01: Entering US as country renders State dropdown', () => {

  test.beforeAll(async ({ request }) => {
    // No pre-seeded data required for this UI-only test
  });

  test.afterAll(async ({ request }) => {
    // No data to clean up
  });

  test('[Positive] Entering "US" as country renders State dropdown', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Assert State INPUT is visible and disabled before entering country
    await expect(customerPage.loc.stateInput).toBeVisible();
    await expect(customerPage.loc.stateInput).toBeDisabled();

    // Enter 'US' in the Country field and blur to trigger React onChange
    await customerPage.loc.countryInput.fill('US');
    await customerPage.loc.countryInput.blur();

    // Assert State SELECT dropdown is visible (XPath: //label[@for='customer-state']/following-sibling::select)
    const stateSelectXPath = page.locator('xpath=//label[@for="customer-state"]/following-sibling::select');
    await expect(stateSelectXPath).toBeVisible();

    // Assert State label text contains '*' indicating it is required
    await expect(customerPage.loc.stateLabel).toContainText('*');

    await customerPage.cancelForm();
  });

});
