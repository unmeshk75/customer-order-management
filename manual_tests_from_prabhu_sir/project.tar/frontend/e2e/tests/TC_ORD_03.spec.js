/**
 * TC_ORD_03.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test: Stock Management — stock decreases on order creation,
 *       increases on order cancellation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { NavigationPage }  from '../pages/NavigationPage.js';
import { OrderPage }       from '../pages/OrderPage.js';
import { ProductPage }     from '../pages/ProductPage.js';
import { ApiHelper }       from '../utils/ApiHelper.js';
import { AssertionHelper } from '../utils/AssertionHelper.js';

test.describe('TC_ORD_03 — Stock Management', () => {

  const suffix = Date.now();
  let consumer, product;
  const INITIAL_STOCK = 50;
  const ORDER_SEATS   = 5;

  test.beforeAll(async ({ request }) => {
    const api = new ApiHelper(request);
    consumer = await api.createCustomer({
      name: `StockCon ${suffix}`, customer_type: 'Consumer',
      email: `stock.${suffix}@t.com`, account_status: 'Active', contact_preference: 'Email',
    });
    product = await api.createProduct({
      name: `StockProd ${suffix}`, product_type: 'Basic',
      price_per_seat: 10, stock_quantity: INITIAL_STOCK,
    });
  });

  test.afterAll(async ({ request }) => {
    const api = new ApiHelper(request);
    await api.deleteCustomer(consumer.id).catch(() => {});
    await api.deleteProduct(product.id).catch(() => {});
  });

  test('[Positive] Stock decreases by the number of seats after order creation', async ({ page, request }) => {
    const nav    = new NavigationPage(page);
    const ord    = new OrderPage(page);
    const prod   = new ProductPage(page);
    const api    = new ApiHelper(request);
    const assert = new AssertionHelper(page);

    // Get initial stock via API
    const before = (await api.getProductById(product.id)).stock_quantity;

    await nav.goto();
    await nav.goToOrders();

    await ord.createOrder({
      customerName: consumer.name,
      productLabel: product.name,
      seats: ORDER_SEATS,
    });

    // Verify stock decreased via Products page
    await nav.goToProducts();

    const after = (await api.getProductById(product.id)).stock_quantity;
    assert.assertStockDecreased(before, after);
    expect(after).toBe(before - ORDER_SEATS);
  });

  test('[Positive] Stock increases after order is cancelled', async ({ page, request }) => {
    const nav    = new NavigationPage(page);
    const ord    = new OrderPage(page);
    const api    = new ApiHelper(request);
    const assert = new AssertionHelper(page);

    // 1. Get current stock before this test
    const stockBefore = (await api.getProductById(product.id)).stock_quantity;

    // 2. Create an order to reduce stock
    await nav.goto();
    await nav.goToOrders();

    await ord.createOrder({
      customerName: consumer.name,
      productLabel: product.name,
      seats: ORDER_SEATS,
    });

    const stockAfterCreate = (await api.getProductById(product.id)).stock_quantity;
    expect(stockAfterCreate).toBe(stockBefore - ORDER_SEATS);

    // 3. Find the newly created order (last in the list) and cancel it
    await nav.goToOrders();

    // Get all orders and find the most recent one for this customer
    const allOrders  = await api.getAllOrders();
    const myOrders   = allOrders
      .filter(o => o.customer_id === consumer.id && o.status === 'Active')
      .sort((a, b) => b.id - a.id);
    const latestOrder = myOrders[0];

    // Edit the order — set status to Cancelled via UI wizard
    await ord.editOrderStatus(latestOrder.id, 'Cancelled');

    // 4. Verify stock increased back
    const stockAfterCancel = (await api.getProductById(product.id)).stock_quantity;
    assert.assertStockIncreased(stockAfterCreate, stockAfterCancel);
    expect(stockAfterCancel).toBe(stockBefore);
  });

  test('[Positive] Stock indicator in order wizard reflects current stock', async ({ page }) => {
    const nav = new NavigationPage(page);
    const ord = new OrderPage(page);

    await nav.goto();
    await nav.goToOrders();
    await ord.openCreateForm();

    await ord.selectCustomerById(consumer.id);
    await ord.goToStep2();

    // Select the product
    await ord.selectProduct(0, product.name);

    // Stock indicator should be visible and show a number
    const indicatorText = await ord.getStockIndicatorText(0);
    expect(indicatorText).toMatch(/\d+ in stock/);
  });

});
