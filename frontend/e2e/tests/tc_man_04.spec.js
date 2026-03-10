import { test, expect } from '@playwright/test';
import { OrderPage } from '../pages/OrderPage.js';

const API_URL = process.env.API_URL || 'http://localhost:8000/api';

test.describe('TC-MAN-04: Consumer Customer Sees ONLY Basic & Professional Products', () => {
  let seededData = {};

  test.beforeAll(async ({ request }) => {
    // Helper to create customer
    const createCustomer = async (name, customer_type, email) => {
      const res = await request.post(`${API_URL}/customers`, {
        data: { name, customer_type, email }
      });
      if (res.status() === 400) {
        const text = await res.text();
        if (text.includes("already registered")) {
          const allRes = await request.get(`${API_URL}/customers`);
          const customers = await allRes.json();
          return customers.find(c => c.email === email);
        }
      }
      expect(res.ok()).toBeTruthy();
      return await res.json();
    };

    // Helper to create product
    const createProduct = async (name, product_type, price) => {
      const res = await request.post(`${API_URL}/products`, {
        data: { name, product_type, price_per_seat: price }
      });
      if (res.status() === 400) {
        const allRes = await request.get(`${API_URL}/products`);
        const products = await allRes.json();
        return products.find(p => p.name === name);
      }
      expect(res.ok()).toBeTruthy();
      return await res.json();
    };

    const customer = await createCustomer("Alice TC04", "Consumer", "alice.tc04@example.com");
    const basic = await createProduct("Basic TC04", "Basic", 9.99);
    const professional = await createProduct("Professional TC04", "Professional", 19.99);
    const teams = await createProduct("Teams TC04", "Teams", 29.99);
    const ultra = await createProduct("Ultra TC04", "Ultra-Enterprise", 99.99);

    seededData = { customer, basic, professional, teams, ultra };
  });

  test('Consumer product filter & API validation', async ({ page, request }) => {
    const orderPage = new OrderPage(page);
    const customer = seededData.customer;
    const teamsId = seededData.teams.id;
    const basicId = seededData.basic.id;
    const customerLabel = `${customer.name} (Consumer)`;

    // Navigate to Orders tab and open the Create Order form
    await orderPage.navigateToOrders();
    await orderPage.openCreateForm();

    // Step 1: Select Consumer customer -> products section appears
    await orderPage.selectCustomer(customerLabel);

    // Info banner confirms allowed types for Consumer
    const infoText = orderPage.loc.productsSection.locator('text=Available products for Consumer').first();
    await expect(infoText).toBeVisible();
    const bannerText = await infoText.textContent();
    expect(bannerText).toContain('Basic');
    expect(bannerText).toContain('Professional');

    // Step 2: Open product dropdown in row 0
    const productSelect = orderPage.loc.orderProductSelect(0);
    await expect(productSelect).toBeVisible();

    // Step 3: Collect all options (excluding blank placeholder)
    const allOptions = await productSelect.locator('option').all();
    const optionTexts = [];
    for (const opt of allOptions) {
      if (await opt.getAttribute('value')) {
        optionTexts.push((await opt.textContent()).trim());
      }
    }

    // Step 4: At least one Basic product IS present
    const basicOptions = optionTexts.filter(t => t.includes('(Basic)'));
    expect(basicOptions.length).toBeGreaterThanOrEqual(1);

    // Step 5: At least one Professional product IS present
    const proOptions = optionTexts.filter(t => t.includes('(Professional)'));
    expect(proOptions.length).toBeGreaterThanOrEqual(1);

    // Step 6: Teams products are NOT present
    const teamsOptions = optionTexts.filter(t => t.includes('(Teams)'));
    expect(teamsOptions.length).toBe(0);

    // Step 7: Ultra-Enterprise products are NOT present
    const ultraOptions = optionTexts.filter(t => t.includes('(Ultra-Enterprise)'));
    expect(ultraOptions.length).toBe(0);

    // Step 8: Select a Basic product, set seats=2, submit the order successfully
    await productSelect.selectOption(String(basicId));
    await orderPage.loc.orderSeatsInput(0).fill('2');
    
    // Submit
    await orderPage.loc.submitBtn.click();
    await expect(orderPage.loc.orderForm).toBeHidden();
    
    // Order should appear in the orders table
    await orderPage.waitForVisible(orderPage.loc.orderListContainer);
    await expect(orderPage.loc.ordersTable).toContainText(customer.name);

    // Backend enforcement (API-level negative test)
    const invalidOrder = {
      customer_id: customer.id,
      products: [{ product_id: teamsId, seats: 1 }]
    };
    const apiResponse = await request.post(`${API_URL}/orders`, { data: invalidOrder });
    expect([400, 422]).toContain(apiResponse.status());
    
    const errObj = await apiResponse.json();
    const detail = errObj.detail || '';
    expect(detail.toLowerCase()).toContain('not available');
  });
});
