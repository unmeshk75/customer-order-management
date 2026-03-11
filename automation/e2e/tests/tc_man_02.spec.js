/**
 * tc_man_02.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TC-MAN-02: Switching Country FROM "US" TO a non-US country hides the state
 *            dropdown and resets the state field to a disabled empty input.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';

test.describe('TC-MAN-02: Switching Country FROM US TO Non-US Hides State Dropdown', () => {

  test('[Positive] Set US → select state NY → confirm dropdown visible', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Set to US — dropdown appears
    await customerPage.loc.countryInput.fill('US');
    await customerPage.loc.countryInput.blur();
    await customerPage.waitForVisible(customerPage.loc.stateSelect);

    await customerPage.loc.stateSelect.selectOption('NY');
    await expect(customerPage.loc.stateSelect).toHaveValue('NY');

    await customerPage.cancelForm();
  });

  test('[Positive] Changing country from US to Canada hides state dropdown', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Pre-condition: set US, select NY
    await customerPage.loc.countryInput.fill('US');
    await customerPage.loc.countryInput.blur();
    await customerPage.waitForVisible(customerPage.loc.stateSelect);
    await customerPage.loc.stateSelect.selectOption('NY');

    // Change to Canada
    await customerPage.loc.countryInput.fill('Canada');
    await customerPage.loc.countryInput.blur();

    // Dropdown disappears
    await expect(customerPage.loc.stateSelect).not.toBeVisible();

    // Disabled input reappears and is empty
    await expect(customerPage.loc.stateInput).toBeVisible();
    await expect(customerPage.loc.stateInput).toBeDisabled();
    await expect(customerPage.loc.stateInput).toHaveValue('');

    await customerPage.cancelForm();
  });

  test('[Positive] stateControlViaLabel resolves to disabled input after non-US country', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    await customerPage.loc.countryInput.fill('Germany');
    await customerPage.loc.countryInput.blur();
    await customerPage.waitForVisible(customerPage.loc.stateInput);

    // XPath following-sibling locator should resolve to the disabled input
    const controlViaLabel = customerPage.loc.stateControlViaLabel;
    await expect(controlViaLabel).toBeVisible();
    await expect(controlViaLabel).toBeDisabled();

    await customerPage.cancelForm();
  });

});
