/**
 * ApiHelper.js
 * ─────────────────────────────────────────────────────────────────────────────
 * REST API helpers for test setup and teardown.
 * Uses Playwright's built-in `request` context — no extra HTTP client needed.
 *
 * Usage in tests:
 *   import { ApiHelper } from '../utils/ApiHelper.js';
 *   const api = new ApiHelper(request);
 *   const customer = await api.createCustomer({ ... });
 *   await api.deleteCustomer(customer.id);
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class ApiHelper {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   */
  constructor(request) {
    this.request = request;
    this.base    = process.env.API_BASE_URL || 'http://localhost:8000/api';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Customers
  // ══════════════════════════════════════════════════════════════════════════

  async getAllCustomers() {
    const res = await this.request.get(`${this.base}/customers`);
    return res.json();
  }

  async createCustomer(data) {
    const res = await this.request.post(`${this.base}/customers`, { data });
    if (!res.ok()) {
      const body = await res.json();
      throw new Error(`createCustomer failed: ${JSON.stringify(body)}`);
    }
    return res.json();
  }

  async deleteCustomer(id) {
    await this.request.delete(`${this.base}/customers/${id}`);
  }

  /**
   * Delete all customers that have a name matching a pattern.
   * Used in test teardown to clean up test data.
   */
  async cleanupCustomersByName(namePattern) {
    const customers = await this.getAllCustomers();
    for (const c of customers) {
      if (c.name && c.name.includes(namePattern)) {
        await this.deleteCustomer(c.id).catch(() => {/* ignore */});
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Products
  // ══════════════════════════════════════════════════════════════════════════

  async getAllProducts() {
    const res = await this.request.get(`${this.base}/products`);
    return res.json();
  }

  async getProductById(id) {
    const res = await this.request.get(`${this.base}/products/${id}`);
    return res.json();
  }

  async createProduct(data) {
    const res = await this.request.post(`${this.base}/products`, { data });
    if (!res.ok()) {
      const body = await res.json();
      throw new Error(`createProduct failed: ${JSON.stringify(body)}`);
    }
    return res.json();
  }

  async deleteProduct(id) {
    await this.request.delete(`${this.base}/products/${id}`);
  }

  /**
   * Delete all products with a name matching a pattern.
   */
  async cleanupProductsByName(namePattern) {
    const products = await this.getAllProducts();
    for (const p of products) {
      if (p.name && p.name.includes(namePattern)) {
        await this.deleteProduct(p.id).catch(() => {/* ignore */});
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Orders
  // ══════════════════════════════════════════════════════════════════════════

  async getAllOrders() {
    const res = await this.request.get(`${this.base}/orders`);
    return res.json();
  }

  async getOrderById(id) {
    const res = await this.request.get(`${this.base}/orders/${id}`);
    return res.json();
  }

  async createOrder(data) {
    const res = await this.request.post(`${this.base}/orders`, { data });
    if (!res.ok()) {
      const body = await res.json();
      throw new Error(`createOrder failed: ${JSON.stringify(body)}`);
    }
    return res.json();
  }

  async updateOrder(id, data) {
    const res = await this.request.put(`${this.base}/orders/${id}`, { data });
    if (!res.ok()) {
      const body = await res.json();
      throw new Error(`updateOrder failed: ${JSON.stringify(body)}`);
    }
    return res.json();
  }

  async deleteOrder(id) {
    await this.request.delete(`${this.base}/orders/${id}`);
  }

  /**
   * Cancel an order (change status to Cancelled via API).
   */
  async cancelOrder(id) {
    return this.updateOrder(id, { status: 'Cancelled' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dashboard
  // ══════════════════════════════════════════════════════════════════════════

  async getDashboard() {
    const res = await this.request.get(`${this.base}/dashboard`);
    return res.json();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Compound setup helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create a Consumer customer and a Basic product, then place an order.
   * Returns { customer, product, order }.
   * Useful for tests that need pre-existing order state.
   */
  async setupConsumerOrderWithBasic(suffix) {
    const s = suffix || Date.now();
    const customer = await this.createCustomer({
      name:          `Consumer ${s}`,
      customer_type: 'Consumer',
      email:         `c.${s}@setup.test`,
      account_status:'Active',
      contact_preference: 'Email',
    });

    const product = await this.createProduct({
      name:          `Basic Product ${s}`,
      product_type:  'Basic',
      price_per_seat: 10.00,
      stock_quantity: 50,
    });

    const order = await this.createOrder({
      customer_id:         customer.id,
      priority:            'Medium',
      discount_percentage: 0,
      products: [{ product_id: product.id, seats: 2 }],
    });

    return { customer, product, order };
  }

  /**
   * Create an SMB customer + Professional product + order.
   */
  async setupSMBOrderWithProfessional(suffix) {
    const s = suffix || Date.now();
    const customer = await this.createCustomer({
      name:          `SMB ${s}`,
      customer_type: 'SMB',
      email:         `smb.${s}@setup.test`,
      company_name:  `Corp ${s}`,
      account_status:'Active',
      contact_preference: 'Email',
    });

    const product = await this.createProduct({
      name:           `Professional Product ${s}`,
      product_type:   'Professional',
      price_per_seat: 30.00,
      stock_quantity: 40,
    });

    const order = await this.createOrder({
      customer_id:         customer.id,
      priority:            'High',
      discount_percentage: 0,
      products: [{ product_id: product.id, seats: 1 }],
    });

    return { customer, product, order };
  }
}
