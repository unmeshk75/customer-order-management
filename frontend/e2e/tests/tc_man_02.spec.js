import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';

test.describe('TC-MAN-02: Switching Country FROM US TO Non-US Hides Dropdown & Clears State', () => {

  test('changing country from US to Canada hides state dropdown', async ({ page }) => {
    const customerPage = new CustomerPage(page);

    // --- PRE-CONDITIONS: Open form, set country=US, select state=NY ---
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();
    
    await customerPage.loc.countryInput.fill('US');
    await customerPage.loc.countryInput.blur();
    
    await expect(customerPage.loc.stateSelect).toBeVisible();
    await customerPage.loc.stateSelect.selectOption('NY');
    await expect(customerPage.loc.stateSelect).toHaveValue('NY');
    // --- END PRE-CONDITIONS ---

    // Step 1: Confirm state dropdown is visible and shows 'NY'
    await expect(customerPage.loc.stateSelect).toBeVisible();
    await expect(customerPage.loc.stateSelect).toHaveValue('NY');

    // Step 2: Clear Country field and type 'Canada'
    await customerPage.loc.countryInput.click();
    await customerPage.loc.countryInput.fill('Canada');
    await expect(customerPage.loc.countryInput).toHaveValue('Canada');

    // Step 3: Tab out to trigger handleCountryChange
    await customerPage.loc.countryInput.blur();

    // State <select> dropdown should disappear
    await expect(customerPage.loc.stateSelect).not.toBeVisible();

    // Disabled text input should reappear
    await expect(customerPage.loc.stateInput).toBeVisible();
    await expect(customerPage.loc.stateInput).toBeDisabled();

    // Step 4: Verify the disabled input is empty (state was cleared)
    await expect(customerPage.loc.stateInput).toHaveValue('');

    // Step 5: Attempt to click/type in the disabled state input
    // In Playwright, attempting to click a disabled element will wait forever statically unless forced.
    // Instead we just assert it's disabled.
    await expect(customerPage.loc.stateInput).toBeDisabled();
  });

});
