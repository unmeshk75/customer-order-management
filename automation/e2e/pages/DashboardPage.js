/**
 * DashboardPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for the Dashboard view.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BasePage } from './BasePage.js';
import { DashboardLocators } from '../locators/DashboardLocators.js';
import { NavigationLocators } from '../locators/NavigationLocators.js';

export class DashboardPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.navLoc = new NavigationLocators(page);
    this.loc    = new DashboardLocators(page);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ══════════════════════════════════════════════════════════════════════════

  async navigateToDashboard() {
    await this.goto();
    await this.waitForVisible(this.navLoc.dashboardBtn);
    await this.navLoc.dashboardBtn.click();
    await this.waitForVisible(this.loc.dashboard);
  }

  /** Reload the page and wait for the dashboard to re-render. */
  async reload() {
    await this.page.reload({ waitUntil: 'load' });
    await this.waitForVisible(this.loc.dashboard);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Customer card
  // ══════════════════════════════════════════════════════════════════════════

  /** Returns total customer count as a number. */
  async getTotalCustomers() {
    return this.getIntText(this.loc.customerTotal);
  }

  /**
   * Returns customer count for a specific type as a number.
   * @param {'Consumer'|'SMB'|'Enterprise'} type
   */
  async getCustomerCountByType(type) {
    return this.getIntText(this.loc.customerCountByType(type));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Orders card
  // ══════════════════════════════════════════════════════════════════════════

  /** Returns total order count as a number. */
  async getTotalOrders() {
    return this.getIntText(this.loc.orderTotal);
  }

  /**
   * Returns order count for a specific status as a number.
   * @param {'Active'|'Completed'|'Cancelled'} status
   */
  async getOrderCountByStatus(status) {
    return this.getIntText(this.loc.orderCountByStatus(status));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Revenue card
  // ══════════════════════════════════════════════════════════════════════════

  /** Returns total revenue as a float. */
  async getTotalRevenue() {
    return this.getNumericText(this.loc.totalRevenue);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Low stock card
  // ══════════════════════════════════════════════════════════════════════════

  /** Returns the low-stock product count as a number. */
  async getLowStockCount() {
    return this.getIntText(this.loc.lowStockCount);
  }

  /** Returns true if the alert card (danger styling) is visible. */
  async isAlertCardVisible() {
    return this.isVisible(this.loc.alertCard);
  }
}
