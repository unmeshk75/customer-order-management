/**
 * CompanyLocators.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Locators for Company management module.
 * 
 * XPath Strategies:
 *  • Compound:         //table[@id="company-table"]//tbody//tr[@data-company-id]
 *  • following-sibling: //label[@for="company-name"]/following-sibling::input
 *  • ancestor:          //input[@data-testid="company-name-input"]/ancestor::form
 *  • parent:            //button[@data-testid="save-company-btn"]/parent::div
 *  • contains():        //span[contains(@class,"status-badge")]
 *  • normalize-space(): //label[normalize-space(text())="Company Name *"]
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class CompanyLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Company Form
  // ══════════════════════════════════════════════════════════════════════════

  get companyNameGroup() { return this.page.getByTestId('company-name-group'); }
  get companyForm() { return this.page.locator('#company-form'); }
  get saveBtn() { return this.page.getByTestId('save-company-btn'); }

  get companyNameLabel() {
    return this.page.locator('xpath=//label[normalize-space(text())="Company Name *"]');
  }

  get companyNameInput() {
    return this.page.locator('xpath=//label[@for="company-name"]/following-sibling::input');
  }

  get formContainer() {
    return this.page.locator('xpath=//button[@data-testid="save-company-btn"]/parent::div[contains(@class,"actions")]');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Company List
  // ══════════════════════════════════════════════════════════════════════════

  get companyTable() { return this.page.locator('#company-table'); }

  get companyTableRows() {
    return this.page.locator('xpath=//table[@id="company-table"]//tbody//tr[@data-company-id]');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dynamic Row Locators
  // ══════════════════════════════════════════════════════════════════════════

  companyRow(id) { return this.page.locator(`xpath=//tr[@data-company-id="${id}"]`); }
  
  companyStatusBadge(id) {
    return this.page.locator(`xpath=//tr[@data-company-id="${id}"]//span[contains(@class,"status-badge")]`);
  }

  editCompanyBtn(id) {
    return this.page.locator(`xpath=//tr[@data-company-id="${id}"]//button[contains(@class,"edit-btn")]`);
  }

  deleteCompanyBtnViaAncestor(id) {
    return this.page.locator(
      `xpath=//span[@data-id="${id}"]/ancestor::tr//button[contains(@class,"delete-btn")]`
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Shortcuts
  // ══════════════════════════════════════════════════════════════════════════

  get firstCompanyRow() { return this.page.locator('[data-company-id^="row-"]').first(); }
  get firstDeleteBtn() { return this.page.locator('[data-testid^="delete-company-"]').first(); }
