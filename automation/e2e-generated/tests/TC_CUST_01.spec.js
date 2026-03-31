import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC-CUST-01: Entering "US" as country renders State dropdown', () => {

  test('[Positive] Entering "US" as country renders State dropdown', async ({ page }) => {
    const customerPage = new CustomerPage(page);

    // 1. Navigate to Customers and open 'Add Customer' form
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // 2. Assert State INPUT is visible and disabled before entering country
    await expect(customerPage.loc.stateInput).toBeVisible();
    await expect(customerPage.loc.stateInput).toBeDisabled();

    // 3. Enter 'US' in the Country field
    await customerPage.loc.countryInput.fill('US');
    await customerPage.loc.countryInput.blur();

    // 4. Assert State SELECT dropdown is visible using XPath locator
    const stateSelectByXPath = page.locator('xpath=//label[@for="customer-state"]/following-sibling::select');
    await expect(stateSelectByXPath).toBeVisible();

    // Also assert via the page object's built-in stateSelect locator
    await expect(customerPage.loc.stateSelect).toBeVisible();
    await expect(customerPage.loc.stateSelect).toBeEnabled();

    // 5. Assert State label text contains '*' indicating it is required
    await expect(customerPage.loc.stateLabel).toContainText('*');

    // Clean up
    await customerPage.cancelForm();
  });

});
