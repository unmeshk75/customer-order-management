/**
 * tc_man_01.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TC-MAN-01: Typing "US" in Country dynamically replaces the disabled state
 *            input with a populated state <select> dropdown.
 *
 * Assertions use:
 *  • Locator-based waits (no hardcoded ms)
 *  • customerPage.loc.stateLabel — XPath locator from CustomerLocators
 *  • XPath in-test assertion for option count
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';

const ALL_US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

test.describe('TC-MAN-01: US Country Entry Dynamically Renders State Dropdown', () => {

  test('[Positive] State input is disabled before country is set', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // State field starts as a disabled plain input
    await expect(customerPage.loc.stateInput).toBeDisabled();
    await expect(customerPage.loc.stateInput).toHaveAttribute('placeholder', 'Only for US addresses');

    // Cancel cleanly
    await customerPage.cancelForm();
  });

  test('[Positive] Typing US replaces disabled input with state dropdown', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    // Set country to US and blur
    await customerPage.loc.countryInput.fill('US');
    await customerPage.loc.countryInput.blur();

    // Disabled input disappears, dropdown appears
    await expect(customerPage.loc.stateInput).not.toBeVisible();
    await expect(customerPage.loc.stateSelect).toBeVisible();
    await expect(customerPage.loc.stateSelect).toBeEnabled();

    await customerPage.cancelForm();
  });

  test('[Positive] State dropdown contains all 50 US states', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    await customerPage.loc.countryInput.fill('US');
    await customerPage.loc.countryInput.blur();
    await customerPage.waitForVisible(customerPage.loc.stateSelect);

    // Collect non-placeholder option values
    const options = await customerPage.loc.stateSelect.locator('option').all();
    const values = [];
    for (const opt of options) {
      const v = await opt.getAttribute('value');
      if (v) values.push(v);
    }

    expect(values.length).toBe(50);
    for (const state of ALL_US_STATES) {
      expect(values).toContain(state);
    }

    await customerPage.cancelForm();
  });

  test('[Positive] Selecting a state from dropdown sets the value', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.navigateToCustomers();
    await customerPage.openCreateForm();

    await customerPage.loc.countryInput.fill('US');
    await customerPage.loc.countryInput.blur();
    await customerPage.waitForVisible(customerPage.loc.stateSelect);

    await customerPage.loc.stateSelect.selectOption('CA');
    await expect(customerPage.loc.stateSelect).toHaveValue('CA');

    // State label (XPath locator from CustomerLocators) should show required marker
    await expect(customerPage.loc.stateLabel).toContainText('*');

    await customerPage.cancelForm();
  });

});
