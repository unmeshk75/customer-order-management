/**
 * CustomerPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for the Customer module.
 *
 * ❌ REMOVED  : waitForLoadState('networkidle')
 * ✅ REPLACED :
 *   • After delete   → waitForDetached(rowLocator)  instead of networkidle
 *   • Country → State dynamic branch uses:
 *       waitForVisible(stateSelect)   when country = "US"
 *       waitForVisible(stateInput)    when country ≠ "US"
 *       isVisible() for conditional select vs input branching
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BasePage } from './BasePage.js';
import { CustomerLocators } from '../locators/CustomerLocators.js';
import { NavigationLocators } from '../locators/NavigationLocators.js';

export class CustomerPage extends BasePage {
  constructor(page) {
    super(page);
    this.navLoc = new NavigationLocators(page);
    this.loc = new CustomerLocators(page);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  async navigateToCustomers() {
    await this.goto();
    // Explicit wait: nav button must be visible before clicking
    await this.waitForVisible(this.navLoc.customersBtn);
    await this.navLoc.customersBtn.click();
    // Explicit wait: list container must appear after navigation
    await this.waitForVisible(this.loc.customerListContainer);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Form Actions
  // ──────────────────────────────────────────────────────────────────────────

  async openCreateForm() {
    // Explicit wait: button must be enabled before clicking
    await this.waitForEnabled(this.loc.createCustomerBtn);
    await this.loc.createCustomerBtn.click();
    // Explicit wait: form must appear in DOM and be visible
    await this.waitForVisible(this.loc.customerForm);
  }

  async openEditFormById(id) {
    const editBtn = this.loc.editCustomerBtn(id);
    // Explicit wait: specific edit button must be visible
    await this.waitForVisible(editBtn);
    await editBtn.click();
    // Explicit wait: form must appear
    await this.waitForVisible(this.loc.customerForm);
  }

  async openEditFormForFirst() {
    await this.waitForVisible(this.loc.firstEditBtn);
    await this.loc.firstEditBtn.click();
    await this.waitForVisible(this.loc.customerForm);
  }

  /**
   * Fill customer form fields.
   *
   * ╔══════════════════════════════════════════════════════════════════╗
   * ║  DYNAMIC BEHAVIOUR — Country ↔ State                           ║
   * ║                                                                  ║
   * ║  When country = "US":                                           ║
   * ║    React swaps the disabled <input> for a <select> dropdown.    ║
   * ║    We MUST wait for the dropdown to appear before interacting.  ║
   * ║                                                                  ║
   * ║  When country ≠ "US" (e.g. "Canada"):                          ║
   * ║    React renders a disabled <input> placeholder instead.        ║
   * ║    We wait for the disabled input to appear.                    ║
   * ║                                                                  ║
   * ║  Strategy used:                                                  ║
   * ║    • waitForVisible(stateSelect)  — explicit wait for dropdown  ║
   * ║    • waitForVisible(stateInput)   — explicit wait for input     ║
   * ║    • isVisible()                  — boolean branch (no throw)   ║
   * ╚══════════════════════════════════════════════════════════════════╝
   *
   * @param {Object} data
   */
  async fillCustomerForm(data) {
    if (data.name         !== undefined) await this.clearAndFill(this.loc.nameInput,    data.name);
    if (data.customerType !== undefined) await this.loc.typeSelect.selectOption(data.customerType);
    if (data.email        !== undefined) await this.clearAndFill(this.loc.emailInput,   data.email);
    if (data.phone        !== undefined) await this.clearAndFill(this.loc.phoneInput,   data.phone);
    if (data.street       !== undefined) await this.clearAndFill(this.loc.streetInput,  data.street);
    if (data.city         !== undefined) await this.clearAndFill(this.loc.cityInput,    data.city);

    if (data.country !== undefined) {
      // Fill the country field
      await this.clearAndFill(this.loc.countryInput, data.country);

      if (data.country === 'US') {
        // ▶ DYNAMIC WAIT: React replaces disabled input with a <select> dropdown.
        //   We wait explicitly for the dropdown to become visible — no hardcoded ms.
        await this.waitForVisible(this.loc.stateSelect);
      } else {
        // ▶ DYNAMIC WAIT: React renders a disabled input for non-US countries.
        //   Wait for that disabled input to be visible.
        await this.waitForVisible(this.loc.stateInput);
      }
    }

    if (data.state !== undefined) {
      // ▶ DYNAMIC BRANCH: decide which element to use based on current DOM state
      //   isVisible() returns boolean — safe, never throws
      const dropdownVisible = await this.isVisible(this.loc.stateSelect);
      if (dropdownVisible) {
        // Dropdown is present → select by value
        await this.loc.stateSelect.selectOption(data.state);
      }
      // If dropdown is not visible, state is not applicable for this country
    }

    if (data.zip !== undefined) await this.clearAndFill(this.loc.zipInput, data.zip);
  }

  /**
   * Submit the customer form.
   * ✅ Explicit wait: wait for the form to detach from DOM (means submit succeeded),
   *    then wait for the list container to be visible again.
   */
  async submitForm() {
    await this.waitForEnabled(this.loc.submitBtn);
    await this.loc.submitBtn.click();
    // Explicit wait: form disappears on success
    await this.waitForHidden(this.loc.customerForm);
    // Explicit wait: list must re-render
    await this.waitForVisible(this.loc.customerListContainer);
  }

  /**
   * Cancel the customer form.
   * ✅ Explicit wait: form disappears, list re-appears.
   */
  async cancelForm() {
    await this.loc.cancelBtn.click();
    await this.waitForHidden(this.loc.customerForm);
    await this.waitForVisible(this.loc.customerListContainer);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CRUD helpers
  // ──────────────────────────────────────────────────────────────────────────

  async createCustomer(data) {
    await this.openCreateForm();
    await this.fillCustomerForm(data);
    await this.submitForm();
  }

  /**
   * Delete a customer by ID and wait for its row to disappear.
   * ✅ Explicit wait: row must detach from DOM — no networkidle needed.
   * @param {number} id
   */
  async deleteCustomerById(id) {
    const row = this.page.locator(`[data-testid="customer-id-${id}"]`).locator('..');
    await this.waitForVisible(row);
    await this.acceptDialog();
    await this.loc.deleteCustomerBtn(id).click();
    // Explicit wait: row detaches from DOM when deletion is complete
    await this.waitForDetached(row);
  }

  /** Delete first customer row visible in the table. */
  async deleteFirstCustomer() {
    const firstRow = this.loc.customerTableRows.first();
    await this.waitForVisible(firstRow);
    await this.acceptDialog();
    await this.loc.firstDeleteBtn.click();
    await this.waitForDetached(firstRow);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Query helpers
  // ──────────────────────────────────────────────────────────────────────────

  async getRowCount()        { return await this.loc.customerTableRows.count(); }
  async isFormErrorVisible() { return await this.isVisible(this.loc.formError); }
  async getFormErrorText()   { return await this.getText(this.loc.formError); }

  /**
   * Returns whether the US state dropdown is currently visible.
   * Used in tests to assert the dynamic Country→State switch.
   * @returns {Promise<boolean>}
   */
  async isStateDropdownVisible() {
    return await this.isVisible(this.loc.stateSelect);
  }

  /**
   * Returns whether the disabled state text-input is currently visible.
   * Visible only when country ≠ "US".
   * @returns {Promise<boolean>}
   */
  async isStateInputVisible() {
    return await this.isVisible(this.loc.stateInput);
  }

  /**
   * Returns whether the disabled state input is disabled.
   * @returns {Promise<boolean>}
   */
  async isStateInputDisabled() {
    const enabled = await this.isEnabled(this.loc.stateInput);
    return !enabled;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Granular field-fill helpers (used when filling one field at a time)
  // ──────────────────────────────────────────────────────────────────────────

  async fillName(name)               { await this.clearAndFill(this.loc.nameInput, name); }
  async fillEmail(email)             { await this.clearAndFill(this.loc.emailInput, email); }
  async fillPhone(phone)             { await this.clearAndFill(this.loc.phoneInput, phone); }
  async fillStreet(street)           { await this.clearAndFill(this.loc.streetInput, street); }
  async fillCity(city)               { await this.clearAndFill(this.loc.cityInput, city); }
  async fillZip(zip)                 { await this.clearAndFill(this.loc.zipInput, zip); }
  async fillCompanyName(name)        { await this.clearAndFill(this.loc.companyNameInput, name); }
  async selectType(type)             { await this.selectByValue(this.loc.typeSelect, type); }
  async selectState(state)           { await this.waitForVisible(this.loc.stateSelect); await this.loc.stateSelect.selectOption(state); }

  /**
   * Fill the country field and blur to trigger the React onChange.
   * Automatically waits for the state field to update.
   */
  async fillCountry(country) {
    await this.clearAndFill(this.loc.countryInput, country);
    await this.loc.countryInput.blur();
    if (country === 'US') {
      await this.waitForVisible(this.loc.stateSelect);
    } else {
      await this.waitForVisible(this.loc.stateInput);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Form state helpers
  // ──────────────────────────────────────────────────────────────────────────

  async getFormHeading()          { return this.getText(this.loc.formHeading); }
  async getFormError()            { return this.getText(this.loc.formError); }
  async getStateLabelText()       { return this.getText(this.loc.stateLabel); }
  async isCompanyNameVisible()    { return this.isVisible(this.loc.companyNameGroup); }

  /** Click submit but do NOT wait for form to close — used for negative/error tests. */
  async submitFormExpectError() {
    await this.waitForEnabled(this.loc.submitBtn);
    await this.loc.submitBtn.click();
    await this.waitForVisible(this.loc.formError);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Edit / expand / delete (aliased for convenience)
  // ──────────────────────────────────────────────────────────────────────────

  /** Alias for openEditFormById — used by tests that call cust.openEditForm(id). */
  async openEditForm(id) { return this.openEditFormById(id); }

  /** Delete a customer via modal confirmation. */
  async deleteCustomer(id) {
    const row = this.loc.customerRow(id);
    await this.waitForVisible(row);
    await this.clickWhenReady(this.loc.deleteCustomerBtn(id));
    await this.waitForVisible(this.page.getByTestId('modal-overlay').filter({ hasClass: /modal-open/ }).or(
      this.page.locator('xpath=//div[contains(@class,"modal-overlay") and contains(@class,"modal-open")]')
    ));
    await this.clickWhenReady(this.page.getByTestId('modal-confirm'));
    await this.waitForDetached(row);
  }

  /** Type into the search input and wait for the table to update. */
  async search(term) {
    await this.clearAndFill(this.loc.searchInput, term);
    // Brief settle — table re-renders after debounce
    await this.page.waitForTimeout(300);
  }

  /** Expand a customer's detail row. */
  async expandRow(id) {
    await this.clickWhenReady(this.loc.expandRowBtn(id));
    await this.waitForVisible(this.loc.detailRow(id));
  }

  /** Collapse a customer's detail row. */
  async collapseRow(id) {
    await this.clickWhenReady(this.loc.expandRowBtn(id));
    await this.waitForHidden(this.loc.detailRow(id));
  }
}


