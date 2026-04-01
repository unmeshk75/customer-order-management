export class ProductLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Product List
  // ══════════════════════════════════════════════════════════════════════════

  get productList() { return this.page.getByTestId('product-list'); }
  get createProductBtn() { return this.page.getByTestId('create-product-btn'); }
  get productFilterBar() { return this.page.getByTestId('product-filter-bar'); }
  get productTypeFilter() { return this.page.getByTestId('product-type-filter'); }
  get productsTable() { return this.page.locator('#products-table'); }
  get productListError() { return this.page.locator('#product-list-error'); }
  get createProductBtnId() { return this.page.locator('#create-product-btn'); }
  get productTypeFilterId() { return this.page.locator('#product-type-filter'); }

  // ══════════════════════════════════════════════════════════════════════════
  // Product Form
  // ══════════════════════════════════════════════════════════════════════════

  get productForm() { return this.page.locator('#product-form'); }
  get productNameInput() { return this.page.getByTestId('product-name-input'); }
  get productTypeSelect() { return this.page.getByTestId('product-type-select'); }
  get productDescriptionInput() { return this.page.getByTestId('product-description-input'); }
  get productPriceInput() { return this.page.getByTestId('product-price-input'); }
  get productStockInput() { return this.page.getByTestId('product-stock-input'); }
  get submitProductBtn() { return this.page.getByTestId('submit-product-btn'); }
  get cancelProductBtn() { return this.page.getByTestId('cancel-product-btn'); }
  get productFormError() { return this.page.locator('#product-form-error'); }
  get productNameId() { return this.page.locator('#product-name'); }
  get productTypeId() { return this.page.locator('#product-type'); }
  get productDescriptionId() { return this.page.locator('#product-description'); }
  get productPriceId() { return this.page.locator('#product-price'); }
  get productStockId() { return this.page.locator('#product-stock'); }
  get submitProductBtnId() { return this.page.locator('#submit-product-btn'); }
  get cancelProductBtnId() { return this.page.locator('#cancel-product-btn'); }

  // ══════════════════════════════════════════════════════════════════════════
  // Dynamic Product Row Methods
  // ══════════════════════════════════════════════════════════════════════════

  productRow(index) { return this.page.getByTestId(`product-row-${index}`); }
  removeProductBtn(index) { return this.page.getByTestId(`remove-product-${index}`); }
  productId(id) { return this.page.getByTestId(`product-id-${id}`); }
  productName(id) { return this.page.getByTestId(`product-name-${id}`); }
  productType(id) { return this.page.getByTestId(`product-type-${id}`); }
  productPrice(id) { return this.page.getByTestId(`product-price-${id}`); }
  productStock(id) { return this.page.getByTestId(`product-stock-${id}`); }
  productDescription(id) { return this.page.getByTestId(`product-description-${id}`); }
  editProductBtn(id) { return this.page.getByTestId(`edit-product-${id}`); }
  deleteProductBtn(id) { return this.page.getByTestId(`delete-product-${id}`); }

  // ══════════════════════════════════════════════════════════════════════════
  // XPath Locators
  // ══════════════════════════════════════════════════════════════════════════

  // Compound: table rows with specific attributes
  get productRows() { return this.page.locator('xpath=//table[@id="products-table"]//tbody//tr[@data-testid]'); }

  // Following-sibling: label to input
  productLabelInput(name) { return this.page.locator(`xpath=//label[normalize-space(text())="${name}"]/following-sibling::*[1]`); }

  // Ancestor: button inside row
  deleteBtnInRow(id) { return this.page.locator(`xpath=//td[@data-testid="product-id-${id}"]/ancestor::tr//button[contains(@class,"delete-btn")]`); }

  // Parent: form error container
  get productFormContainer() { return this.page.locator('xpath=//form[@id="product-form"]/parent::div[contains(@class,"form-wrapper")]'); }

  // Contains: status badge
  statusBadge(id) { return this.page.locator(`xpath=//span[contains(@class,"status-badge")]//ancestor::tr[@data-testid="product-id-${id}"]`); }

  // ══════════════════════════════════════════════════════════════════════════
  // Shortcuts
  // ══════════════════════════════════════════════════════════════════════════

  get firstProductRow() { return this.page.locator('[data-testid^="product-id-"]').first(); }
  get firstEditBtn() { return this.page.locator('[data-testid^="edit-product-"]').first(); }
  get firstDeleteBtn() { return this.page.locator('[data-testid^="delete-product-"]').first(); }
  get addProductBtn() { return this.page.getByTestId('add-product-btn'); }
}
