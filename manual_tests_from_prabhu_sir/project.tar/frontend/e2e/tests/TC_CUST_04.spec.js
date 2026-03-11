/**
 * TC_CUST_04.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Customer Search / Filter
 * Verifies:
 *   [Positive] Searching by name filters the table correctly.
 *   [Positive] Searching by email filters the table correctly.
 *   [Negative] Searching with no-match term shows 'No customers match' message.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { CustomerPage }    from '../pages/CustomerPage.js';
import { ApiHelper }       from '../utils/ApiHelper.js';
import { AssertionHelper } from '../utils/AssertionHelper.js';

test.describe('TC_CUST_04 — Customer Search and Filter', () => {

  let createdIds = [];

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    for (const id of createdIds) {
      await api.deleteCustomer(id).catch(() => {});
    }
  });

  test('[Positive] Search by customer name returns matching rows', async ({ page, request }) => {
    const api    = new ApiHelper(request);
    const nav    = new NavigationPage(page);
    const cust   = new CustomerPage(page);
    const assert = new AssertionHelper(page);
    const suffix = Date.now();

    // Setup — create two customers via API
    const c1 = await api.createCustomer({
      name: `SearchAlpha ${suffix}`, customer_type: 'Consumer',
      email: `alpha.${suffix}@s.test`, account_status: 'Active', contact_preference: 'Email',
    });
    const c2 = await api.createCustomer({
      name: `SearchBeta ${suffix}`, customer_type: 'Consumer',
      email: `beta.${suffix}@s.test`, account_status: 'Active', contact_preference: 'Email',
    });
    createdIds.push(c1.id, c2.id);

    await nav.goto();
    await nav.goToCustomers();

    // Search for 'SearchAlpha'
    await cust.search(`SearchAlpha ${suffix}`);

    // XPath: rows that contain the search term in the name cell
    const matchingRows = page.locator(
      `xpath=//table[@id="customers-table"]//tbody//tr[@data-customer-id]` +
      `[.//td[contains(text(),"SearchAlpha ${suffix}")]]`
    );
    await assert.assertCountAtLeast(matchingRows, 1);

    // Beta row should NOT be visible
    const betaCell = page.locator(
      `xpath=//table[@id="customers-table"]//td[contains(text(),"SearchBeta")]`
    );
    await expect(betaCell).toBeHidden();

    // Filter count should show "Showing 1 of N"
    const filterCount = page.locator(
      'xpath=//div[@data-testid="customer-filter-bar"]//span[contains(@class,"filter-count")]'
    );
    await expect(filterCount).toContainText('Showing 1');
  });

  test('[Positive] Search by email returns correct customer', async ({ page, request }) => {
    const api  = new ApiHelper(request);
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);
    const suffix = Date.now() + 1;

    const c = await api.createCustomer({
      name: `EmailSearch ${suffix}`, customer_type: 'Consumer',
      email: `unique.email.${suffix}@search.test`, account_status: 'Active', contact_preference: 'Email',
    });
    createdIds.push(c.id);

    await nav.goto();
    await nav.goToCustomers();

    await cust.search(`unique.email.${suffix}@search.test`);

    const emailCell = page.locator(
      `xpath=//table[@id="customers-table"]//td[normalize-space(text())="unique.email.${suffix}@search.test"]`
    );
    await expect(emailCell).toBeVisible();
  });

  test('[Negative] No-match search shows empty state message', async ({ page }) => {
    const nav  = new NavigationPage(page);
    const cust = new CustomerPage(page);

    await nav.goto();
    await nav.goToCustomers();

    // Search for something guaranteed not to exist
    await cust.search('NOMATCH_XYZ_99999_IMPOSSIBLE');

    const noData = page.locator(
      'xpath=//p[contains(@class,"no-data") and contains(text(),"No customers match")]'
    );
    await expect(noData).toBeVisible();
  });

});
