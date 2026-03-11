/**
 * TC_ORD_02.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: SMB and Enterprise Product Restrictions
 * Business Rules:
 *   SMB      → Professional, Teams
 *   Enterprise → Basic, Teams, Ultra-Enterprise
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { OrderPage }       from '../pages/OrderPage.js';
import { ApiHelper }       from '../utils/ApiHelper.js';
import { AssertionHelper } from '../utils/AssertionHelper.js';

test.describe('TC_ORD_02 — SMB and Enterprise Product Restrictions', () => {

  let smbCustomer, enterpriseCustomer;
  let basicProd, professionalProd, teamsProd, ultraProd;
  const suffix = Date.now();

  test.beforeAll(async ({ request }) => {
    const api = new ApiHelper(request);

    smbCustomer = await api.createCustomer({
      name: `SMB ${suffix}`, customer_type: 'SMB',
      email: `smb.${suffix}@t.com`, company_name: `Corp ${suffix}`,
      account_status: 'Active', contact_preference: 'Email',
    });
    enterpriseCustomer = await api.createCustomer({
      name: `Ent ${suffix}`, customer_type: 'Enterprise',
      email: `ent.${suffix}@t.com`, company_name: `EntCorp ${suffix}`,
      account_status: 'Active', contact_preference: 'Email',
    });

    basicProd        = await api.createProduct({ name: `BasicR ${suffix}`,   product_type: 'Basic',          price_per_seat: 10, stock_quantity: 100 });
    professionalProd = await api.createProduct({ name: `ProfR ${suffix}`,    product_type: 'Professional',   price_per_seat: 30, stock_quantity: 100 });
    teamsProd        = await api.createProduct({ name: `TeamsR ${suffix}`,   product_type: 'Teams',          price_per_seat: 50, stock_quantity: 100 });
    ultraProd        = await api.createProduct({ name: `UltraR ${suffix}`,   product_type: 'Ultra-Enterprise', price_per_seat: 200, stock_quantity: 50 });
  });

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.deleteCustomer(smbCustomer.id).catch(() => {});
    await api.deleteCustomer(enterpriseCustomer.id).catch(() => {});
    for (const p of [basicProd, professionalProd, teamsProd, ultraProd]) {
      await api.deleteProduct(p.id).catch(() => {});
    }
  });

  // ── SMB Tests ──────────────────────────────────────────────────────────────

  test('[SMB Positive] SMB product dropdown contains Professional and Teams', async ({ page }) => {
    const nav    = new NavigationPage(page);
    const ord    = new OrderPage(page);
    const assert = new AssertionHelper(page);

    await nav.goto();
    await nav.goToOrders();
    await ord.openCreateForm();
    await ord.selectCustomerById(smbCustomer.id);
    await ord.goToStep2();

    const options = await ord.getAvailableProductOptions(0);
    assert.assertProductOptionsMatchAllowedTypes(options, ['Professional', 'Teams']);
  });

  test('[SMB Negative] SMB product dropdown does NOT contain Basic or Ultra-Enterprise', async ({ page }) => {
    const nav    = new NavigationPage(page);
    const ord    = new OrderPage(page);
    const assert = new AssertionHelper(page);

    await nav.goto();
    await nav.goToOrders();
    await ord.openCreateForm();
    await ord.selectCustomerById(smbCustomer.id);
    await ord.goToStep2();

    const options = await ord.getAvailableProductOptions(0);
    assert.assertProductOptionsExcludeForbiddenTypes(options, ['Basic', 'Ultra-Enterprise']);
  });

  // ── Enterprise Tests ───────────────────────────────────────────────────────

  test('[Enterprise Positive] Enterprise dropdown contains Basic, Teams, Ultra-Enterprise', async ({ page }) => {
    const nav    = new NavigationPage(page);
    const ord    = new OrderPage(page);
    const assert = new AssertionHelper(page);

    await nav.goto();
    await nav.goToOrders();
    await ord.openCreateForm();
    await ord.selectCustomerById(enterpriseCustomer.id);
    await ord.goToStep2();

    const options = await ord.getAvailableProductOptions(0);
    assert.assertProductOptionsMatchAllowedTypes(options, ['Basic', 'Teams', 'Ultra-Enterprise']);
  });

  test('[Enterprise Negative] Enterprise dropdown does NOT contain Professional', async ({ page }) => {
    const nav    = new NavigationPage(page);
    const ord    = new OrderPage(page);
    const assert = new AssertionHelper(page);

    await nav.goto();
    await nav.goToOrders();
    await ord.openCreateForm();
    await ord.selectCustomerById(enterpriseCustomer.id);
    await ord.goToStep2();

    const options = await ord.getAvailableProductOptions(0);
    assert.assertProductOptionsExcludeForbiddenTypes(options, ['Professional']);
  });

  test('[SMB Positive] SMB customer can place order with Teams product', async ({ page }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);

    await nav.goto();
    await nav.goToOrders();

    await ord.createOrder({
      customerName: smbCustomer.name,
      productLabel: teamsProd.name,
      seats: 2,
    });

    const row = page.locator(
      `xpath=//table[@id="orders-table"]//td[contains(text(),"${smbCustomer.name}")]`
    );
    await expect(row).toBeVisible();
  });

  test('[Enterprise Positive] Enterprise customer can place order with Ultra-Enterprise product', async ({ page }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);

    await nav.goto();
    await nav.goToOrders();

    await ord.createOrder({
      customerName: enterpriseCustomer.name,
      productLabel: ultraProd.name,
      seats: 5,
    });

    const row = page.locator(
      `xpath=//table[@id="orders-table"]//td[contains(text(),"${enterpriseCustomer.name}")]`
    );
    await expect(row).toBeVisible();
  });

});
