/**
 * ProductLocators.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All selectors for Product List and Product Form.
 *
 * XPath Strategies demonstrated:
 *  • data-testid (primary)
 *  • Compound XPath: //table[@id='products-table']//tr//span[contains(@class,'stock-badge')]
 *  • contains():     span[contains(@class,'stock-green')]
 *  • following-sibling: //label[@for='product-type']/following-sibling::select
 *  • ancestor:          //span[@data-testid='product-stock-X']/ancestor::tr
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class ProductLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Product List
  // ══════════════════════════════════════════════════════════════════════════

  get productListContainer() { return this.page.getByTestId('product-list'); }
  get createProductBtn()     { return this.page.getByTestId('create-product-btn'); }
  get productsTable()        { return this.page.locator('#products-table'); }

  /** All product data rows */
  get productTableRows() {
    return this.page.locator(
      'xpath=//table[@id="products-table"]//tbody//tr[@data-product-id]'
    );
  }

  get productListError() { return this.page.locator('#product-list-error'); }
  get noDataMessage()    { return this.page.locator('xpath=//p[contains(@class,"no-data")]'); }

  // ── Filter bar ────────────────────────────────────────────────────────────
  get filterBar()   { return this.page.getByTestId('product-filter-bar'); }
  get typeFilter()  { return this.page.getByTestId('product-type-filter'); }
  get filterCount() {
    return this.page.locator(
      'xpath=//div[@data-testid="product-filter-bar"]//span[contains(@class,"filter-count")]'
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Product Form
  // ══════════════════════════════════════════════════════════════════════════

  get productForm()      { return this.page.locator('#product-form'); }
  get formError()        { return this.page.locator('#product-form-error'); }
  get formHeading() {
    return this.page.locator('xpath=//div[contains(@class,"form-container")]//h3');
  }

  get nameInput()        { return this.page.getByTestId('product-name-input'); }
  get typeSelect()       { return this.page.getByTestId('product-type-select'); }
  get descriptionInput() { return this.page.getByTestId('product-description-input'); }
  get priceInput()       { return this.page.getByTestId('product-price-input'); }
  get stockInput()       { return this.page.getByTestId('product-stock-input'); }
  get submitBtn()        { return this.page.getByTestId('submit-product-btn'); }
  get cancelBtn()        { return this.page.getByTestId('cancel-product-btn'); }

  /**
   * Product type select via XPath following-sibling from label.
   */
  get typeSelectViaLabel() {
    return this.page.locator(
      'xpath=//label[@for="product-type"]/following-sibling::select[@id="product-type"]'
    );
  }

  /**
   * Price input inside the form — compound XPath.
   */
  get priceInputViaForm() {
    return this.page.locator(
      'xpath=//form[@id="product-form"]//input[@data-testid="product-price-input"]'
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dynamic row locators (require product id)
  // ══════════════════════════════════════════════════════════════════════════

  productRow(id)         { return this.page.locator(`xpath=//tr[@data-product-id="${id}"]`); }
  productName(id)        { return this.page.getByTestId(`product-name-${id}`); }
  productType(id)        { return this.page.getByTestId(`product-type-${id}`); }
  productPrice(id)       { return this.page.getByTestId(`product-price-${id}`); }
  productStock(id)       { return this.page.getByTestId(`product-stock-${id}`); }
  productDescription(id) { return this.page.getByTestId(`product-description-${id}`); }
  editProductBtn(id)     { return this.page.getByTestId(`edit-product-${id}`); }
  deleteProductBtn(id)   { return this.page.getByTestId(`delete-product-${id}`); }

  /**
   * Stock badge for a specific product — XPath contains() on class.
   */
  productStockBadge(id) {
    return this.page.locator(
      `xpath=//tr[@data-product-id="${id}"]//span[contains(@class,"stock-badge")]`
    );
  }

  /**
   * Stock badges by colour class across the whole table.
   * e.g. stockBadgeByColor('stock-red') returns all red stock badges.
   */
  stockBadgeByColor(colorClass) {
    return this.page.locator(
      `xpath=//table[@id="products-table"]//tbody//span[contains(@class,"stock-badge") and contains(@class,"${colorClass}")]`
    );
  }

  /**
   * The entire row for a given product — ancestor from stock badge.
   * XPath ancestor pattern.
   */
  rowViaStockBadge(id) {
    return this.page.locator(
      `xpath=//span[@data-testid="product-stock-${id}"]/ancestor::tr[@data-product-id="${id}"]`
    );
  }

  /**
   * Edit button in a product row — resolved via ancestor from product name.
   */
  editBtnViaAncestor(id) {
    return this.page.locator(
      `xpath=//td[@data-testid="product-name-${id}"]/ancestor::tr//button[contains(@class,"btn-secondary")]`
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // "First row" shortcuts (used when id is unknown)
  // ══════════════════════════════════════════════════════════════════════════

  get firstEditBtn()   { return this.page.locator('[data-testid^="edit-product-"]').first(); }
  get firstDeleteBtn() { return this.page.locator('[data-testid^="delete-product-"]').first(); }
  get firstRowId()     { return this.page.locator('[data-testid^="product-id-"]').first(); }
}
