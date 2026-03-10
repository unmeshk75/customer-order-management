/**
 * locators.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All Page Object Model (POM) selectors for the frontend Playwright tests.
 * Strategy: data-testid > id > role > CSS
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class NavigationLocators {
  constructor(page) {
    this.page = page;
  }
  
  get customersBtn() { return this.page.getByTestId('nav-customers'); }
  get ordersBtn()    { return this.page.getByTestId('nav-orders'); }
  get productsBtn()  { return this.page.getByTestId('nav-products'); }
}

export class CustomerLocators {
  constructor(page) {
    this.page = page;
  }

  // ──── Customer List ──────────────────────────────────────────────────────────
  get customerListContainer() { return this.page.getByTestId('customer-list'); }
  get createCustomerBtn()      { return this.page.getByTestId('create-customer-btn'); }
  get customersTable()         { return this.page.locator('#customers-table'); }
  get customerTableRows()      { return this.page.locator('#customers-table tbody tr'); }
  get noDataMessage()          { return this.page.locator('p.no-data'); }
  get customerListError()      { return this.page.locator('#customer-list-error'); }

  // ──── Customer Form ──────────────────────────────────────────────────────────
  get customerForm()           { return this.page.locator('#customer-form'); }
  get nameInput()              { return this.page.getByTestId('customer-name-input'); }
  get typeSelect()             { return this.page.getByTestId('customer-type-select'); }
  get emailInput()             { return this.page.getByTestId('customer-email-input'); }
  get phoneInput()             { return this.page.getByTestId('customer-phone-input'); }
  get streetInput()            { return this.page.getByTestId('customer-street-input'); }
  get cityInput()              { return this.page.getByTestId('customer-city-input'); }
  get countryInput()           { return this.page.getByTestId('customer-country-input'); }
  get stateSelect()            { return this.page.getByTestId('customer-state-select'); }
  get stateInput()             { return this.page.getByTestId('customer-state-input'); }
  get zipInput()               { return this.page.getByTestId('customer-zip-input'); }
  get submitBtn()              { return this.page.getByTestId('submit-customer-btn'); }
  get cancelBtn()              { return this.page.getByTestId('cancel-customer-btn'); }
  get formError()              { return this.page.locator('#customer-form-error'); }
  get formHeading()            { return this.page.locator('.form-container h3'); }

  // ──── Dynamic row locators (by customer id) ──────────────────────────────────
  customerName(id)     { return this.page.getByTestId(`customer-name-${id}`); }
  customerType(id)     { return this.page.getByTestId(`customer-type-${id}`); }
  customerEmail(id)    { return this.page.getByTestId(`customer-email-${id}`); }
  customerPhone(id)    { return this.page.getByTestId(`customer-phone-${id}`); }
  customerLocation(id) { return this.page.getByTestId(`customer-location-${id}`); }
  editCustomerBtn(id)  { return this.page.getByTestId(`edit-customer-${id}`); }
  deleteCustomerBtn(id){ return this.page.getByTestId(`delete-customer-${id}`); }

  // ──── First row shortcuts (when id unknown) ──────────────────────────────────
  get firstEditBtn()   { return this.page.locator('[data-testid^="edit-customer-"]').first(); }
  get firstDeleteBtn() { return this.page.locator('[data-testid^="delete-customer-"]').first(); }
  get firstRowId()     { return this.page.locator('[data-testid^="customer-id-"]').first(); }
}

export class ProductLocators {
  constructor(page) {
    this.page = page;
  }

  // ──── Product List ──────────────────────────────────────────────────────────
  get productListContainer() { return this.page.getByTestId('product-list'); }
  get createProductBtn()     { return this.page.getByTestId('create-product-btn'); }
  get productsTable()        { return this.page.locator('#products-table'); }
  get productTableRows()     { return this.page.locator('#products-table tbody tr'); }
  get filterBar()            { return this.page.getByTestId('product-filter-bar'); }
  get typeFilter()           { return this.page.getByTestId('product-type-filter'); }

  // ──── Product Form ──────────────────────────────────────────────────────────
  get productForm()          { return this.page.locator('#product-form'); }
  get nameInput()            { return this.page.getByTestId('product-name-input'); }
  get typeSelect()           { return this.page.getByTestId('product-type-select'); }
  get descriptionInput()     { return this.page.getByTestId('product-description-input'); }
  get priceInput()           { return this.page.getByTestId('product-price-input'); }
  get stockInput()           { return this.page.getByTestId('product-stock-input'); }
  get submitBtn()            { return this.page.getByTestId('submit-product-btn'); }
  get cancelBtn()            { return this.page.getByTestId('cancel-product-btn'); }
  get formError()            { return this.page.locator('#product-form-error'); }

  // ──── Dynamic row locators (by product id) ──────────────────────────────────
  productName(id)        { return this.page.getByTestId(`product-name-${id}`); }
  productType(id)        { return this.page.getByTestId(`product-type-${id}`); }
  productPrice(id)       { return this.page.getByTestId(`product-price-${id}`); }
  productStock(id)       { return this.page.getByTestId(`product-stock-${id}`); }
  productDescription(id) { return this.page.getByTestId(`product-description-${id}`); }
  editProductBtn(id)     { return this.page.getByTestId(`edit-product-${id}`); }
  deleteProductBtn(id)   { return this.page.getByTestId(`delete-product-${id}`); }

  // ──── First row shortcuts (when id unknown) ──────────────────────────────────
  get firstEditBtn()     { return this.page.locator('[data-testid^="edit-product-"]').first(); }
  get firstDeleteBtn()   { return this.page.locator('[data-testid^="delete-product-"]').first(); }
  get firstRowId()       { return this.page.locator('[data-testid^="product-id-"]').first(); }
}

export class OrderLocators {
  constructor(page) {
    this.page = page;
  }

  // ──── Order List ────────────────────────────────────────────────────────────
  get orderListContainer() { return this.page.getByTestId('order-list'); }
  get createOrderBtn()     { return this.page.getByTestId('create-order-btn'); }
  get ordersTable()        { return this.page.locator('#orders-table'); }
  get orderTableRows()     { return this.page.locator('#orders-table tbody tr.main-row'); }
  get filterSidebar()      { return this.page.getByTestId('filter-sidebar'); }
  get sidebarClose()       { return this.page.getByTestId('sidebar-close'); }
  get openFiltersBtn()     { return this.page.getByTestId('open-filters-btn'); }
  get filterChips()        { return this.page.getByTestId('filter-chips'); }

  // ──── Order Form ────────────────────────────────────────────────────────────
  get orderForm()              { return this.page.locator('#order-form'); }
  get orderWizard()            { return this.page.getByTestId('order-wizard'); }
  get customerReadonly()       { return this.page.getByTestId('order-customer-readonly'); }
  get customerSelect()         { return this.page.getByTestId('order-customer-select'); }
  get statusSelect()           { return this.page.getByTestId('order-status-select'); }
  get prioritySelect()         { return this.page.getByTestId('order-priority-select'); }
  get discountInput()          { return this.page.getByTestId('order-discount-input'); }
  get notesInput()             { return this.page.getByTestId('order-notes-input'); }
  get submitBtn()              { return this.page.getByTestId('submit-order-btn'); }
  get cancelBtn()              { return this.page.getByTestId('cancel-order-btn'); }
  get productsSection()        { return this.page.locator('#order-products-section'); }
  get addProductBtn()          { return this.page.getByTestId('add-product-btn'); }

  // ──── Dynamic row locators (by order id) ────────────────────────────────────
  expandRowBtn(id)         { return this.page.getByTestId(`expand-row-${id}`); }
  orderCustomer(id)        { return this.page.getByTestId(`order-customer-${id}`); }
  orderCustomerType(id)    { return this.page.getByTestId(`order-customer-type-${id}`); }
  orderDate(id)            { return this.page.getByTestId(`order-date-${id}`); }
  orderStatus(id)          { return this.page.getByTestId(`order-status-${id}`); }
  orderPriority(id)        { return this.page.getByTestId(`order-priority-${id}`); }
  orderTotal(id)           { return this.page.getByTestId(`order-total-${id}`); }
  orderDiscount(id)        { return this.page.getByTestId(`order-discount-${id}`); }
  orderDiscountedTotal(id) { return this.page.getByTestId(`order-discounted-total-${id}`); }
  editOrderBtn(id)         { return this.page.getByTestId(`edit-order-${id}`); }
  deleteOrderBtn(id)       { return this.page.getByTestId(`delete-order-${id}`); }
  detailRow(id)            { return this.page.getByTestId(`detail-row-${id}`); }
  detailTable(id)          { return this.page.getByTestId(`detail-table-${id}`); }

  // ──── Order Form Dynamic Locators (by index) ────────────────────────────────
  productRow(index)        { return this.page.getByTestId(`product-row-${index}`); }
  orderProductSelect(index){ return this.page.getByTestId(`order-product-${index}`); }
  orderSeatsInput(index)   { return this.page.getByTestId(`order-seats-${index}`); }

  // ──── First row shortcuts (when id unknown) ─────────────────────────────────
  get firstEditBtn()     { return this.page.locator('[data-testid^="edit-order-"]').first(); }
  get firstDeleteBtn()   { return this.page.locator('[data-testid^="delete-order-"]').first(); }
  get firstRowId()       { return this.page.locator('[data-testid^="order-id-"]').first(); }
}


