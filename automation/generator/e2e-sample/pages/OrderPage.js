/**
 * OrderPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for Order List + multi-step Order Form (wizard).
 *
 * Wizard flow (Create):
 *   Step 1 → Customer & Settings  (Next requires customer selected)
 *   Step 2 → Products             (Next requires ≥1 product selected)
 *   Step 3 → Review & Confirm     (Submit button)
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
import { NavigationLocators } from '../locators/NavigationLocators.js';

export class OrderPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.navLoc = new NavigationLocators(page);
    this.loc    = new OrderLocators(page);
    this.modal  = new ModalLocators(page);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ══════════════════════════════════════════════════════════════════════════

  async navigateToOrders() {
    await this.goto();
    await this.waitForVisible(this.navLoc.ordersBtn);
    await this.navLoc.ordersBtn.click();
    await this.waitForVisible(this.loc.orderListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Open / close the form
  // ══════════════════════════════════════════════════════════════════════════

  /** Click 'Create Order' and wait for wizard Step 1. */
  async openCreateForm() {
    await this.clickWhenReady(this.loc.createOrderBtn);
    await this.waitForVisible(this.loc.activeWizardPanel(1));
  }

  /** Click 'Edit' on an order row and wait for wizard Step 1. */
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

  /** Select a customer by visible label text in the dropdown. */
  async selectCustomerByName(nameText) {
    await this.waitForEnabled(this.loc.customerSelect);
    await this.loc.customerSelect.selectOption({ label: nameText });
  }

  /** Select a customer by option value (customer id). */
  async selectCustomerById(id) {
    await this.waitForEnabled(this.loc.customerSelect);
    await this.loc.customerSelect.selectOption({ value: String(id) });
  }

  /** Select a customer by label and immediately advance to Step 2. */
  async selectCustomer(customerLabel) {
    await this.loc.customerSelect.selectOption({ label: customerLabel });
    await this.waitForEnabled(this.loc.wizardNext);
    await this.loc.wizardNext.click();
    await this.waitForVisible(this.loc.productsSection);
  }

  async selectPriority(priority) {
    await this.selectByValue(this.loc.prioritySelect, priority);
  }

  async setDiscount(pct) {
    await this.clearAndFill(this.loc.discountInput, String(pct));
  }

  async fillNotes(notes) {
    await this.clearAndFill(this.loc.notesInput, notes);
  }

  async selectStatus(status) {
    await this.selectByValue(this.loc.statusSelect, status);
  }

  /**
   * Click 'Next' to advance to Step 2 — waits for products panel.
   */
  async goToStep2() {
    await this.clickWhenReady(this.loc.wizardNext);
    await this.waitForVisible(this.loc.activeWizardPanel(2));
  }

  /**
   * Click 'Next' to advance to the Review step.
   * @param {boolean} isEdit — edit wizard has 2 steps; create wizard has 3.
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

  /** Returns true if the Next button is currently disabled. */
  async isNextDisabled() {
    return this.isDisabled(this.loc.wizardNext);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Wizard Step 2: Products
  // ══════════════════════════════════════════════════════════════════════════

  /** Select a product by visible label text in a product row. */
  async selectProduct(rowIndex, productLabel) {
    await this.waitForEnabled(this.loc.orderProductSelect(rowIndex));
    await this.loc.orderProductSelect(rowIndex).selectOption({ label: productLabel });
  }

  /** Set the number of seats for a product row. */
  async setSeats(rowIndex, seats) {
    await this.clearAndFill(this.loc.orderSeatsInput(rowIndex), String(seats));
  }

  /** Click 'Add Another Product' and wait for the new row to appear. */
  async addProductRow() {
    const currentCount = await this.page.locator('[data-testid^="product-row-"]').count();
    await this.clickWhenReady(this.loc.addProductBtn);
    await expect(async () => {
      const rows = await this.page.locator('[data-testid^="product-row-"]').count();
      expect(rows).toBeGreaterThan(currentCount);
    }).toPass();
  }

  /**
   * Get all option texts currently available in a product select (excludes placeholder).
   * @param {number} rowIndex
   * @returns {Promise<string[]>}
   */
  async getAvailableProductOptions(rowIndex) {
    await this.waitForVisible(this.loc.orderProductSelect(rowIndex));
    const options = await this.loc.orderProductSelect(rowIndex).locator('option').all();
    const texts = [];
    for (const opt of options) {
      const text = (await opt.textContent()).trim();
      const value = await opt.getAttribute('value');
      if (value && text) texts.push(text);
    }
    return texts;
  }

  /**
   * Get the available-products info text shown above product rows.
   * e.g. "Available products for Consumer customers: Basic, Professional"
   */
  async getAvailableProductsInfoText() {
    return this.getText(this.loc.availableProductsInfo);
  }

  /** Get stock indicator text for a product row. */
  async getStockIndicatorText(rowIndex) {
    return this.getText(this.loc.stockIndicator(rowIndex));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Submit
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Submit the order from the review step.
   * Waits for the order list to reappear.
   */
  async submitOrder() {
    // Step 2 → Step 3 (Review) for create flow
    await this.waitForEnabled(this.loc.wizardNext);
    await this.loc.wizardNext.click();
    // Step 3 → Submit
    await this.waitForVisible(this.loc.wizardSubmit);
    await this.loc.wizardSubmit.click();
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
    await this.clickWhenReady(this.loc.wizardSubmit);
    await this.waitForVisible(this.loc.orderListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Delete
  // ══════════════════════════════════════════════════════════════════════════

  /** Delete an order: click Delete → modal confirm → list reload. */
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

  async openFilters() {
    await this.clickWhenReady(this.loc.openFiltersBtn);
    await this.waitForVisible(this.loc.filterSidebar);
  }

  async closeFilters() {
    await this.clickWhenReady(this.loc.sidebarClose);
  }

  async toggleFilter(group, value) {
    await this.clickWhenReady(this.loc.filterCheckbox(group, value));
  }

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
  // Edit helpers
  // ══════════════════════════════════════════════════════════════════════════

  async editOrderStatus(id, newStatus) {
    await this.openEditForm(id);
    await this.selectStatus(newStatus);
    await this.goToReviewStep(true);
    await this.clickWhenReady(this.loc.wizardSubmit);
    await this.waitForVisible(this.loc.orderListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Read helpers
  // ══════════════════════════════════════════════════════════════════════════

  async getRowCount()         { return this.loc.orderTableRows.count(); }
  async getOrderStatus(id)    { return this.getText(this.loc.orderStatus(id)); }
  async getOrderTotal(id)     { return this.getNumericText(this.loc.orderDiscountedTotal(id)); }
}
