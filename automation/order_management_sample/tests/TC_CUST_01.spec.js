import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC_CUST_01-TC01: [Positive] Entering \'US\' as country renders State dropdown', () => {

  test('[Positive] Entering \'US\' as country renders State dropdown', async ({ page }) => {
    const customerPage = new CustomerPage(page);

    // Step 1: Navigate to Customers and open 'Add Customer' form
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Step 2: Assert State INPUT is visible and disabled before entering country
    await expect(customerPage.loc.customerStateInput).toBeVisible();
    await expect(customerPage.loc.customerStateInput).toBeDisabled();

    // Step 3: Enter 'US' in the Country field
    await customerPage.loc.customerCountryInput.fill('US');
    await customerPage.loc.customerCountryInput.blur();

    // Step 4: Assert State SELECT dropdown is visible (XPath: //label[@for='customer-state']/following-sibling::select)
    const stateSelectXPath = page.locator("//label[@for='customer-state']/following-sibling::select");
    await expect(stateSelectXPath).toBeVisible();

    // Step 5: Assert State label text contains '*' indicating it is required
    const stateLabel = page.locator("//label[@for='customer-state']");
    await expect(stateLabel).toContainText('*');

    // Clean up: cancel the form
    await customerPage.cancelForm();
  });

});
