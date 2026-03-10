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
    await this.waitForVisible(this.loc.orderWizard);
  }

  async selectCustomer(customerLabel) {
    await this.loc.customerSelect.selectOption({ label: customerLabel });
    // Customer selection enables Next; click it to advance to Step 2 (Products)
    await this.waitForEnabled(this.loc.nextBtn);
    await this.loc.nextBtn.click();
    await this.waitForVisible(this.loc.productsSection);
  }

  async submitOrder() {
    // Step 2 → Step 3 (Review)
    await this.waitForEnabled(this.loc.nextBtn);
    await this.loc.nextBtn.click();
    // Step 3 → Submit
    await this.waitForVisible(this.loc.submitBtn);
    await this.loc.submitBtn.click();
    await this.waitForHidden(this.loc.orderWizard);
  }

}

