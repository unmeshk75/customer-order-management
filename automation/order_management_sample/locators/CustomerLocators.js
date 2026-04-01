export class CustomerLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Customer List
  // ══════════════════════════════════════════════════════════════════════════

  get customerList() { return this.page.getByTestId('customer-list'); }
  get createCustomerBtn() { return this.page.getByTestId('create-customer-btn'); }
  get customerFilterBar() { return this.page.getByTestId('customer-filter-bar'); }
  get customerSearchInput() { return this.page.getByTestId('customer-search-input'); }
  get customerListError() { return this.page.locator('#customer-list-error'); }
  get createCustomerBtnId() { return this.page.locator('#create-customer-btn'); }
  get customerSearchId() { return this.page.locator('#customer-search'); }
  get customersTable() { return this.page.locator('#customers-table'); }

  // ══════════════════════════════════════════════════════════════════════════
  // Customer Form
  // ══════════════════════════════════════════════════════════════════════════

  get customerNameInput() { return this.page.getByTestId('customer-name-input'); }
  get customerTypeSelect() { return this.page.getByTestId('customer-type-select'); }
  get customerCompanyInput() { return this.page.getByTestId('customer-company-input'); }
  get customerEmailInput() { return this.page.getByTestId('customer-email-input'); }
  get customerPhoneInput() { return this.page.getByTestId('customer-phone-input'); }
  get customerAccountStatusSelect() { return this.page.getByTestId('customer-account-status-select'); }
  get customerContactPreferenceSelect() { return this.page.getByTestId('customer-contact-preference-select'); }
  get customerStreetInput() { return this.page.getByTestId('customer-street-input'); }
  get customerCityInput() { return this.page.getByTestId('customer-city-input'); }
  get customerZipInput() { return this.page.getByTestId('customer-zip-input'); }
  get customerCountryInput() { return this.page.getByTestId('customer-country-input'); }
  get customerStateSelect() { return this.page.getByTestId('customer-state-select'); }
  get customerStateInput() { return this.page.getByTestId('customer-state-input'); }
  get submitCustomerBtn() { return this.page.getByTestId('submit-customer-btn'); }
  get cancelCustomerBtn() { return this.page.getByTestId('cancel-customer-btn'); }

  get customerFormError() { return this.page.locator('#customer-form-error'); }
  get customerForm() { return this.page.locator('#customer-form'); }
  get customerNameId() { return this.page.locator('#customer-name'); }
  get customerTypeId() { return this.page.locator('#customer-type'); }
  get customerCompanyId() { return this.page.locator('#customer-company'); }
  get customerEmailId() { return this.page.locator('#customer-email'); }
  get customerPhoneId() { return this.page.locator('#customer-phone'); }
  get customerAccountStatusId() { return this.page.locator('#customer-account-status'); }
  get customerContactPreferenceId() { return this.page.locator('#customer-contact-preference'); }
  get customerStreetId() { return this.page.locator('#customer-street'); }
  get customerCityId() { return this.page.locator('#customer-city'); }
  get customerZipId() { return this.page.locator('#customer-zip'); }
  get customerCountryId() { return this.page.locator('#customer-country'); }
  get customerStateId() { return this.page.locator('#customer-state'); }
  get submitCustomerBtnId() { return this.page.locator('#submit-customer-btn'); }
  get cancelCustomerBtnId() { return this.page.locator('#cancel-customer-btn'); }

  // ══════════════════════════════════════════════════════════════════════════
  // Dashboard
  // ══════════════════════════════════════════════════════════════════════════

  get customerTotal() { return this.page.getByTestId('customer-total'); }
  get customerTypeRow() { return this.page.getByTestId('customer-type-row'); }
  customerCountByType(type) { return this.page.getByTestId(`customer-count-${type.toLowerCase()}`); }

  // ══════════════════════════════════════════════════════════════════════════
  // XPath Strategies
  // ══════════════════════════════════════════════════════════════════════════

  // Compound: Table within body containing rows
  get allTableRows() { return this.page.locator('xpath=//table[@id="customers-table"]//tbody//tr[td]'); }
  
  // Following-sibling: Label for State input
  get stateFollowingSibling() { return this.page.locator('xpath=//label[@for="customer-state"]/following-sibling::*[1]'); }
  
  // Ancestor: Button inside a row identified by specific TD
  deleteBtnByAncestor(id) { return this.page.locator(`xpath=//td[@data-testid="customer-id-${id}"]/ancestor::tr//button[contains(@class,"delete")]`); }
  
  // Parent: Div container for form actions
  get formActionsParent() { return this.page.locator('xpath=//button[@data-testid="submit-customer-btn"]/parent::div[contains(@class,"actions")]'); }
  
  // Contains: Status badge
  customerStatusBadge(id) { return this.page.locator(`xpath=//td[@data-testid="customer-status-${id}"]//span[contains(@class,"status-badge")]`); }
  
  // Normalize-space: Header label
  get stateHeader() { return this.page.locator('xpath=//label[normalize-space(text())="State *"]'); }

  // ══════════════════════════════════════════════════════════════════════════
  // Dynamic Row Locators
  // ══════════════════════════════════════════════════════════════════════════

  customerRowId(id) { return this.page.getByTestId(`customer-id-${id}`); }
  customerRowName(id) { return this.page.getByTestId(`customer-name-${id}`); }
  customerRowCompany(id) { return this.page.getByTestId(`customer-company-${id}`); }
  customerRowType(id) { return this.page.getByTestId(`customer-type-${id}`); }
  customerRowEmail(id) { return this.page.getByTestId(`customer-email-${id}`); }
  customerRowPhone(id) { return this.page.getByTestId(`customer-phone-${id}`); }
  customerRowLocation(id) { return this.page.getByTestId(`customer-location-${id}`); }
  customerRowStatus(id) { return this.page.getByTestId(`customer-status-${id}`); }
  customerRowContactPref(id) { return this.page.getByTestId(`customer-contact-pref-${id}`); }
  editCustomerBtn(id) { return this.page.getByTestId(`edit-customer-${id}`); }
  deleteCustomerBtn(id) { return this.page.getByTestId(`delete-customer-${id}`); }

  // ══════════════════════════════════════════════════════════════════════════
  // First row shortcuts
  // ══════════════════════════════════════════════════════════════════════════

  get firstEditBtn() { return this.page.locator('[data-testid^="edit-customer-"]').first(); }
  get firstDeleteBtn() { return this.page.locator('[data-testid^="delete-customer-"]').first(); }
  get firstCustomerRow() { return this.page.locator('[data-testid^="customer-id-"]').first(); }
}
