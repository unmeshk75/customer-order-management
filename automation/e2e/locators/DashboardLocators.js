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

  get customersCard() { return this.page.getByTestId('dashboard-card-customers'); }
  get customerTotal() { return this.page.getByTestId('customer-total'); }

  /**
   * Customer count badge by type (Consumer | SMB | Enterprise).
   * @param {'Consumer'|'SMB'|'Enterprise'} type
   */
  customerCountByType(type) {
    return this.page.getByTestId(`customer-count-${type.toLowerCase()}`);
  }

  /**
   * Customer type row by data-customer-type attribute — compound XPath.
   * @param {'Consumer'|'SMB'|'Enterprise'} type
   */
  customerTypeRow(type) {
    return this.page.locator(
      `xpath=//div[@data-testid="dashboard-card-customers"]//div[@data-customer-type="${type}"]`
    );
  }

  /**
   * Count span NEXT TO a type label — following-sibling XPath.
   * @param {'Consumer'|'SMB'|'Enterprise'} type
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

  get ordersCard() { return this.page.getByTestId('dashboard-card-orders'); }
  get orderTotal() { return this.page.getByTestId('order-total'); }

  /**
   * Order count by status (Active | Completed | Cancelled).
   * @param {'Active'|'Completed'|'Cancelled'} status
   */
  orderCountByStatus(status) {
    return this.page.getByTestId(`order-count-${status.toLowerCase()}`);
  }

  /**
   * Order count via compound XPath scoped to the orders card.
   */
  orderCountViaCard(status) {
    return this.page.locator(
      `xpath=//div[@data-testid="dashboard-card-orders"]//span[@data-testid="order-count-${status.toLowerCase()}"]`
    );
  }

  /**
   * Order status row by data-order-status attribute — compound XPath.
   * @param {'Active'|'Completed'|'Cancelled'} status
   */
  orderStatusRow(status) {
    return this.page.locator(
      `xpath=//div[@data-testid="dashboard-card-orders"]//div[@data-order-status="${status}"]`
    );
  }

  /**
   * Status badge inside the orders card — contains() on class.
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

  get revenueCard()  { return this.page.getByTestId('dashboard-card-revenue'); }
  get totalRevenue() { return this.page.getByTestId('total-revenue'); }

  /**
   * Revenue amount resolved via ancestor from the revenue card.
   * XPath ancestor pattern.
   */
  get revenueAmountViaAncestor() {
    return this.page.locator(
      'xpath=//span[@data-testid="total-revenue"]/ancestor::div[contains(@class,"dashboard-card")]' +
      '//div[contains(@class,"revenue-amount")]'
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
   * Low stock row for a specific product — compound XPath scoped to the card.
   */
  lowStockRow(productId) {
    return this.page.locator(
      `xpath=//div[@data-testid="dashboard-card-lowstock"]` +
      `//div[@data-testid="low-stock-row" and @data-product-id="${productId}"]`
    );
  }

  /**
   * "All products are well stocked" message — shown when low-stock list is empty.
   */
  get noLowStockMessage() {
    return this.page.locator(
      'xpath=//div[@data-testid="dashboard-card-lowstock"]//p[contains(@class,"no-data")]'
    );
  }
}
