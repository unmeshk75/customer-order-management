/**
 * ProductPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for the Product module.
 *
 * ❌ REMOVED  : waitForLoadState('networkidle'), hardcoded delays
 * ✅ REPLACED :
 *   • After delete   → waitForDetached(rowLocator)
 *   • Form submit    → waitForHidden(form) + waitForVisible(list)
 *   • Modal confirm  → waitForVisible(modal) before clicking confirm
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BasePage } from './BasePage.js';
import { ProductLocators } from '../locators/ProductLocators.js';
import { NavigationLocators } from '../locators/NavigationLocators.js';
import { ModalLocators } from '../locators/ModalLocators.js';

export class ProductPage extends BasePage {
  constructor(page) {
    super(page);
    this.navLoc = new NavigationLocators(page);
    this.loc = new ProductLocators(page);
    this.modal = new ModalLocators(page);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  async navigateToProducts() {
    await this.goto();
    // Explicit wait: nav button must be visible before clicking
    await this.waitForVisible(this.navLoc.productsBtn);
    await this.navLoc.productsBtn.click();
    // Explicit wait: product list container must appear after navigation
    await this.waitForVisible(this.loc.productList);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Form Actions
  // ──────────────────────────────────────────────────────────────────────────

  async openCreateForm() {
    // Explicit wait: button must be enabled before clicking
    await this.waitForEnabled(this.loc.createProductBtn);
    await this.loc.createProductBtn.click();
    // Explicit wait: form must appear in DOM and be visible
    await this.waitForVisible(this.loc.productForm);
  }

  async openEditFormById(id) {
    const editBtn = this.loc.editProductBtn(id);
    // Explicit wait: specific edit button must be visible
    await this.waitForVisible(editBtn);
    await editBtn.click();
    // Explicit wait: form must appear
    await this.waitForVisible(this.loc.productForm);
  }

  async openEditFormForFirst() {
    await this.waitForVisible(this.loc.firstEditBtn);
    await this.loc.firstEditBtn.click();
    await this.waitForVisible(this.loc.productForm);
  }

  /**
   * Fill product form fields.
   * Only fills a field if the corresponding data property is !== undefined.
   *
   * @param {Object} data
   * @param {string} [data.name]
   * @param {string} [data.type]
   * @param {string} [data.description]
   * @param {string|number} [data.price]
   * @param {string|number} [data.stock]
   */
  async fillProductForm(data) {
    if (data.name        !== undefined) await this.clearAndFill(this.loc.productNameInput,        String(data.name));
    if (data.type        !== undefined) await this.loc.productTypeSelect.selectOption(data.type);
    if (data.description !== undefined) await this.clearAndFill(this.loc.productDescriptionInput, String(data.description));
    if (data.price       !== undefined) await this.clearAndFill(this.loc.productPriceInput,       String(data.price));
    if (data.stock       !== undefined) await this.clearAndFill(this.loc.productStockInput,       String(data.stock));
  }

  /**
   * Submit the product form.
   * ✅ Explicit wait: wait for the form to hide (submit succeeded),
   *    then wait for the list container to be visible again.
   */
  async submitForm() {
    await this.waitForEnabled(this.loc.submitProductBtn);
    await this.loc.submitProductBtn.click();
    // Explicit wait: form disappears on success
    await this.waitForHidden(this.loc.productForm);
    // Explicit wait: list must re-render
    await this.waitForVisible(this.loc.productList);
  }

  /**
   * Cancel the product form.
   * ✅ Explicit wait: form disappears, list re-appears.
   */
  async cancelForm() {
    await this.loc.cancelProductBtn.click();
    await this.waitForHidden(this.loc.productForm);
    await this.waitForVisible(this.loc.productList);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CRUD helpers
  // ──────────────────────────────────────────────────────────────────────────

  async createProduct(data) {
    await this.openCreateForm();
    await this.fillProductForm(data);
    await this.submitForm();
  }

  /**
   * Open the edit form for a product by ID.
   * Alias for openEditFormById — used by tests that call page.openEditForm(id).
   * @param {number|string} id
   */
  async openEditForm(id) {
    return this.openEditFormById(id);
  }

  /**
   * Delete a product by ID and wait for its row to disappear.
   * ✅ Explicit wait: modal must be visible before confirming,
   *    then row must detach from DOM — no networkidle needed.
   * @param {number|string} id
   */
  async deleteProduct(id) {
    const deleteBtn = this.loc.deleteProductBtn(id);
    const row = this.loc.productId(id);

    // Explicit wait: delete button must be visible
    await this.waitForVisible(deleteBtn);
    await deleteBtn.click();

    // Explicit wait: modal overlay must appear before we confirm
    await this.waitForVisible(this.modal.overlay);
    await this.clickWhenReady(this.modal.confirmBtn);

    // Explicit wait: row detaches from DOM when deletion is complete
    await this.waitForDetached(row);
  }

  /**
   * Delete a product using the scoped modal confirm button.
   * @param {number|string} id
   */
  async deleteProductWithScopedModal(id) {
    const deleteBtn = this.loc.deleteProductBtn(id);
    const row = this.loc.productId(id);

    await this.waitForVisible(deleteBtn);
    await deleteBtn.click();

    await this.waitForVisible(this.modal.openOverlay);
    await this.clickWhenReady(this.modal.confirmBtnInModal('confirm-delete-product'));

    await this.waitForDetached(row);
  }

  /** Delete the first product row visible in the table. */
  async deleteFirstProduct() {
    const firstRow = this.loc.firstProductRow;
    await this.waitForVisible(firstRow);
    await this.loc.firstDeleteBtn.click();
    await this.waitForVisible(this.modal.overlay);
    await this.clickWhenReady(this.modal.confirmBtn);
    await this.waitForDetached(firstRow);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Query helpers
  // ──────────────────────────────────────────────────────────────────────────

  async getRowCount() {
    return await this.loc.productRows.count();
  }

  async isFormErrorVisible() {
    return await this.isVisible(this.loc.productFormError);
  }

  async getFormErrorText() {
    return await this.getText(this.loc.productFormError);
  }

  async isListErrorVisible() {
    return await this.isVisible(this.loc.productListError);
  }

  async getListErrorText() {
    return await this.getText(this.loc.productListError);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Submit and expect error (negative / validation tests)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Click submit but do NOT wait for form to close — used for negative/error tests.
   * ✅ Explicit wait: form error must become visible after submit.
   */
  async submitFormExpectError() {
    await this.waitForEnabled(this.loc.submitProductBtn);
    await this.loc.submitProductBtn.click();
    // Explicit wait: form error becomes visible on validation failure
    await this.waitForVisible(this.loc.productFormError);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Granular field-fill helpers (used when filling one field at a time)
  // ──────────────────────────────────────────────────────────────────────────

  async fillName(name) {
    await this.clearAndFill(this.loc.productNameInput, String(name));
  }

  async fillType(type) {
    await this.waitForEnabled(this.loc.productTypeSelect);
    await this.loc.productTypeSelect.selectOption(type);
  }

  async fillDescription(description) {
    await this.clearAndFill(this.loc.productDescriptionInput, String(description));
  }

  async fillPrice(price) {
    await this.clearAndFill(this.loc.productPriceInput, String(price));
  }

  async fillStock(stock) {
    await this.clearAndFill(this.loc.productStockInput, String(stock));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Product field value readers (by product ID)
  // ──────────────────────────────────────────────────────────────────────────

  async getProductName(id) {
    return await this.getText(this.loc.productName(id));
  }

  async getProductType(id) {
    return await this.getText(this.loc.productType(id));
  }

  async getProductPrice(id) {
    return await this.getNumericText(this.loc.productPrice(id));
  }

  async getProductStock(id) {
    return await this.getIntText(this.loc.productStock(id));
  }

  async getProductDescription(id) {
    return await this.getText(this.loc.productDescription(id));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Filter helpers
  // ──────────────────────────────────────────────────────────────────────────

  async filterByType(type) {
    await this.waitForVisible(this.loc.productTypeFilter);
    await this.selectByValue(this.loc.productTypeFilter, type);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Form state helpers
  // ──────────────────────────────────────────────────────────────────────────

  async isFormVisible() {
    return await this.isVisible(this.loc.productForm);
  }

  async isProductListVisible() {
    return await this.isVisible(this.loc.productList);
  }

  async isProductTableVisible() {
    return await this.isVisible(this.loc.productsTable);
  }
}
