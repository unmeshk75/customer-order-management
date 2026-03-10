import { test, expect } from '@playwright/test';
import { OrderPage } from '../pages/OrderPage.js';

const API_URL = process.env.API_URL || 'http://localhost:8000/api';

test.describe('TC-MAN-03: Selecting a Customer Dynamically Loads the Products Section', () => {
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

    const customer = await createCustomer("Alice Consumer", "Consumer", "alice.tc03@example.com");
    const basic = await createProduct("Basic Plan TC03", "Basic", 9.99);
    const pro = await createProduct("Professional Plan TC03", "Professional", 19.99);

    seededData = { customer, basic, pro };
  });

  test('selecting a customer renders products section and enables submit', async ({ page }) => {
    const orderPage = new OrderPage(page);
    const customer = seededData.customer;
    const customerLabel = `${customer.name} (Consumer)`;

    // Navigate to Orders tab
    await orderPage.navigateToOrders();

    // Step 1: Open Create Order form
    await orderPage.openCreateForm();

    // order-products-section exists in DOM but must not be visible before customer is selected
    await expect(orderPage.loc.productsSection).not.toBeVisible();

    // Step 2: Next button must be DISABLED before customer is selected
    const nextBtn = orderPage.loc.nextBtn;
    await expect(nextBtn).toBeDisabled();

    // Step 3: Customer dropdown lists all customers in 'Name (Type)' format
    const customerSelect = orderPage.loc.customerSelect;
    await expect(customerSelect).toBeVisible();
    const options = await customerSelect.locator('option').allTextContents();
    const hasConsumer = options.some(opt => opt.includes('Consumer'));
    expect(hasConsumer).toBeTruthy();

    // Step 4: Select the Consumer customer (inline to capture intermediate state)
    await customerSelect.selectOption({ label: customerLabel });
    await expect(customerSelect).toHaveValue(String(customer.id));

    // Step 5: Next button is now ENABLED (customer selected — key assertion of this test)
    await expect(nextBtn).toBeEnabled();

    // Advance to Step 2 (Products)
    await nextBtn.click();

    // Step 5 cont: products section is now visible
    const productsSection = orderPage.loc.productsSection;
    await expect(productsSection).toBeVisible();

    // Product row 0 with select + seats input + 'Add Another Product' button
    await expect(orderPage.loc.productRow(0)).toBeVisible();
    await expect(orderPage.loc.orderSeatsInput(0)).toBeVisible();
    await expect(orderPage.loc.addProductBtn).toBeVisible();

    // Step 6: Info text banner shows allowed product types for Consumer
    const infoText = productsSection.locator('text=Available products for Consumer').first();
    await expect(infoText).toBeVisible();
    const bannerText = await infoText.textContent();
    expect(bannerText).toContain('Basic');
    expect(bannerText).toContain('Professional');
  });
});
