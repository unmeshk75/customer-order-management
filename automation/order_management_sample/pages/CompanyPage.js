/**
 * CompanyPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for the Company module.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BasePage } from './BasePage.js';
import { CompanyLocators } from '../locators/CompanyLocators.js';
import { NavigationLocators } from '../locators/NavigationLocators.js';
import { ModalLocators } from '../locators/ModalLocators.js';

export class CompanyPage extends BasePage {
  constructor(page) {
    super(page);
    this.navLoc = new NavigationLocators(page);
    this.loc = new CompanyLocators(page);
    this.modal = new ModalLocators(page);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  async navigateToCompanys() {
    await this.goto();
    await this.waitForVisible(this.navLoc.customersBtn);
    await this.navLoc.customersBtn.click();
    await this.waitForVisible(this.loc.companyTable);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Form Actions
  // ──────────────────────────────────────────────────────────────────────────

  async openCreateForm() {
    await this.waitForEnabled(this.loc.saveBtn);
    await this.loc.saveBtn.click();
    await this.waitForVisible(this.loc.companyForm);
  }

  async openEditForm(id) {
    const editBtn = this.loc.editCompanyBtn(id);
    await this.waitForVisible(editBtn);
    await editBtn.click();
    await this.waitForVisible(this.loc.companyForm);
  }

  async fillCompanyForm(data) {
    if (data.name !== undefined) {
      await this.clearAndFill(this.loc.companyNameInput, data.name);
    }
  }

  async submitForm() {
    await this.waitForEnabled(this.loc.saveBtn);
    await this.loc.saveBtn.click();
    await this.waitForHidden(this.loc.companyForm);
    await this.waitForVisible(this.loc.companyTable);
  }

  async cancelForm() {
    const cancelBtn = this.page.locator('[data-testid="cancel-company-btn"]');
    await cancelBtn.click();
    await this.waitForHidden(this.loc.companyForm);
  }

  async submitFormExpectError() {
    await this.waitForEnabled(this.loc.saveBtn);
    await this.loc.saveBtn.click();
    const formError = this.page.locator('[data-testid="form-error"], .form-error, .error-message');
    await this.waitForVisible(formError);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CRUD helpers
  // ──────────────────────────────────────────────────────────────────────────

  async createCompany(data) {
    await this.openCreateForm();
    await this.fillCompanyForm(data);
    await this.submitForm();
  }

  async deleteCompany(id) {
    const row = this.loc.companyRow(id);
    await this.waitForVisible(row);
    const deleteBtn = this.loc.deleteCompanyBtnViaAncestor(id);
    await this.clickWhenReady(deleteBtn);
    await this.waitForVisible(this.modal.openOverlay);
    await this.clickWhenReady(this.modal.confirmBtn);
    await this.waitForDetached(row);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Query helpers
  // ──────────────────────────────────────────────────────────────────────────

  async getRowCount() {
    return await this.loc.companyTableRows.count();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Granular field-fill helpers
  // ──────────────────────────────────────────────────────────────────────────

  async fillName(value) {
    await this.clearAndFill(this.loc.companyNameInput, value);
  }
}
