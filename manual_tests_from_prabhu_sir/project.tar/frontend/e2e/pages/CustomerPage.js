/**
 * CustomerPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for Customer List + Customer Form interactions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { CustomerLocators } from '../locators/CustomerLocators.js';
import { ModalLocators } from '../locators/ModalLocators.js';

export class CustomerPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.loc   = new CustomerLocators(page);
    this.modal = new ModalLocators(page);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Navigation to Customer view
  // ══════════════════════════════════════════════════════════════════════════

  /** Click 'Customers' in the nav and wait for the list to render. */
  async navigateTo() {
    await this.page.getByTestId('nav-customers').click();
    await this.waitForVisible(this.loc.customerListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Open / close the form
  // ══════════════════════════════════════════════════════════════════════════

  /** Click 'Create Customer' and wait for the form to appear. */
  async openCreateForm() {
    await this.clickWhenReady(this.loc.createCustomerBtn);
    await this.waitForVisible(this.loc.customerForm);
  }

  /** Click 'Edit' on a customer row and wait for the form. */
  async openEditForm(id) {
    await this.clickWhenReady(this.loc.editCustomerBtn(id));
    await this.waitForVisible(this.loc.customerForm);
  }

  /** Click 'Cancel' on the form and wait for the list to re-appear. */
  async cancelForm() {
    await this.clickWhenReady(this.loc.cancelBtn);
    await this.waitForVisible(this.loc.customerListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Form filling helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** Fill the customer name field. */
  async fillName(name) {
    await this.clearAndFill(this.loc.nameInput, name);
  }

  /** Select a customer type by value. */
  async selectType(type) {
    await this.selectByValue(this.loc.typeSelect, type);
  }

  /** Fill the email field. */
  async fillEmail(email) {
    await this.clearAndFill(this.loc.emailInput, email);
  }

  /** Fill the phone field. */
  async fillPhone(phone) {
    await this.clearAndFill(this.loc.phoneInput, phone);
  }

  /**
   * Fill the company name field.
   * Waits for the field to become visible (only shown for SMB/Enterprise).
   */
  async fillCompanyName(company) {
    await this.waitForVisible(this.loc.companyNameInput);
    await this.clearAndFill(this.loc.companyNameInput, company);
  }

  /** Fill the street address field. */
  async fillStreet(street) {
    await this.clearAndFill(this.loc.streetInput, street);
  }

  /** Fill the city field. */
  async fillCity(city) {
    await this.clearAndFill(this.loc.cityInput, city);
  }

  /** Fill the ZIP code field. */
  async fillZip(zip) {
    await this.clearAndFill(this.loc.zipInput, zip);
  }

  /**
   * Fill the country input and wait for the state field to update.
   * If country = 'US', waits for the state SELECT to appear.
   * Otherwise, waits for the state INPUT (disabled) to appear.
   */
  async fillCountry(country) {
    await this.clearAndFill(this.loc.countryInput, country);
    if (country === 'US') {
      await this.waitForVisible(this.loc.stateSelect);
    } else {
      await this.waitForVisible(this.loc.stateInput);
    }
  }

  /**
   * Select a US state from the dropdown.
   * Precondition: country must be 'US'.
   */
  async selectState(state) {
    await this.waitForVisible(this.loc.stateSelect);
    await this.selectByValue(this.loc.stateSelect, state);
  }

  /** Select account status. */
  async selectAccountStatus(status) {
    await this.selectByValue(this.loc.accountStatusSelect, status);
  }

  /** Select contact preference. */
  async selectContactPreference(pref) {
    await this.selectByValue(this.loc.contactPrefSelect, pref);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Full-form fill helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Fill all required fields for a Consumer customer.
   * @param {{ name, email, phone?, street?, city?, zip?, country?, state? }} data
   */
  async fillConsumerCustomer({ name, email, phone = '', street = '', city = '', zip = '', country = 'UK' }) {
    await this.fillName(name);
    await this.selectType('Consumer');
    await this.fillEmail(email);
    if (phone)   await this.fillPhone(phone);
    if (street)  await this.fillStreet(street);
    if (city)    await this.fillCity(city);
    if (zip)     await this.fillZip(zip);
    if (country) await this.fillCountry(country);
  }

  /**
   * Fill all required fields for an SMB customer.
   * @param {{ name, email, companyName, phone?, street?, city?, zip?, country?, state? }} data
   */
  async fillSMBCustomer({ name, email, companyName, phone = '', street = '', city = '', zip = '', country = 'UK' }) {
    await this.fillName(name);
    await this.selectType('SMB');
    await this.fillCompanyName(companyName);
    await this.fillEmail(email);
    if (phone)   await this.fillPhone(phone);
    if (street)  await this.fillStreet(street);
    if (city)    await this.fillCity(city);
    if (zip)     await this.fillZip(zip);
    if (country) await this.fillCountry(country);
  }

  /**
   * Fill all required fields for an Enterprise customer.
   * @param {{ name, email, companyName, phone?, street?, city?, zip?, country?, state? }} data
   */
  async fillEnterpriseCustomer({ name, email, companyName, phone = '', street = '', city = '', zip = '', country = 'UK' }) {
    await this.fillName(name);
    await this.selectType('Enterprise');
    await this.fillCompanyName(companyName);
    await this.fillEmail(email);
    if (phone)   await this.fillPhone(phone);
    if (street)  await this.fillStreet(street);
    if (city)    await this.fillCity(city);
    if (zip)     await this.fillZip(zip);
    if (country) await this.fillCountry(country);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Submit
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Submit the form and wait for the customer list to reappear.
   * On success the form closes and the list re-renders.
   */
  async submitForm() {
    await this.clickWhenReady(this.loc.submitBtn);
    await this.waitForVisible(this.loc.customerListContainer);
  }

  /**
   * Submit the form expecting a validation error.
   * The form should remain visible.
   */
  async submitFormExpectError() {
    await this.clickWhenReady(this.loc.submitBtn);
    await this.waitForVisible(this.loc.formError);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Delete
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Delete a customer by id.
   * Clicks Delete → waits for modal → clicks Confirm → waits for list reload.
   */
  async deleteCustomer(id) {
    await this.clickWhenReady(this.loc.deleteCustomerBtn(id));
    await this.waitForVisible(this.modal.openOverlay);
    await this.clickWhenReady(this.modal.confirmBtn);
    await this.waitForHidden(this.modal.overlay);
    await this.waitForVisible(this.loc.customerListContainer);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Search
  // ══════════════════════════════════════════════════════════════════════════

  /** Type in the search box and wait for the table to update. */
  async search(term) {
    await this.clearAndFill(this.loc.searchInput, term);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Expand / collapse rows
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Expand a customer row to reveal the order detail table.
   * @param {number|string} id
   */
  async expandRow(id) {
    await this.clickWhenReady(this.loc.expandRowBtn(id));
    await this.waitForVisible(this.loc.detailRow(id));
  }

  /**
   * Collapse an already-expanded customer row.
   * @param {number|string} id
   */
  async collapseRow(id) {
    await this.clickWhenReady(this.loc.expandRowBtn(id));
    await this.waitForHidden(this.loc.detailRow(id));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Read helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** Get the row count of customers currently visible in the table. */
  async getRowCount() {
    return this.loc.customerTableRows.count();
  }

  /** Get the text of the form heading (Create Customer / Edit Customer). */
  async getFormHeading() {
    return this.getText(this.loc.formHeading);
  }

  /** Read the form error message. */
  async getFormError() {
    return this.getText(this.loc.formError);
  }

  /**
   * Read the text of the state label.
   * Returns the label text (e.g. 'State' or 'State *').
   */
  async getStateLabelText() {
    return this.getText(this.loc.stateLabel);
  }

  /**
   * Check whether the state SELECT is visible (US country selected).
   */
  async isStateSelectVisible() {
    return this.isVisible(this.loc.stateSelect);
  }

  /**
   * Check whether the state INPUT (disabled) is visible (non-US country).
   */
  async isStateInputVisible() {
    return this.isVisible(this.loc.stateInput);
  }

  /**
   * Check whether the state INPUT is disabled.
   */
  async isStateInputDisabled() {
    return this.loc.stateInput.isDisabled().catch(() => false);
  }

  /** Check whether the company name field is visible. */
  async isCompanyNameVisible() {
    return this.isVisible(this.loc.companyNameInput);
  }
}
