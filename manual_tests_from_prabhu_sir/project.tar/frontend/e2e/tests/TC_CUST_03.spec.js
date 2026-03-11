/**
 * TC_CUST_03.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Country = "US" makes State field mandatory (dynamic behavior)
 * Verifies:
 *   [Positive] When Country = 'US', a State SELECT dropdown appears and is required.
 *   [Negative] When Country ≠ 'US', State remains a disabled text INPUT.
 *   [Positive] Selecting US + State results in a successfully created customer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { CustomerPage }    from '../pages/CustomerPage.js';
import { CustomerLocators } from '../locators/CustomerLocators.js';
import { AssertionHelper } from '../utils/AssertionHelper.js';
import { TestDataFactory } from '../utils/TestDataFactory.js';

test.describe('TC_CUST_03 — Country/State Dynamic Behavior', () => {

  test('[Positive] Entering "US" as country renders State dropdown', async ({ page }) => {
    const nav    = new NavigationPage(page);
    const cust   = new CustomerPage(page);
    const loc    = new CustomerLocators(page);
    const assert = new AssertionHelper(page);

    await nav.goto();
    await nav.goToCustomers();
    await cust.openCreateForm();

    // Initially — state INPUT (disabled) should be visible
    await assert.assertVisible(loc.stateInput, 'State input visible before country selection');
    await assert.assertDisabled(loc.stateInput, 'State input disabled before country selection');

    // Type 'US' in the country field
    await cust.fillCountry('US');

    // State SELECT should now appear — following-sibling XPath strategy
    const stateSelectViaLabel = page.locator(
      'xpath=//label[@for="customer-state"]/following-sibling::select[@data-testid="customer-state-select"]'
    );
    await assert.assertVisible(stateSelectViaLabel, 'State SELECT appears after country = US');

    // State label should now include '*'
    const labelText = await cust.getStateLabelText();
    expect(labelText).toContain('*');
  });

  test('[Negative] Non-US country keeps State as disabled input', async ({ page }) => {
    const nav    = new NavigationPage(page);
    const cust   = new CustomerPage(page);
    const assert = new AssertionHelper(page);

    await nav.goto();
    await nav.goToCustomers();
    await cust.openCreateForm();

    // Enter a non-US country
    await cust.fillCountry('Canada');

    // State SELECT should NOT appear
    const stateSelect = page.getByTestId('customer-state-select');
    await expect(stateSelect).toBeHidden();

    // State INPUT should still be visible and disabled
    await assert.assertStateInputDisabled();
  });

  test('[Positive] US customer with state selected is created successfully', async ({ page }) => {
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);
    const data = TestDataFactory.usCustomer();

    await nav.goto();
    await nav.goToCustomers();
    await cust.openCreateForm();

    await cust.fillName(data.name);
    await cust.selectType('Consumer');
    await cust.fillEmail(data.email);
    await cust.fillCity(data.city);
    await cust.fillZip(data.zip);

    // Fill US country — state dropdown should appear
    await cust.fillCountry('US');

    // Select state
    await cust.selectState(data.state);

    await cust.submitForm();

    // Verify customer row shows the US location
    const locationCell = page.locator(
      `xpath=//table[@id="customers-table"]//td[contains(text(),"${data.city}") and contains(text(),"US")]`
    );
    await expect(locationCell).toBeVisible();
  });

  test('[Negative] US customer without state selected fails HTML5 validation', async ({ page }) => {
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);

    await nav.goto();
    await nav.goToCustomers();
    await cust.openCreateForm();

    await cust.fillName('US No State');
    await cust.selectType('Consumer');
    await cust.fillEmail(`us.nostate.${Date.now()}@test.com`);
    await cust.fillCountry('US');
    // Do NOT select a state

    // Attempt to submit — HTML5 required validation should prevent submission
    await page.getByTestId('submit-customer-btn').click();

    // Form should still be visible (not closed)
    await expect(page.locator('#customer-form')).toBeVisible();
  });

  test('[Dynamic] Switching country from US to non-US clears state and disables field', async ({ page }) => {
    const nav = new NavigationPage(page);
    const cust = new CustomerPage(page);

    await nav.goto();
    await nav.goToCustomers();
    await cust.openCreateForm();

    // Set country to US — state select appears
    await cust.fillCountry('US');
    await expect(page.getByTestId('customer-state-select')).toBeVisible();
    await cust.selectState('TX');

    // Change country to UK — state select should disappear, input should be empty+disabled
    await cust.fillCountry('UK');
    await expect(page.getByTestId('customer-state-select')).toBeHidden();

    const stateInput = page.getByTestId('customer-state-input');
    await expect(stateInput).toBeVisible();
    await expect(stateInput).toBeDisabled();
    await expect(stateInput).toHaveValue('');
  });

});
