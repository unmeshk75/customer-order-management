/**
 * TC_CUST_01.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * TC_CUST_01-TC01: Entering 'US' as country renders State dropdown.
 *
 * Before country=US: State is a disabled INPUT.
 * After typing 'US': a State SELECT dropdown appears.
 * State label shows '*' indicating it is required.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage.js';
import { ApiHelper } from '../utils/ApiHelper.js';

test.describe('TC-CUST_01: Entering US as country renders State dropdown', () => {

  test.beforeAll(async ({ request }) => {
    // No pre-seeded data required for this UI-only form interaction test
  });

  test.afterAll(async ({ request }) => {
    // No data was created via API — nothing to clean up
  });

  test('[Positive] Entering "US" as country renders State dropdown', async ({ page }) => {
    const customersPage = new CustomerPage(page);

    // 1. Navigate to Customers and open 'Add Customer' form
    await customersPage.navigateToCustomers();
    await customersPage.openCreateForm();

    // 2. Assert State INPUT is visible and disabled before entering country
    const stateInput = page.locator('input#customer-state, input[id*="state"]').first();
    await expect(stateInput).toBeVisible();
    await expect(stateInput).toBeDisabled();

    // 3. Enter 'US' in the Country field
    const countryInput = page.locator('input#customer-country, input[id*="country"]').first();
    await expect(countryInput).toBeVisible();
    await countryInput.fill('US');
    await countryInput.blur();

    // 4. Assert State SELECT dropdown is visible after entering 'US'
    const stateSelect = page.locator('//label[@for="customer-state"]/following-sibling::select');
    await stateSelect.waitFor({ state: 'visible' });
    await expect(stateSelect).toBeVisible();
    await expect(stateSelect).toBeEnabled();

    // 5. Assert State label text contains '*' (required indicator)
    const stateLabel = page.locator('label[for="customer-state"]');
    await expect(stateLabel).toContainText('*');

    // Clean up — cancel the form
    await customersPage.cancelForm();
  });

});
