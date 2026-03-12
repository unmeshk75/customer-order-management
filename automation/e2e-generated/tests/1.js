import { test, expect } from '@playwright/test';
import { CustomersPage } from '../pages/CustomersPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC_CUST_01: Country/State Field Dynamic Behavior', () => {

  // No seed data required — these tests exercise form UI only.
  // ApiHelper imported for consistency and future extensibility.

  test('[Positive] Entering "US" as country renders State dropdown', async ({ page }) => {
    const customersPage = new CustomersPage(page);

    await customersPage.navigateToCustomers();
    await customersPage.openCreateForm();

    // Before setting country, State is a disabled plain INPUT
    await expect(customersPage.loc.stateInput).toBeVisible();
    await expect(customersPage.loc.stateInput).toBeDisabled();

    // Enter 'US' in the Country field and move focus away
    await customersPage.loc.countryInput.fill('US');
    await customersPage.loc.countryInput.blur();

    // State SELECT dropdown must appear (XPath from spec steps)
    const stateSelectXPath = page.locator("//label[@for='customer-state']/following-sibling::select");
    await expect(stateSelectXPath).toBeVisible();
    await expect(stateSelectXPath).toBeEnabled();

    // State label must carry the required marker '*'
    await expect(customersPage.loc.stateLabel).toContainText('*');

    await customersPage.cancelForm();
  });

  test('[Negative] Non-US country keeps State as disabled input', async ({ page }) => {
    const customersPage = new CustomersPage(page);

    await customersPage.navigateToCustomers();
    await customersPage.openCreateForm();

    // Enter a non-US country and move focus away
    await customersPage.loc.countryInput.fill('Canada');
    await customersPage.loc.countryInput.blur();

    // State SELECT must NOT be visible (checked via data-testid)
    const stateSelectByTestId = page.locator('[data-testid="customer-state-select"]');
    await expect(stateSelectByTestId).not.toBeVisible();

    // State INPUT must remain visible and disabled
    await expect(customersPage.loc.stateInput).toBeVisible();
    await expect(customersPage.loc.stateInput).toBeDisabled();

    await customersPage.cancelForm();
  });

});
