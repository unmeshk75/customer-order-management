/**
 * ProductPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for Product List + Product Form interactions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BasePage } from './BasePage.js';
import { ProductLocators } from '../locators/ProductLocators.js';
import { ModalLocators } from '../locators/ModalLocators.js';

export class ProductPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.loc   = new ProductLocators(page);
    this.modal = new ModalLocators(page);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ══════════════════════════════════════════════════════════════════════════

  /** Click 'Products' nav and wait for product list. */
  async navigateTo() {
    await this.page.getByTestId('nav-products').click();
    await this.waitForVisible(this.loc.productListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Open / close the form
  // ══════════════════════════════════════════════════════════════════════════

  /** Click 'Create Product' and wait for the form. */
  async openCreateForm() {
    await this.clickWhenReady(this.loc.createProductBtn);
    await this.waitForVisible(this.loc.productForm);
  }

  /** Click 'Edit' on a product row and wait for the form. */
  async openEditForm(id) {
    await this.clickWhenReady(this.loc.editProductBtn(id));
    await this.waitForVisible(this.loc.productForm);
  }

  /** Click 'Cancel' and wait for the list to reappear. */
  async cancelForm() {
    await this.clickWhenReady(this.loc.cancelBtn);
    await this.waitForVisible(this.loc.productListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Form filling
  // ══════════════════════════════════════════════════════════════════════════

  async fillName(name)             { await this.clearAndFill(this.loc.nameInput, name); }
  async selectType(type)           { await this.selectByValue(this.loc.typeSelect, type); }
  async fillDescription(desc)      { await this.clearAndFill(this.loc.descriptionInput, desc); }
  async fillPrice(price)           { await this.clearAndFill(this.loc.priceInput, String(price)); }
  async fillStock(qty)             { await this.clearAndFill(this.loc.stockInput, String(qty)); }

  /**
   * Fill all fields to create/update a product.
   * @param {{ name, type, price, stock, description? }} data
   */
  async fillProductForm({ name, type, price, stock, description = '' }) {
    await this.fillName(name);
    await this.selectType(type);
    await this.fillPrice(price);
    await this.fillStock(stock);
    if (description) await this.fillDescription(description);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Submit
  // ══════════════════════════════════════════════════════════════════════════

  /** Submit and wait for the list to reappear. */
  async submitForm() {
    await this.clickWhenReady(this.loc.submitBtn);
    await this.waitForVisible(this.loc.productListContainer);
  }

  /** Submit expecting a client-side validation error. */
  async submitFormExpectError() {
    await this.clickWhenReady(this.loc.submitBtn);
    await this.waitForVisible(this.loc.formError);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Delete
  // ══════════════════════════════════════════════════════════════════════════

  /** Delete a product: click Delete → confirm modal → wait for list reload. */
  async deleteProduct(id) {
    await this.clickWhenReady(this.loc.deleteProductBtn(id));
    await this.waitForVisible(this.modal.openOverlay);
    await this.clickWhenReady(this.modal.confirmBtn);
    await this.waitForHidden(this.modal.overlay);
    await this.waitForVisible(this.loc.productListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Filter
  // ══════════════════════════════════════════════════════════════════════════

  /** Filter products by type. Pass '' to show all. */
  async filterByType(type) {
    await this.selectByValue(this.loc.typeFilter, type);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Read helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** Get the number of rows currently visible in the products table. */
  async getRowCount() {
    return this.loc.productTableRows.count();
  }

  /** Read the stock quantity for a product (integer). */
  async getStockQty(id) {
    return this.getIntText(this.loc.productStock(id));
  }

  /** Read the form error message. */
  async getFormError() {
    return this.getText(this.loc.formError);
  }

  /** Check whether the form error is visible. */
  async isFormErrorVisible() {
    return this.isVisible(this.loc.formError);
  }
}
