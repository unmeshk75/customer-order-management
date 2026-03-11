/**
 * ProductPage.js
 */
import { BasePage } from './BasePage.js';
import { ProductLocators } from '../locators/ProductLocators.js';
import { NavigationLocators } from '../locators/NavigationLocators.js';

export class ProductPage extends BasePage {
  constructor(page) {
    super(page);
    this.navLoc = new NavigationLocators(page);
    this.loc = new ProductLocators(page);
  }

  async navigateToProducts() {
    await this.goto();
    await this.waitForVisible(this.navLoc.productsBtn);
    await this.navLoc.productsBtn.click();
    await this.waitForVisible(this.loc.productListContainer);
  }

  async openCreateForm() {
    await this.waitForEnabled(this.loc.createProductBtn);
    await this.loc.createProductBtn.click();
    await this.waitForVisible(this.loc.productForm);
  }

  async fillProductForm(data) {
    if (data.name !== undefined) await this.clearAndFill(this.loc.nameInput, data.name);
    if (data.type !== undefined) await this.loc.typeSelect.selectOption(data.type);
    if (data.description !== undefined) await this.clearAndFill(this.loc.descriptionInput, data.description);
    if (data.price !== undefined) await this.clearAndFill(this.loc.priceInput, data.price.toString());
    if (data.stock !== undefined) await this.clearAndFill(this.loc.stockInput, data.stock.toString());
  }

  async submitForm() {
    await this.waitForEnabled(this.loc.submitBtn);
    await this.loc.submitBtn.click();
    await this.waitForHidden(this.loc.productForm);
    // Explicit wait: list must re-render
    await this.waitForVisible(this.loc.productListContainer);
  }
  
  async createProduct(data) {
    await this.openCreateForm();
    await this.fillProductForm(data);
    await this.submitForm();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Granular field-fill helpers
  // ──────────────────────────────────────────────────────────────────────────

  async fillName(name)          { await this.clearAndFill(this.loc.nameInput, name); }
  async selectType(type)        { await this.selectByValue(this.loc.typeSelect, type); }
  async fillDescription(desc)   { await this.clearAndFill(this.loc.descriptionInput, desc); }
  async fillPrice(price)        { await this.clearAndFill(this.loc.priceInput, String(price)); }
  async fillStock(stock)        { await this.clearAndFill(this.loc.stockInput, String(stock)); }

  // ──────────────────────────────────────────────────────────────────────────
  // Filter helpers
  // ──────────────────────────────────────────────────────────────────────────

  /** Select a type in the filter bar and wait for the table to update. */
  async filterByType(type) {
    await this.selectByValue(this.loc.typeFilter, type);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Edit / delete helpers
  // ──────────────────────────────────────────────────────────────────────────

  async openEditForm(id) {
    await this.clickWhenReady(this.loc.editProductBtn(id));
    await this.waitForVisible(this.loc.productForm);
  }

  /** Delete a product via modal confirmation. */
  async deleteProduct(id) {
    const row = this.loc.productRow(id);
    await this.waitForVisible(row);
    await this.clickWhenReady(this.loc.deleteProductBtn(id));
    await this.waitForVisible(
      this.page.locator('xpath=//div[contains(@class,"modal-overlay") and contains(@class,"modal-open")]')
    );
    await this.clickWhenReady(this.page.getByTestId('modal-confirm'));
    await this.waitForDetached(row);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Form state helpers
  // ──────────────────────────────────────────────────────────────────────────

  async getFormError() { return this.getText(this.loc.formError); }

  /** Click submit but do NOT wait for form to close — used for error tests. */
  async submitFormExpectError() {
    await this.waitForEnabled(this.loc.submitBtn);
    await this.loc.submitBtn.click();
    await this.waitForVisible(this.loc.formError);
  }

  async cancelForm() {
    await this.loc.cancelBtn.click();
    await this.waitForHidden(this.loc.productForm);
    await this.waitForVisible(this.loc.productListContainer);
  }

  async getRowCount() { return this.loc.productTableRows.count(); }
}


