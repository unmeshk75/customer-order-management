/**
 * CustomerLocators.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All selectors for Customer List, Customer Form, and expanded detail rows.
 *
 * XPath Strategies demonstrated:
 *  • data-testid (primary)
 *  • id selectors
 *  • Compound XPath:  //fieldset[legend[contains(text(),'Address')]]//input
 *  • following-sibling: //label[contains(text(),'State')]/following-sibling::select
 *  • ancestor:          //input[@data-testid='customer-name-input']/ancestor::form
 *  • parent:            //button[@data-testid='submit-customer-btn']/parent::div
 *  • contains():        //span[contains(@class,'status-badge') and contains(text(),'Active')]
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class CustomerLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Customer List
  // ══════════════════════════════════════════════════════════════════════════

  get customerListContainer() { return this.page.getByTestId('customer-list'); }
  get createCustomerBtn()      { return this.page.getByTestId('create-customer-btn'); }
  get customersTable()         { return this.page.locator('#customers-table'); }

  /** All data rows (excludes detail/expansion rows) */
  get customerTableRows() {
    // XPath: compound — rows with data-customer-id attribute inside tbody
    return this.page.locator(
      'xpath=//table[@id="customers-table"]//tbody//tr[@data-customer-id]'
    );
  }

  get noDataMessage() {
    return this.page.locator('xpath=//p[contains(@class,"no-data")]');
  }

  get customerListError() { return this.page.locator('#customer-list-error'); }

  get searchInput() { return this.page.getByTestId('customer-search-input'); }

  get filterCount() {
    // XPath: span inside filter-bar that contains count text
    return this.page.locator(
      'xpath=//div[@data-testid="customer-filter-bar"]//span[contains(@class,"filter-count")]'
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Customer Form — Basic Info fieldset
  // ══════════════════════════════════════════════════════════════════════════

  get customerForm() { return this.page.locator('#customer-form'); }
  get formHeading()  {
    // XPath: compound — h3 that is a descendant of div.form-container
    return this.page.locator('xpath=//div[contains(@class,"form-container")]//h3');
  }

  get formError() { return this.page.locator('#customer-form-error'); }

  get nameInput()  { return this.page.getByTestId('customer-name-input'); }
  get typeSelect() { return this.page.getByTestId('customer-type-select'); }
  get emailInput() { return this.page.getByTestId('customer-email-input'); }
  get phoneInput() { return this.page.getByTestId('customer-phone-input'); }

  // Company name (conditionally rendered for SMB/Enterprise)
  get companyNameGroup() { return this.page.getByTestId('company-name-group'); }
  get companyNameInput() { return this.page.getByTestId('customer-company-input'); }

  // ── Account Settings fieldset ──────────────────────────────────────────────
  get accountStatusSelect() { return this.page.getByTestId('customer-account-status-select'); }
  get contactPrefSelect()   { return this.page.getByTestId('customer-contact-preference-select'); }

  // ── Address fieldset ──────────────────────────────────────────────────────
  get streetInput()  { return this.page.getByTestId('customer-street-input'); }
  get cityInput()    { return this.page.getByTestId('customer-city-input'); }
  get zipInput()     { return this.page.getByTestId('customer-zip-input'); }
  get countryInput() { return this.page.getByTestId('customer-country-input'); }

  /**
   * State SELECT (rendered when country = 'US').
   * data-testid primary; XPath fallback using following-sibling from the label.
   */
  get stateSelect() { return this.page.getByTestId('customer-state-select'); }

  /**
   * State INPUT (rendered when country ≠ 'US') — disabled plain text field.
   */
  get stateInput() { return this.page.getByTestId('customer-state-input'); }

  /**
   * State label — uses XPath following-sibling to find the adjacent control.
   * Useful to verify label text includes '*' when state is mandatory.
   */
  get stateLabel() {
    // XPath: label whose for attribute is 'customer-state'
    return this.page.locator('xpath=//label[@for="customer-state"]');
  }

  /**
   * The state control AFTER the label — dynamically select or input.
   * XPath following-sibling pattern.
   */
  get stateControlViaLabel() {
    return this.page.locator(
      'xpath=//label[@for="customer-state"]/following-sibling::*[1]'
    );
  }

  /**
   * Country input inside the Address fieldset — compound XPath.
   */
  get countryInputViaFieldset() {
    return this.page.locator(
      'xpath=//fieldset[.//legend[contains(text(),"Address")]]//input[@data-testid="customer-country-input"]'
    );
  }

  // ── Form actions ──────────────────────────────────────────────────────────
  get submitBtn() { return this.page.getByTestId('submit-customer-btn'); }
  get cancelBtn() { return this.page.getByTestId('cancel-customer-btn'); }

  /**
   * Form-actions container — parent of submit/cancel buttons.
   * XPath parent pattern.
   */
  get formActionsContainer() {
    return this.page.locator(
      'xpath=//button[@data-testid="submit-customer-btn"]/parent::div[contains(@class,"form-actions")]'
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dynamic row locators (require customer id)
  // ══════════════════════════════════════════════════════════════════════════

  customerRow(id)          { return this.page.locator(`xpath=//tr[@data-customer-id="${id}"]`); }
  customerName(id)         { return this.page.getByTestId(`customer-name-${id}`); }
  customerType(id)         { return this.page.getByTestId(`customer-type-${id}`); }
  customerEmail(id)        { return this.page.getByTestId(`customer-email-${id}`); }
  customerPhone(id)        { return this.page.getByTestId(`customer-phone-${id}`); }
  customerLocation(id)     { return this.page.getByTestId(`customer-location-${id}`); }
  customerStatus(id)       { return this.page.getByTestId(`customer-status-${id}`); }
  customerContactPref(id)  { return this.page.getByTestId(`customer-contact-pref-${id}`); }
  editCustomerBtn(id)      { return this.page.getByTestId(`edit-customer-${id}`); }
  deleteCustomerBtn(id)    { return this.page.getByTestId(`delete-customer-${id}`); }
  expandRowBtn(id)         { return this.page.getByTestId(`expand-row-${id}`); }
  detailRow(id)            { return this.page.getByTestId(`detail-row-${id}`); }
  detailTable(id)          { return this.page.getByTestId(`detail-table-${id}`); }

  /**
   * Status badge for a customer row — uses XPath contains() on class.
   * Pattern: ancestor → row → descendant badge.
   */
  customerStatusBadge(id) {
    return this.page.locator(
      `xpath=//tr[@data-customer-id="${id}"]//span[contains(@class,"status-badge")]`
    );
  }

  /**
   * Edit button resolved via ancestor pattern from customer name cell.
   * XPath: traverse up to the row, then find btn-secondary.
   */
  editBtnViaAncestor(id) {
    return this.page.locator(
      `xpath=//td[@data-testid="customer-name-${id}"]/ancestor::tr//button[contains(@class,"btn-secondary")]`
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // "First row" shortcuts (used when id is unknown)
  // ══════════════════════════════════════════════════════════════════════════

  get firstEditBtn()   { return this.page.locator('[data-testid^="edit-customer-"]').first(); }
  get firstDeleteBtn() { return this.page.locator('[data-testid^="delete-customer-"]').first(); }
  get firstRowId()     { return this.page.locator('[data-testid^="customer-id-"]').first(); }
  get firstExpandBtn() { return this.page.locator('[data-testid^="expand-row-"]').first(); }

  // ══════════════════════════════════════════════════════════════════════════
  // Expanded detail rows — order sub-table
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * All order rows inside the expanded detail table for a customer.
   * XPath: detail-row → detail-table → tbody → tr
   */
  customerOrderDetailRows(customerId) {
    return this.page.locator(
      `xpath=//tr[@data-testid="detail-row-${customerId}"]//table[contains(@data-testid,"detail-table")]//tbody//tr`
    );
  }

  /**
   * "No orders" message inside an expanded customer detail row.
   * XPath: following-sibling from the main row.
   */
  noOrdersForCustomer(customerId) {
    return this.page.locator(
      `xpath=//tr[@data-customer-id="${customerId}"]/following-sibling::tr[@data-testid="detail-row-${customerId}"]//p[contains(@class,"no-data")]`
    );
  }
}
