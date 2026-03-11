/**
 * OrderLocators.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All selectors for Order List, Order Form (3-step wizard), and expanded rows.
 *
 * XPath Strategies demonstrated:
 *  • data-testid (primary)
 *  • Compound XPath:  //div[@class='wizard-panel'][@data-step='2'][@data-status='active']
 *  • following-sibling: //tr[@data-order-id]/following-sibling::tr[@class='detail-row']
 *  • ancestor:          //select[@data-testid='order-product-0']/ancestor::div[@data-product-index]
 *  • parent:            //button[@data-testid='wizard-next']/parent::div[@class='wizard-nav']
 *  • contains():        //span[contains(@class,'priority-badge') and contains(@class,'priority-high')]
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class OrderLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Order List
  // ══════════════════════════════════════════════════════════════════════════

  get orderListContainer() { return this.page.getByTestId('order-list'); }
  get createOrderBtn()     { return this.page.getByTestId('create-order-btn'); }
  get ordersTable()        { return this.page.locator('#orders-table'); }

  /** All main order rows (not detail expansion rows) */
  get orderTableRows() {
    return this.page.locator(
      'xpath=//table[@id="orders-table"]//tbody//tr[@data-order-id]'
    );
  }

  get orderListError() { return this.page.locator('#order-list-error'); }
  get noDataMessage()  {
    return this.page.locator('xpath=//p[contains(@class,"no-data")]');
  }

  // ── Filter sidebar ─────────────────────────────────────────────────────────
  get openFiltersBtn()  { return this.page.getByTestId('open-filters-btn'); }
  get filterSidebar()   { return this.page.getByTestId('filter-sidebar'); }
  get sidebarClose()    { return this.page.getByTestId('sidebar-close'); }
  get filterChips()     { return this.page.getByTestId('filter-chips'); }

  get filterBadge() {
    return this.page.locator(
      'xpath=//button[@data-testid="open-filters-btn"]//span[contains(@class,"filter-badge")]'
    );
  }

  /**
   * A specific filter checkbox by group and value.
   * XPath: compound — input inside filter-option label with matching data attributes.
   */
  filterCheckbox(group, value) {
    return this.page.locator(
      `xpath=//label[contains(@class,"filter-option") and @data-value="${value}"]//input[@data-filter="${group}"]`
    );
  }

  /**
   * Remove-chip button for an active filter.
   */
  removeChipBtn(group, value) {
    return this.page.getByTestId(`remove-chip-${group}-${value}`);
  }

  /**
   * Chip element by filter group and value.
   */
  filterChip(group, value) {
    return this.page.locator(
      `xpath=//span[contains(@class,"chip") and @data-filter="${group}" and @data-value="${value}"]`
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Order Form — Wizard
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Active wizard panel — compound XPath: data-step + data-status='active'.
   * @param {number} step
   */
  activeWizardPanel(step) {
    return this.page.locator(
      `xpath=//div[contains(@class,"wizard-panel") and @data-step="${step}" and @data-status="active"]`
    );
  }

  /**
   * Wizard step indicator by step number and status.
   * @param {number} step
   * @param {'active'|'completed'|'pending'} status
   */
  wizardStep(step, status) {
    return this.page.locator(
      `xpath=//div[contains(@class,"step") and @data-step="${step}" and @data-status="${status}"]`
    );
  }

  // ── Step 1: Customer & Settings ───────────────────────────────────────────
  get customerSelect()   { return this.page.getByTestId('order-customer-select'); }
  get customerReadonly() { return this.page.getByTestId('order-customer-readonly'); }
  get statusSelect()     { return this.page.getByTestId('order-status-select'); }
  get prioritySelect()   { return this.page.getByTestId('order-priority-select'); }
  get discountInput()    { return this.page.getByTestId('order-discount-input'); }
  get notesInput()       { return this.page.getByTestId('order-notes-input'); }

  /**
   * Customer select inside wizard step 1 panel — compound XPath.
   */
  get customerSelectViaPanel() {
    return this.page.locator(
      'xpath=//div[contains(@class,"wizard-panel") and @data-step="1"]//select[@data-testid="order-customer-select"]'
    );
  }

  // ── Step 2: Products ──────────────────────────────────────────────────────
  get productsSection()  { return this.page.locator('#order-products-section'); }
  get addProductBtn()    { return this.page.getByTestId('add-product-btn'); }

  /**
   * Available-products info text — compound XPath inside the products fieldset.
   */
  get availableProductsInfo() {
    return this.page.locator(
      'xpath=//fieldset[@id="order-products-section"]//p[contains(@class,"info-text")]'
    );
  }

  /**
   * Product row container by index.
   */
  productRow(index) { return this.page.getByTestId(`product-row-${index}`); }

  /**
   * Product select within a product row — ancestor pattern.
   * @param {number} index
   */
  orderProductSelect(index) { return this.page.getByTestId(`order-product-${index}`); }

  orderSeatsInput(index)    { return this.page.getByTestId(`order-seats-${index}`); }

  /**
   * Stock indicator for a product row — compound XPath.
   */
  stockIndicator(index) {
    return this.page.getByTestId(`stock-indicator-${index}`);
  }

  /**
   * Product select inside its container — ancestor pattern to verify context.
   */
  productSelectViaAncestor(index) {
    return this.page.locator(
      `xpath=//div[@data-testid="product-row-${index}"]//select[@data-testid="order-product-${index}"]`
    );
  }

  /**
   * The product-row div that is the ancestor of the seats input.
   */
  productRowViaSeatsAncestor(index) {
    return this.page.locator(
      `xpath=//input[@data-testid="order-seats-${index}"]/ancestor::div[contains(@class,"product-row")]`
    );
  }

  // ── Order total summary (Step 2 & Review) ─────────────────────────────────
  get orderTotalSummary()  { return this.page.getByTestId('order-total-summary').first(); }
  get orderSubtotal()      { return this.page.getByTestId('order-subtotal'); }
  get orderDiscountAmount(){ return this.page.getByTestId('order-discount-amount'); }
  get orderTotal()         { return this.page.getByTestId('order-total').last(); }

  // ── Step 3: Review ────────────────────────────────────────────────────────
  get reviewTable()        { return this.page.getByTestId('review-table'); }
  get orderProductsReadonly() { return this.page.getByTestId('order-products-readonly'); }

  /**
   * A review table row by index — compound XPath.
   */
  reviewRow(index) {
    return this.page.locator(
      `xpath=//table[@data-testid="review-table"]//tbody//tr[@data-review-row="${index}"]`
    );
  }

  /**
   * Subtotal cell in review table — compound XPath.
   */
  reviewSubtotal(index) { return this.page.getByTestId(`review-subtotal-${index}`); }

  // ── Wizard navigation buttons ─────────────────────────────────────────────
  get wizardNext()   { return this.page.getByTestId('wizard-next'); }
  get wizardBack()   { return this.page.getByTestId('wizard-back'); }
  get wizardSubmit() { return this.page.getByTestId('wizard-submit'); }
  get cancelBtn()    { return this.page.getByTestId('cancel-order-btn'); }

  /**
   * Wizard nav container — parent of wizard navigation buttons.
   * XPath parent pattern.
   */
  get wizardNavContainer() {
    return this.page.locator(
      'xpath=//button[@data-testid="wizard-next"]/parent::div[contains(@class,"wizard-nav")]'
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dynamic row locators (require order id)
  // ══════════════════════════════════════════════════════════════════════════

  orderRow(id)              { return this.page.locator(`xpath=//tr[@data-order-id="${id}"]`); }
  expandRowBtn(id)          { return this.page.getByTestId(`expand-row-${id}`); }
  orderCustomer(id)         { return this.page.getByTestId(`order-customer-${id}`); }
  orderCustomerType(id)     { return this.page.getByTestId(`order-customer-type-${id}`); }
  orderDate(id)             { return this.page.getByTestId(`order-date-${id}`); }
  orderStatus(id)           { return this.page.getByTestId(`order-status-${id}`); }
  orderPriority(id)         { return this.page.getByTestId(`order-priority-${id}`); }
  orderTotal(id)            { return this.page.getByTestId(`order-total-${id}`); }
  orderDiscount(id)         { return this.page.getByTestId(`order-discount-${id}`); }
  orderDiscountedTotal(id)  { return this.page.getByTestId(`order-discounted-total-${id}`); }
  editOrderBtn(id)          { return this.page.getByTestId(`edit-order-${id}`); }
  deleteOrderBtn(id)        { return this.page.getByTestId(`delete-order-${id}`); }
  detailRow(id)             { return this.page.getByTestId(`detail-row-${id}`); }
  detailTable(id)           { return this.page.getByTestId(`detail-table-${id}`); }

  /**
   * Status badge for a specific order — XPath contains() on class.
   */
  orderStatusBadge(id) {
    return this.page.locator(
      `xpath=//tr[@data-order-id="${id}"]//span[contains(@class,"status-badge")]`
    );
  }

  /**
   * Priority badge for a specific order — XPath contains() on class.
   */
  orderPriorityBadge(id) {
    return this.page.locator(
      `xpath=//tr[@data-order-id="${id}"]//span[contains(@class,"priority-badge")]`
    );
  }

  /**
   * Product rows inside an expanded order detail table.
   * XPath: following-sibling from main row, then navigate into detail table.
   */
  orderDetailProductRows(orderId) {
    return this.page.locator(
      `xpath=//tr[@data-order-id="${orderId}"]/following-sibling::tr[@data-testid="detail-row-${orderId}"]//tbody//tr`
    );
  }

  /**
   * Subtotal cell in detail table for a given product inside an order.
   */
  detailSubtotal(productId) {
    return this.page.getByTestId(`detail-subtotal-${productId}`);
  }

  /**
   * Edit button via ancestor from order customer cell.
   */
  editBtnViaAncestor(id) {
    return this.page.locator(
      `xpath=//td[@data-testid="order-customer-${id}"]/ancestor::tr//button[contains(@class,"btn-secondary")]`
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // "First row" shortcuts (used when id is unknown)
  // ══════════════════════════════════════════════════════════════════════════

  get firstEditBtn()    { return this.page.locator('[data-testid^="edit-order-"]').first(); }
  get firstDeleteBtn()  { return this.page.locator('[data-testid^="delete-order-"]').first(); }
  get firstRowId()      { return this.page.locator('[data-testid^="order-id-"]').first(); }
  get firstExpandBtn()  { return this.page.locator('[data-testid^="expand-row-"]').first(); }
}
