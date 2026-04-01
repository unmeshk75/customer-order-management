import { BasePage } from './BasePage.js';
import { OrderLocators } from '../locators/OrderLocators.js';
import { NavigationLocators } from '../locators/NavigationLocators.js';
import { ModalLocators } from '../locators/ModalLocators.js';

export class OrderPage extends BasePage {
  constructor(page) {
    super(page);
    this.navLoc = new NavigationLocators(page);
    this.loc = new OrderLocators(page);
    this.modal = new ModalLocators(page);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  async navigateToOrders() {
    await this.goto();
    await this.waitForVisible(this.navLoc.ordersBtn);
    await this.navLoc.ordersBtn.click();
    await this.waitForVisible(this.loc.orderList);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Form Actions
  // ──────────────────────────────────────────────────────────────────────────

  async openCreateForm() {
    await this.waitForEnabled(this.loc.createOrderBtn);
    await this.loc.createOrderBtn.click();
    await this.waitForVisible(this.loc.orderWizard);
  }

  async openEditForm(id) {
    const editBtn = this.loc.editOrderBtn(id);
    await this.waitForVisible(editBtn);
    await editBtn.click();
    await this.waitForVisible(this.loc.orderWizard);
  }

  async openEditFormForFirst() {
    await this.waitForVisible(this.loc.firstOrderEditBtn);
    await this.loc.firstOrderEditBtn.click();
    await this.waitForVisible(this.loc.orderWizard);
  }

  /**
   * Fill order form fields.
   * Each field is only filled if data.field !== undefined.
   *
   * @param {Object} data
   */
  async fillOrderForm(data) {
    if (data.customer !== undefined) {
      const selectVisible = await this.isVisible(this.loc.orderCustomerSelect);
      if (selectVisible) {
        await this.selectByText(this.loc.orderCustomerSelect, data.customer);
      }
    }
    if (data.status !== undefined) {
      await this.selectByText(this.loc.orderStatusSelect, data.status);
    }
    if (data.priority !== undefined) {
      await this.selectByText(this.loc.orderPrioritySelect, data.priority);
    }
    if (data.discount !== undefined) {
      await this.clearAndFill(this.loc.orderDiscountInput, data.discount);
    }
    if (data.notes !== undefined) {
      await this.clearAndFill(this.loc.orderNotesInput, data.notes);
    }
  }

  async submitForm() {
    await this.waitForEnabled(this.loc.submitOrderBtn);
    await this.loc.submitOrderBtn.click();
    await this.waitForHidden(this.loc.orderWizard);
    await this.waitForVisible(this.loc.orderList);
  }

  async cancelForm() {
    await this.loc.cancelOrderBtn.click();
    await this.waitForHidden(this.loc.orderWizard);
  }

  async submitFormExpectError() {
    await this.waitForEnabled(this.loc.submitOrderBtn);
    await this.loc.submitOrderBtn.click();
    await this.waitForVisible(this.loc.orderFormError);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CRUD helpers
  // ──────────────────────────────────────────────────────────────────────────

  async createOrder(data) {
    await this.openCreateForm();
    await this.fillOrderForm(data);
    await this.submitForm();
  }

  /**
   * Delete an order by ID.
   * Waits for modal, confirms, then waits for row to detach from DOM.
   * @param {number|string} id
   */
  async deleteOrder(id) {
    const deleteBtn = this.loc.deleteOrderBtn(id);
    await this.waitForVisible(deleteBtn);
    await deleteBtn.click();
    await this.waitForVisible(this.modal.overlay);
    await this.clickWhenReady(this.modal.confirmBtn);
    const row = this.loc.orderId(id);
    await this.waitForDetached(row);
  }

  /** Delete the first order in the list. */
  async deleteFirstOrder() {
    await this.waitForVisible(this.loc.firstOrderDeleteBtn);
    await this.loc.firstOrderDeleteBtn.click();
    await this.waitForVisible(this.modal.overlay);
    await this.clickWhenReady(this.modal.confirmBtn);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Query helpers
  // ──────────────────────────────────────────────────────────────────────────

  async getRowCount() {
    return await this.loc.allOrderRows.count();
  }

  async isFormErrorVisible() {
    return await this.isVisible(this.loc.orderFormError);
  }

  async getFormErrorText() {
    return await this.getText(this.loc.orderFormError);
  }

  async getOrderTotal() {
    return await this.getNumericText(this.loc.orderTotal);
  }

  async getOrderTotalById(id) {
    return await this.getNumericText(this.loc.orderTotalById(id));
  }

  async getOrderCount(status) {
    return await this.getIntText(this.loc.orderCount(status));
  }

  async getOrderSubtotal() {
    return await this.getNumericText(this.loc.orderSubtotal);
  }

  async getOrderDiscountAmount() {
    return await this.getNumericText(this.loc.orderDiscountAmount);
  }

  async getOrderTotalSummary() {
    return await this.getNumericText(this.loc.orderTotalSummary);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Granular field-fill helpers
  // ──────────────────────────────────────────────────────────────────────────

  async fillCustomer(customer) {
    const selectVisible = await this.isVisible(this.loc.orderCustomerSelect);
    if (selectVisible) {
      await this.selectByText(this.loc.orderCustomerSelect, customer);
    }
  }

  async fillStatus(status) {
    await this.selectByText(this.loc.orderStatusSelect, status);
  }

  async fillPriority(priority) {
    await this.selectByText(this.loc.orderPrioritySelect, priority);
  }

  async fillDiscount(discount) {
    await this.clearAndFill(this.loc.orderDiscountInput, discount);
  }

  async fillNotes(notes) {
    await this.clearAndFill(this.loc.orderNotesInput, notes);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Row data helpers
  // ──────────────────────────────────────────────────────────────────────────

  async getOrderStatusById(id) {
    return await this.getText(this.loc.orderStatusById(id));
  }

  async getOrderPriorityById(id) {
    return await this.getText(this.loc.orderPriorityById(id));
  }

  async getOrderCustomerById(id) {
    return await this.getText(this.loc.orderCustomerById(id));
  }

  async getOrderDiscountById(id) {
    return await this.getNumericText(this.loc.orderDiscountById(id));
  }

  async getOrderDiscountedTotal(id) {
    return await this.getNumericText(this.loc.orderDiscountedTotal(id));
  }

  async getOrderDateById(id) {
    return await this.getText(this.loc.orderDate(id));
  }

  async isOrderRowVisible(id) {
    return await this.isVisible(this.loc.orderId(id));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Dashboard helpers
  // ──────────────────────────────────────────────────────────────────────────

  async waitForDashboardVisible() {
    await this.waitForVisible(this.loc.orderTotal);
    await this.waitForVisible(this.loc.orderStatusRow);
  }
}
