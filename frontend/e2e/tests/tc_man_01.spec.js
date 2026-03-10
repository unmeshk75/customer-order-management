import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';

const ALL_US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

test.describe('TC-MAN-01: US Country Entry Dynamically Renders State Dropdown', () => {

  test('typing US in country field replaces disabled input with select', async ({ page }) => {
    const customerPage = new CustomerPage(page);

    // Step 1: Navigate to the Customers tab
    await customerPage.navigateToCustomers();

    // Step 2: Open the Create Customer form
    await customerPage.openCreateForm();

    // Step 3: Verify state field is a DISABLED input before country is set
    await expect(customerPage.loc.stateInput).toBeDisabled();
    await expect(customerPage.loc.stateInput).toHaveAttribute('placeholder', 'Only for US addresses');

    // Step 4: Type 'US' in the Country field
    await customerPage.loc.countryInput.click();
    await customerPage.loc.countryInput.fill('US');
    await expect(customerPage.loc.countryInput).toHaveValue('US');

    // Step 5: Blur the country field to trigger handleCountryChange
    await customerPage.loc.countryInput.blur();

    // Disabled input should no longer be visible
    await expect(customerPage.loc.stateInput).not.toBeVisible();

    // State <select> dropdown should now appear
    await expect(customerPage.loc.stateSelect).toBeVisible();
    await expect(customerPage.loc.stateSelect).toBeEnabled();

    // Step 6: Verify dropdown contains exactly 50 US state options
    const options = await customerPage.loc.stateSelect.locator('option').all();
    const optionValues = [];
    for (const opt of options) {
      const val = await opt.getAttribute('value');
      if (val) optionValues.push(val); // Filter out blank placeholder
    }

    expect(optionValues.length).toBe(50);
    for (const state of ALL_US_STATES) {
      expect(optionValues).toContain(state);
    }

    // Step 7: Select 'CA' from the state dropdown
    await customerPage.loc.stateSelect.selectOption('CA');
    await expect(customerPage.loc.stateSelect).toHaveValue('CA');

    // State label should show asterisk (*) indicating required field
    const stateLabel = page.locator("label[for='customer-state'], label:has-text('State')");
    await expect(stateLabel).toContainText('*');
  });

});
