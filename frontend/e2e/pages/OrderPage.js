/**
 * OrderPage.js
 */
import { BasePage } from './BasePage.js';
import { OrderLocators, NavigationLocators } from '../locators.js';

export class OrderPage extends BasePage {
  constructor(page) {
    super(page);
    this.navLoc = new NavigationLocators(page);
    this.loc = new OrderLocators(page);
  }

  async navigateToOrders() {
    await this.goto();
    await this.waitForVisible(this.navLoc.ordersBtn);
    await this.navLoc.ordersBtn.click();
    await this.waitForVisible(this.loc.orderListContainer);
  }

  async openCreateForm() {
    await this.waitForEnabled(this.loc.createOrderBtn);
    await this.loc.createOrderBtn.click();
    await this.waitForVisible(this.loc.orderForm);
  }

  async selectCustomer(customerLabel) {
    await this.loc.customerSelect.selectOption({ label: customerLabel });
    // Dynamic wait: Products section appears
    await this.waitForAttached(this.loc.productsSection);
    await this.waitForVisible(this.loc.productsSection);
  }

}

