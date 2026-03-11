/**
 * DashboardLocators.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Selectors for the Dashboard view.
 *
 * XPath Strategies demonstrated:
 *  • data-testid (primary)
 *  • Compound XPath: //div[@data-testid='dashboard-card-orders']//span[@data-testid='order-count-active']
 *  • ancestor:        //span[@data-testid='customer-total']/ancestor::div[contains(@class,'dashboard-card')]
 *  • contains():      //div[contains(@class,'dashboard-card') and contains(@class,'dashboard-card-alert')]
 *  • following-sibling: //span[@class='customer-type-label'][text()='SMB']/following-sibling::span
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class DashboardLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dashboard container
  // ══════════════════════════════════════════════════════════════════════════

  get dashboard() { return this.page.getByTestId('dashboard'); }

  get dashboardSubtitle() {
    return this.page.locator('xpath=//p[contains(@class,"dashboard-subtitle")]');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Customers card
  // ══════════════════════════════════════════════════════════════════════════

  get customersCard()  { return this.page.getByTestId('dashboard-card-customers'); }
  get customerTotal()  { return this.page.getByTestId('customer-total'); }

  /** Customer count by type (Consumer | SMB | Enterprise) */
  customerCountByType(type) {
    return this.page.getByTestId(`customer-count-${type.toLowerCase()}`);
  }

  /**
   * Customer type row by type name — compound XPath inside the customers card.
   */
  customerTypeRow(type) {
    return this.page.locator(
      `xpath=//div[@data-testid="dashboard-card-customers"]//div[@data-customer-type="${type}"]`
    );
  }

  /**
   * Count label NEXT TO a customer type label — following-sibling XPath.
   */
  customerCountViaLabel(type) {
    return this.page.locator(
      `xpath=//div[@data-testid="dashboard-card-customers"]` +
      `//span[@class="customer-type-label" and normalize-space(text())="${type}"]` +
      `/following-sibling::span[contains(@class,"customer-type-count")]`
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Orders card
  // ══════════════════════════════════════════════════════════════════════════

  get ordersCard()  { return this.page.getByTestId('dashboard-card-orders'); }
  get orderTotal()  { return this.page.getByTestId('order-total'); }

  /** Order count by status (active | completed | cancelled) */
  orderCountByStatus(status) {
    return this.page.getByTestId(`order-count-${status.toLowerCase()}`);
  }

  /**
   * Order count via compound XPath inside the orders card.
   */
  orderCountViaCard(status) {
    return this.page.locator(
      `xpath=//div[@data-testid="dashboard-card-orders"]//span[@data-testid="order-count-${status.toLowerCase()}"]`
    );
  }

  /**
   * Status badge inside the orders card row — contains() pattern.
   */
  orderStatusBadgeInCard(status) {
    return this.page.locator(
      `xpath=//div[@data-testid="dashboard-card-orders"]` +
      `//span[contains(@class,"status-badge") and contains(@class,"status-${status.toLowerCase()}")]`
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Revenue card
  // ══════════════════════════════════════════════════════════════════════════

  get revenueCard()    { return this.page.getByTestId('dashboard-card-revenue'); }
  get totalRevenue()   { return this.page.getByTestId('total-revenue'); }

  /**
   * Revenue amount via ancestor from card header.
   */
  get revenueAmountViaAncestor() {
    return this.page.locator(
      'xpath=//span[@data-testid="total-revenue"]/ancestor::div[contains(@class,"dashboard-card")]'
      + '//div[contains(@class,"revenue-amount")]'
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Low Stock Alerts card
  // ══════════════════════════════════════════════════════════════════════════

  get lowStockCard()  { return this.page.getByTestId('dashboard-card-lowstock'); }
  get lowStockCount() { return this.page.getByTestId('low-stock-count'); }

  /**
   * Alert card with danger styling — contains() on class.
   */
  get alertCard() {
    return this.page.locator(
      'xpath=//div[contains(@class,"dashboard-card") and contains(@class,"dashboard-card-alert")]'
    );
  }

  /** All low-stock product rows */
  get lowStockRows() { return this.page.getByTestId('low-stock-row'); }

  lowStockName(id) { return this.page.getByTestId(`low-stock-name-${id}`); }
  lowStockQty(id)  { return this.page.getByTestId(`low-stock-qty-${id}`); }

  /**
   * Low stock row for a specific product — compound XPath.
   */
  lowStockRow(productId) {
    return this.page.locator(
      `xpath=//div[@data-testid="dashboard-card-lowstock"]` +
      `//div[@data-testid="low-stock-row" and @data-product-id="${productId}"]`
    );
  }

  /**
   * "All products well stocked" message — shown when low-stock list is empty.
   */
  get noLowStockMessage() {
    return this.page.locator(
      'xpath=//div[@data-testid="dashboard-card-lowstock"]//p[contains(@class,"no-data")]'
    );
  }
}
