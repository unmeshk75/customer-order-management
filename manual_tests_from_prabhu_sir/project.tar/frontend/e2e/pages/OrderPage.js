/**
 * OrderPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for Order List + multi-step Order Form (wizard).
 *
 * Wizard flow (Create):
 *   Step 1 → Customer & Settings  (next requires customer selected)
 *   Step 2 → Products             (next requires ≥1 product selected)
 *   Step 3 → Review & Confirm     (submit button)
 *
 * Wizard flow (Edit):
 *   Step 1 → Settings only        (customer is readonly)
 *   Step 2 → Review & Confirm
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { OrderLocators } from '../locators/OrderLocators.js';
import { ModalLocators } from '../locators/ModalLocators.js';

export class OrderPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.loc   = new OrderLocators(page);
    this.modal = new ModalLocators(page);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ══════════════════════════════════════════════════════════════════════════

  /** Click 'Orders' nav and wait for order list. */
  async navigateTo() {
    await this.page.getByTestId('nav-orders').click();
    await this.waitForVisible(this.loc.orderListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Open / close the form
  // ══════════════════════════════════════════════════════════════════════════

  /** Click 'Create Order' and wait for the wizard (Step 1 active). */
  async openCreateForm() {
    await this.clickWhenReady(this.loc.createOrderBtn);
    await this.waitForVisible(this.loc.activeWizardPanel(1));
  }

  /** Click 'Edit' on an order and wait for wizard step 1. */
  async openEditForm(id) {
    await this.clickWhenReady(this.loc.editOrderBtn(id));
    await this.waitForVisible(this.loc.activeWizardPanel(1));
  }

  /** Click 'Cancel' and wait for the order list. */
  async cancelForm() {
    await this.clickWhenReady(this.loc.cancelBtn);
    await this.waitForVisible(this.loc.orderListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Wizard Step 1: Customer & Settings
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Select a customer by their visible name text in the dropdown.
   * Waits for the customer select to be enabled.
   */
  async selectCustomerByName(nameText) {
    await this.waitForEnabled(this.loc.customerSelect);
    // Find the option whose text contains the name
    await this.loc.customerSelect.selectOption({ label: nameText });
  }

  /**
   * Select a customer by the option value (customer id).
   */
  async selectCustomerById(id) {
    await this.waitForEnabled(this.loc.customerSelect);
    await this.loc.customerSelect.selectOption({ value: String(id) });
  }

  /** Select order priority. */
  async selectPriority(priority) {
    await this.selectByValue(this.loc.prioritySelect, priority);
  }

  /** Set discount percentage (0–100). */
  async setDiscount(pct) {
    await this.clearAndFill(this.loc.discountInput, String(pct));
  }

  /** Fill notes. */
  async fillNotes(notes) {
    await this.clearAndFill(this.loc.notesInput, notes);
  }

  /** Set order status (Edit mode only). */
  async selectStatus(status) {
    await this.selectByValue(this.loc.statusSelect, status);
  }

  /**
   * Click 'Next' to advance to Step 2.
   * Waits for Step 2 panel to become active.
   */
  async goToStep2() {
    await this.clickWhenReady(this.loc.wizardNext);
    await this.waitForVisible(this.loc.activeWizardPanel(2));
  }

  /**
   * Click 'Next' to advance to the Review step (Step 3 for create, Step 2 for edit).
   */
  async goToReviewStep(isEdit = false) {
    const reviewStep = isEdit ? 2 : 3;
    await this.clickWhenReady(this.loc.wizardNext);
    await this.waitForVisible(this.loc.activeWizardPanel(reviewStep));
  }

  /** Click 'Back' in the wizard. */
  async goBack() {
    await this.clickWhenReady(this.loc.wizardBack);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Wizard Step 2: Products
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Select a product by its option label text in a product row.
   * @param {number} rowIndex - 0-based index of the product row
   * @param {string} productLabel - visible text of the option
   */
  async selectProduct(rowIndex, productLabel) {
    await this.waitForEnabled(this.loc.orderProductSelect(rowIndex));
    await this.loc.orderProductSelect(rowIndex).selectOption({ label: productLabel });
  }

  /**
   * Set the number of seats for a product row.
   */
  async setSeats(rowIndex, seats) {
    await this.clearAndFill(this.loc.orderSeatsInput(rowIndex), String(seats));
  }

  /** Click 'Add Another Product' button. */
  async addProductRow() {
    const currentCount = await this.loc.productRow(0).count();
    await this.clickWhenReady(this.loc.addProductBtn);
    // Wait for a new row to appear
    await expect(async () => {
      const rows = await this.page.locator('[data-testid^="product-row-"]').count();
      expect(rows).toBeGreaterThan(currentCount);
    }).toPass();
  }

  /** Remove a product row by index. */
  async removeProductRow(rowIndex) {
    await this.clickWhenReady(this.page.getByTestId(`remove-product-${rowIndex}`));
  }

  /**
   * Get all option values/labels currently available in a product select.
   * Used to verify which products are accessible to a given customer type.
   * @param {number} rowIndex
   * @returns {Promise<string[]>} array of option texts (excluding the placeholder)
   */
  async getAvailableProductOptions(rowIndex) {
    await this.waitForVisible(this.loc.orderProductSelect(rowIndex));
    const options = await this.loc.orderProductSelect(rowIndex).locator('option').all();
    const texts = [];
    for (const opt of options) {
      const text = (await opt.textContent()).trim();
      if (text && text !== 'Select Product') texts.push(text);
    }
    return texts;
  }

  /**
   * Get the raw available-products info text shown above the product rows.
   * e.g. "Available products for Consumer customers: Basic, Professional"
   */
  async getAvailableProductsInfoText() {
    return this.getText(this.loc.availableProductsInfo);
  }

  /**
   * Read the stock indicator text for a product row.
   * @param {number} rowIndex
   */
  async getStockIndicatorText(rowIndex) {
    return this.getText(this.loc.stockIndicator(rowIndex));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Submit
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Click 'Create Order' / 'Update Order' on the final review step.
   * Waits for the order list to reappear.
   */
  async submitOrder() {
    await this.clickWhenReady(this.loc.wizardSubmit);
    await this.waitForVisible(this.loc.orderListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Full order creation helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create a single-product order end-to-end.
   * @param {{ customerName: string, productLabel: string, seats?: number, priority?: string, discount?: number, notes?: string }} opts
   */
  async createOrder({ customerName, productLabel, seats = 1, priority = 'Medium', discount = 0, notes = '' }) {
    await this.openCreateForm();

    // Step 1
    await this.selectCustomerByName(customerName);
    await this.selectPriority(priority);
    if (discount > 0) await this.setDiscount(discount);
    if (notes) await this.fillNotes(notes);
    await this.goToStep2();

    // Step 2
    await this.selectProduct(0, productLabel);
    await this.setSeats(0, seats);
    await this.goToReviewStep(false);

    // Step 3 — Review & Submit
    await this.submitOrder();
  }

  /**
   * Create a multi-product order end-to-end.
   * @param {{ customerName: string, products: Array<{label: string, seats: number}>, priority?: string, discount?: number }} opts
   */
  async createMultiProductOrder({ customerName, products, priority = 'Medium', discount = 0 }) {
    await this.openCreateForm();

    // Step 1
    await this.selectCustomerByName(customerName);
    await this.selectPriority(priority);
    if (discount > 0) await this.setDiscount(discount);
    await this.goToStep2();

    // Step 2 — fill each product row
    for (let i = 0; i < products.length; i++) {
      if (i > 0) await this.addProductRow();
      await this.selectProduct(i, products[i].label);
      await this.setSeats(i, products[i].seats);
    }
    await this.goToReviewStep(false);

    // Step 3
    await this.submitOrder();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Delete
  // ══════════════════════════════════════════════════════════════════════════

  /** Delete an order: Delete → modal confirm → list reload. */
  async deleteOrder(id) {
    await this.clickWhenReady(this.loc.deleteOrderBtn(id));
    await this.waitForVisible(this.modal.openOverlay);
    await this.clickWhenReady(this.modal.confirmBtn);
    await this.waitForHidden(this.modal.overlay);
    await this.waitForVisible(this.loc.orderListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Filters
  // ══════════════════════════════════════════════════════════════════════════

  /** Open the filter sidebar. */
  async openFilters() {
    await this.clickWhenReady(this.loc.openFiltersBtn);
    await this.waitForVisible(this.loc.filterSidebar);
  }

  /** Close the filter sidebar. */
  async closeFilters() {
    await this.clickWhenReady(this.loc.sidebarClose);
  }

  /**
   * Toggle a filter checkbox.
   * @param {'status'|'priority'|'customer_type'} group
   * @param {string} value
   */
  async toggleFilter(group, value) {
    await this.clickWhenReady(this.loc.filterCheckbox(group, value));
  }

  /** Remove an active filter chip. */
  async removeFilterChip(group, value) {
    await this.clickWhenReady(this.loc.removeChipBtn(group, value));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Expand / collapse rows
  // ══════════════════════════════════════════════════════════════════════════

  async expandRow(id) {
    await this.clickWhenReady(this.loc.expandRowBtn(id));
    await this.waitForVisible(this.loc.detailRow(id));
  }

  async collapseRow(id) {
    await this.clickWhenReady(this.loc.expandRowBtn(id));
    await this.waitForHidden(this.loc.detailRow(id));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Edit order — change status
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Edit an order and change its status, then submit.
   * @param {number} id
   * @param {'Active'|'Completed'|'Cancelled'} newStatus
   */
  async editOrderStatus(id, newStatus) {
    await this.openEditForm(id);
    await this.selectStatus(newStatus);
    await this.goToReviewStep(true);
    await this.submitOrder();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Read helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** Get the count of order rows currently visible. */
  async getRowCount() {
    return this.loc.orderTableRows.count();
  }

  /** Read the status text from an order row. */
  async getOrderStatus(id) {
    return this.getText(this.loc.orderStatus(id));
  }

  /** Read the final discounted total from an order row. */
  async getOrderDiscountedTotal(id) {
    return this.getNumericText(this.loc.orderDiscountedTotal(id));
  }

  /** Check whether the 'Next' button is disabled. */
  async isNextDisabled() {
    return this.isDisabled(this.loc.wizardNext);
  }

  /** Read the order total in the wizard summary. */
  async getWizardTotal() {
    return this.getNumericText(this.loc.orderTotal);
  }

  /** Get all product option texts in product row 0. */
  async getProductOptions() {
    return this.getAvailableProductOptions(0);
  }
}
