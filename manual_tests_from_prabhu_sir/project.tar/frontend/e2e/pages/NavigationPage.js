/**
 * NavigationPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for the top navigation bar.
 * Handles switching between Dashboard, Customers, Products, Orders.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BasePage } from './BasePage.js';
import { NavigationLocators } from '../locators/NavigationLocators.js';

export class NavigationPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.loc = new NavigationLocators(page);
  }

  /** Navigate to the app and wait for the nav bar to be visible. */
  async goto() {
    await super.goto();
    await this.waitForVisible(this.loc.navBar);
  }

  /** Click the Dashboard nav button and wait for the dashboard widget. */
  async goToDashboard() {
    await this.clickWhenReady(this.loc.dashboardBtn);
    await this.waitForVisible(this.page.getByTestId('dashboard'));
  }

  /** Click the Customers nav button and wait for the customer list. */
  async goToCustomers() {
    await this.clickWhenReady(this.loc.customersBtn);
    await this.waitForVisible(this.page.getByTestId('customer-list'));
  }

  /** Click the Products nav button and wait for the product list. */
  async goToProducts() {
    await this.clickWhenReady(this.loc.productsBtn);
    await this.waitForVisible(this.page.getByTestId('product-list'));
  }

  /** Click the Orders nav button and wait for the order list. */
  async goToOrders() {
    await this.clickWhenReady(this.loc.ordersBtn);
    await this.waitForVisible(this.page.getByTestId('order-list'));
  }

  /** Return the visible text of the currently active nav button. */
  async getActiveNavLabel() {
    return this.getText(this.loc.activeNavBtn);
  }
}
