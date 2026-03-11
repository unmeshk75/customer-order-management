/**
 * DashboardPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for the Dashboard view.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BasePage } from './BasePage.js';
import { DashboardLocators } from '../locators/DashboardLocators.js';

export class DashboardPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.loc = new DashboardLocators(page);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ══════════════════════════════════════════════════════════════════════════

  /** Click 'Dashboard' nav and wait for dashboard to render. */
  async navigateTo() {
    await this.page.getByTestId('nav-dashboard').click();
    await this.waitForVisible(this.loc.dashboard);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Read helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** Get total customer count displayed in the Customers card. */
  async getTotalCustomers() {
    return this.getIntText(this.loc.customerTotal);
  }

  /** Get customer count by type (Consumer | SMB | Enterprise). */
  async getCustomerCountByType(type) {
    return this.getIntText(this.loc.customerCountByType(type));
  }

  /** Get total order count displayed in the Orders card. */
  async getTotalOrders() {
    return this.getIntText(this.loc.orderTotal);
  }

  /** Get order count by status (Active | Completed | Cancelled). */
  async getOrderCountByStatus(status) {
    return this.getIntText(this.loc.orderCountByStatus(status));
  }

  /** Get the total revenue displayed in the Revenue card. */
  async getTotalRevenue() {
    return this.getNumericText(this.loc.totalRevenue);
  }

  /** Get the count of low-stock products shown in the alert card. */
  async getLowStockCount() {
    return this.getIntText(this.loc.lowStockCount);
  }

  /** Check whether the low-stock alert card has the alert styling. */
  async isLowStockAlertVisible() {
    return this.isVisible(this.loc.alertCard);
  }

  /** Get all dashboard counts as a snapshot object. */
  async getSnapshot() {
    return {
      totalCustomers:      await this.getTotalCustomers(),
      consumers:           await this.getCustomerCountByType('Consumer'),
      smb:                 await this.getCustomerCountByType('SMB'),
      enterprise:          await this.getCustomerCountByType('Enterprise'),
      totalOrders:         await this.getTotalOrders(),
      activeOrders:        await this.getOrderCountByStatus('Active'),
      completedOrders:     await this.getOrderCountByStatus('Completed'),
      cancelledOrders:     await this.getOrderCountByStatus('Cancelled'),
      totalRevenue:        await this.getTotalRevenue(),
      lowStockCount:       await this.getLowStockCount(),
    };
  }

  /**
   * Reload the dashboard by re-clicking the Dashboard nav button.
   * The Dashboard component re-fetches data on mount.
   */
  async reload() {
    await this.navigateTo();
  }
}
