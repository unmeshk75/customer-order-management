/**
 * ProductPage.js
 */
import { BasePage } from './BasePage.js';
import { ProductLocators, NavigationLocators } from '../locators.js';

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
}


