/**
 * CustomerPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for the Customer module.
 *
 * ❌ REMOVED  : waitForLoadState('networkidle'), page.waitForTimeout
 * ✅ REPLACED :
 *   • After delete   → waitForDetached(rowLocator)
 *   • Country → State dynamic branch uses:
 *       waitForVisible(stateSelect)   when country = "US"
 *       waitForVisible(stateInput)    when country ≠ "US"
 *       isVisible() for conditional select vs input branching
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BasePage } from './BasePage.js';
import { CustomerLocators } from '../locators/CustomerLocators.js';
import { NavigationLocators } from '../locators/NavigationLocators.js';
import { ModalLocators } from '../locators/ModalLocators.js';

export class CustomerPage extends BasePage {
  constructor(page) {
    super(page);
    this.navLoc = new NavigationLocators(page);
    this.loc    = new CustomerLocators(page);
    this.modal  = new ModalLocators(page);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  async navigateToCustomers() {
    await this.goto();
    await this.waitForVisible(this.navLoc.navCustomers);
    await this.navLoc.navCustomers.click();
    await this.waitForVisible(this.loc.customerList);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Form open / close
  // ──────────────────────────────────────────────────────────────────────────

  async openCreateForm() {
    await this.waitForEnabled(this.loc.createCustomerBtn);
    await this.loc.createCustomerBtn.click();
    await this.waitForVisible(this.loc.customerForm);
  }

  async openEditForm(id) {
    const editBtn = this.loc.editCustomerBtn(id);
    await this.waitForVisible(editBtn);
    await editBtn.click();
    await this.waitForVisible(this.loc.customerForm);
  }

  async openEditFormForFirst() {
    await this.waitForVisible(this.loc.firstEditBtn);
    await this.loc.firstEditBtn.click();
    await this.waitForVisible(this.loc.customerForm);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Fill form
  // ──────────────────────────────────────────────────────────────────────────

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
   * ║  When country ≠ "US":                                           ║
   * ║    React renders a plain <input> placeholder instead.           ║
   * ║    We wait for the input to appear.                             ║
   * ║                                                                  ║
   * ║  Strategy:                                                       ║
   * ║    • waitForVisible(stateSelect) — explicit wait for dropdown   ║
   * ║    • waitForVisible(stateInput)  — explicit wait for input      ║
   * ║    • isVisible()                 — boolean branch (no throw)    ║
   * ╚══════════════════════════════════════════════════════════════════╝
   *
   * @param {Object} data
   */
  async fillCustomerForm(data) {
    if (data.name !== undefined) {
      await this.clearAndFill(this.loc.customerNameInput, data.name);
    }
    if (data.customerType !== undefined) {
      await this.selectByValue(this.loc.customerTypeSelect, data.customerType);
    }
    if (data.company !== undefined) {
      await this.clearAndFill(this.loc.customerCompanyInput, data.company);
    }
    if (data.email !== undefined) {
      await this.clearAndFill(this.loc.customerEmailInput, data.email);
    }
    if (data.phone !== undefined) {
      await this.clearAndFill(this.loc.customerPhoneInput, data.phone);
    }
    if (data.accountStatus !== undefined) {
      await this.selectByValue(this.loc.customerAccountStatusSelect, data.accountStatus);
    }
    if (data.contactPreference !== undefined) {
      await this.selectByValue(this.loc.customerContactPreferenceSelect, data.contactPreference);
    }
    if (data.street !== undefined) {
      await this.clearAndFill(this.loc.customerStreetInput, data.street);
    }
    if (data.city !== undefined) {
      await this.clearAndFill(this.loc.customerCityInput, data.city);
    }
    if (data.zip !== undefined) {
      await this.clearAndFill(this.loc.customerZipInput, data.zip);
    }

    if (data.country !== undefined) {
      await this.clearAndFill(this.loc.customerCountryInput, data.country);
      if (data.country === 'US') {
        // ▶ DYNAMIC WAIT: React replaces input with a <select> for US.
        await this.waitForVisible(this.loc.customerStateSelect);
      } else {
        // ▶ DYNAMIC WAIT: React renders a plain input for non-US countries.
        await this.waitForVisible(this.loc.customerStateInput);
      }
    }

    if (data.state !== undefined) {
      // ▶ DYNAMIC BRANCH: decide based on current DOM state
      const dropdownVisible = await this.isVisible(this.loc.customerStateSelect);
      if (dropdownVisible) {
        await this.selectByValue(this.loc.customerStateSelect, data.state);
      } else {
        const inputVisible = await this.isVisible(this.loc.customerStateInput);
        if (inputVisible) {
          await this.clearAndFill(this.loc.customerStateInput, data.state);
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Submit / cancel
  // ──────────────────────────────────────────────────────────────────────────

  async submitForm() {
    await this.waitForEnabled(this.loc.submitCustomerBtn);
    await this.loc.submitCustomerBtn.click();
    await this.waitForHidden(this.loc.customerForm);
    await this.waitForVisible(this.loc.customerList);
  }

  async cancelForm() {
    await this.clickWhenReady(this.loc.cancelCustomerBtn);
    await this.waitForHidden(this.loc.customerForm);
    await this.waitForVisible(this.loc.customerList);
  }

  /** Click submit but do NOT wait for form to close — used for negative/error tests. */
  async submitFormExpectError() {
    await this.waitForEnabled(this.loc.submitCustomerBtn);
    await this.loc.submitCustomerBtn.click();
    await this.waitForVisible(this.loc.customerFormError);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CRUD helpers
  // ──────────────────────────────────────────────────────────────────────────

  async createCustomer(data) {
    await this.openCreateForm();
    await this.fillCustomerForm(data);
    await this.submitForm();
  }

  async editCustomer(id, data) {
    await this.openEditForm(id);
    await this.fillCustomerForm(data);
    await this.submitForm();
  }

  /**
   * Delete a customer by ID.
   * Clicks delete button → waits for modal → confirms → waits for row to detach.
   * @param {number|string} id
   */
  async deleteCustomer(id) {
    const deleteBtn = this.loc.deleteCustomerBtn(id);
    const row       = this.loc.customerRowId(id);

    await this.waitForVisible(row);
    await this.clickWhenReady(deleteBtn);

    // Wait for the confirmation modal to appear
    await this.waitForVisible(this.modal.overlay);
    await this.waitForVisible(this.modal.confirmBtn);
    await this.clickWhenReady(this.modal.confirmBtn);

    // Row must detach from DOM — no networkidle needed
    await this.waitForDetached(row);
  }

  /** Delete first customer row visible in the table. */
  async deleteFirstCustomer() {
    const firstRow = this.loc.firstCustomerRow;
    await this.waitForVisible(firstRow);
    await this.clickWhenReady(this.loc.firstDeleteBtn);

    await this.waitForVisible(this.modal.overlay);
    await this.waitForVisible(this.modal.confirmBtn);
    await this.clickWhenReady(this.modal.confirmBtn);

    await this.waitForDetached(firstRow);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Query helpers
  // ──────────────────────────────────────────────────────────────────────────

  async getRowCount() {
    return await this.loc.allTableRows.count();
  }

  async isFormErrorVisible() {
    return await this.isVisible(this.loc.customerFormError);
  }

  async getFormErrorText() {
    return await this.getText(this.loc.customerFormError);
  }

  async isListErrorVisible() {
    return await this.isVisible(this.loc.customerListError);
  }

  async getListErrorText() {
    return await this.getText(this.loc.customerListError);
  }

  /**
   * Returns whether the US state dropdown is currently visible.
   * @returns {Promise<boolean>}
   */
  async isStateDropdownVisible() {
    return await this.isVisible(this.loc.customerStateSelect);
  }

  /**
   * Returns whether the state text-input is currently visible.
   * @returns {Promise<boolean>}
   */
  async isStateInputVisible() {
    return await this.isVisible(this.loc.customerStateInput);
  }

  /**
   * Returns whether the state input is disabled.
   * @returns {Promise<boolean>}
   */
  async isStateInputDisabled() {
    const enabled = await this.isEnabled(this.loc.customerStateInput);
    return !enabled;
  }

  async getCustomerTotal() {
    return await this.getIntText(this.loc.customerTotal);
  }

  async getCustomerCountByType(type) {
    return await this.getIntText(this.loc.customerCountByType(type));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Row data helpers
  // ──────────────────────────────────────────────────────────────────────────

  async getRowName(id)        { return await this.getText(this.loc.customerRowName(id)); }
  async getRowCompany(id)     { return await this.getText(this.loc.customerRowCompany(id)); }
  async getRowType(id)        { return await this.getText(this.loc.customerRowType(id)); }
  async getRowEmail(id)       { return await this.getText(this.loc.customerRowEmail(id)); }
  async getRowPhone(id)       { return await this.getText(this.loc.customerRowPhone(id)); }
  async getRowLocation(id)    { return await this.getText(this.loc.customerRowLocation(id)); }
  async getRowStatus(id)      { return await this.getText(this.loc.customerRowStatus(id)); }
  async getRowContactPref(id) { return await this.getText(this.loc.customerRowContactPref(id)); }

  async isRowVisible(id) {
    return await this.isVisible(this.loc.customerRowId(id));
  }

  async waitForRowVisible(id) {
    await this.waitForVisible(this.loc.customerRowId(id));
  }

  async waitForRowDetached(id) {
    await this.waitForDetached(this.loc.customerRowId(id));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Search
  // ──────────────────────────────────────────────────────────────────────────

  async search(term) {
    await this.waitForVisible(this.loc.customerSearchInput);
    await this.clearAndFill(this.loc.customerSearchInput, term);
    // Wait for the table to reflect the search — use explicit count/text assertions in tests
  }

  async clearSearch() {
    await this.waitForVisible(this.loc.customerSearchInput);
    await this.loc.customerSearchInput.clear();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Granular field-fill helpers
  // ──────────────────────────────────────────────────────────────────────────

  async fillName(value) {
    await this.clearAndFill(this.loc.customerNameInput, value);
  }

  async fillCompany(value) {
    await this.clearAndFill(this.loc.customerCompanyInput, value);
  }

  async fillEmail(value) {
    await this.clearAndFill(this.loc.customerEmailInput, value);
  }

  async fillPhone(value) {
    await this.clearAndFill(this.loc.customerPhoneInput, value);
  }

  async fillStreet(value) {
    await this.clearAndFill(this.loc.customerStreetInput, value);
  }

  async fillCity(value) {
    await this.clearAndFill(this.loc.customerCityInput, value);
  }

  async fillZip(value) {
    await this.clearAndFill(this.loc.customerZipInput, value);
  }

  /**
   * Fill the country field and wait for the State field to update dynamically.
   * @param {string} country
   */
  async fillCountry(country) {
    await this.clearAndFill(this.loc.customerCountryInput, country);
    await this.loc.customerCountryInput.blur();
    if (country === 'US') {
      await this.waitForVisible(this.loc.customerStateSelect);
    } else {
      await this.waitForVisible(this.loc.customerStateInput);
    }
  }

  async selectCustomerType(value) {
    await this.selectByValue(this.loc.customerTypeSelect, value);
  }

  async selectAccountStatus(value) {
    await this.selectByValue(this.loc.customerAccountStatusSelect, value);
  }

  async selectContactPreference(value) {
    await this.selectByValue(this.loc.customerContactPreferenceSelect, value);
  }

  /**
   * Select state from dropdown (US only).
   * Waits for the dropdown to be visible first.
   * @param {string} value
   */
  async selectState(value) {
    await this.waitForVisible(this.loc.customerStateSelect);
    await this.selectByValue(this.loc.customerStateSelect, value);
  }

  /**
   * Fill state as free-text input (non-US countries).
   * @param {string} value
   */
  async fillStateInput(value) {
    await this.waitForVisible(this.loc.customerStateInput);
    await this.clearAndFill(this.loc.customerStateInput, value);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Visibility / state assertions helpers
  // ──────────────────────────────────────────────────────────────────────────

  async isFormVisible() {
    return await this.isVisible(this.loc.customerForm);
  }

  async isListVisible() {
    return await this.isVisible(this.loc.customerList);
  }

  async isCreateBtnVisible() {
    return await this.isVisible(this.loc.createCustomerBtn);
  }

  async isSubmitBtnEnabled() {
    return await this.isEnabled(this.loc.submitCustomerBtn);
  }

  async waitForFormVisible() {
    await this.waitForVisible(this.loc.customerForm);
  }

  async waitForFormHidden() {
    await this.waitForHidden(this.loc.customerForm);
  }

  async waitForListVisible() {
    await this.waitForVisible(this.loc.customerList);
  }

  async waitForModalVisible() {
    await this.waitForVisible(this.modal.overlay);
    await this.waitForVisible(this.modal.confirmBtn);
  }

  async dismissModal() {
    await this.waitForVisible(this.modal.cancelBtn);
    await this.clickWhenReady(this.modal.cancelBtn);
    await this.waitForHidden(this.modal.overlay);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // XPath-based helpers
  // ──────────────────────────────────────────────────────────────────────────

  async getStatusBadgeText(id) {
    return await this.getText(this.loc.customerStatusBadge(id));
  }

  async deleteByAncestorBtn(id) {
    const btn = this.loc.deleteBtnByAncestor(id);
    const row = this.loc.customerRowId(id);
    await this.waitForVisible(btn);
    await this.clickWhenReady(btn);
    await this.waitForVisible(this.modal.confirmBtn);
    await this.clickWhenReady(this.modal.confirmBtn);
    await this.waitForDetached(row);
  }

  async getStateFollowingSiblingTag() {
    await this.waitForAttached(this.loc.stateFollowingSibling);
    return await this.loc.stateFollowingSibling.evaluate(el => el.tagName.toLowerCase());
  }
}
