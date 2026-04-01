/**
 * DashboardPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for the Dashboard module.
 *
 * ❌ REMOVED  : waitForLoadState('networkidle'), hardcoded delays
 * ✅ REPLACED :
 *   • After delete   → waitForDetached(rowLocator)
 *   • All waits use explicit locator-based strategies
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BasePage } from './BasePage.js';
import { DashboardLocators } from '../locators/DashboardLocators.js';
import { NavigationLocators } from '../locators/NavigationLocators.js';
import { ModalLocators } from '../locators/ModalLocators.js';

export class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    this.navLoc = new NavigationLocators(page);
    this.loc    = new DashboardLocators(page);
    this.modal  = new ModalLocators(page);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  async navigateToDashboards() {
    await this.goto();
    // Explicit wait: nav button must be visible before clicking
    await this.waitForVisible(this.navLoc.dashboardBtn);
    await this.navLoc.dashboardBtn.click();
    // Explicit wait: dashboard container must appear after navigation
    await this.waitForVisible(this.loc.dashboardContainer);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Form Actions
  // ──────────────────────────────────────────────────────────────────────────

  async openCreateForm() {
    // Explicit wait: create button must be enabled before clicking
    const createBtn = this.loc.cardElement('create', '//button[contains(@data-testid,"create")]');
    await this.waitForEnabled(createBtn);
    await createBtn.click();
    // Explicit wait: form must appear in DOM and be visible
    const form = this.loc.cardElement('form', '');
    await this.waitForVisible(form);
  }

  async openEditForm(id) {
    const editBtn = this.loc.cardElement(`${id}`, '//button[contains(@data-testid,"edit")]');
    // Explicit wait: specific edit button must be visible
    await this.waitForVisible(editBtn);
    await editBtn.click();
    // Explicit wait: form must appear
    const form = this.loc.cardElement('form', '');
    await this.waitForVisible(form);
  }

  /**
   * Fill dashboard form fields.
   * Only fills fields if data.field !== undefined.
   * @param {Object} data
   */
  async fillDashboardForm(data) {
    if (data.name        !== undefined) await this.fillName(data.name);
    if (data.email       !== undefined) await this.fillEmail(data.email);
    if (data.title       !== undefined) await this.fillTitle(data.title);
    if (data.description !== undefined) await this.fillDescription(data.description);
    if (data.status      !== undefined) await this.fillStatus(data.status);
    if (data.category    !== undefined) await this.fillCategory(data.category);
    if (data.value       !== undefined) await this.fillValue(data.value);
    if (data.label       !== undefined) await this.fillLabel(data.label);
  }

  /**
   * Submit the dashboard form.
   * ✅ Explicit wait: form disappears on success, then list container re-appears.
   */
  async submitForm() {
    const submitBtn = this.loc.cardElement('submit', '//button[@type="submit"]');
    await this.waitForEnabled(submitBtn);
    await submitBtn.click();
    // Explicit wait: form disappears on success
    const form = this.loc.cardElement('form', '');
    await this.waitForHidden(form);
    // Explicit wait: dashboard container must re-render
    await this.waitForVisible(this.loc.dashboardContainer);
  }

  /**
   * Cancel the dashboard form.
   * ✅ Explicit wait: form disappears after cancel.
   */
  async cancelForm() {
    const cancelBtn = this.loc.cardElement('cancel', '//button[contains(@data-testid,"cancel")]');
    await cancelBtn.click();
    const form = this.loc.cardElement('form', '');
    await this.waitForHidden(form);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CRUD helpers
  // ──────────────────────────────────────────────────────────────────────────

  async createDashboard(data) {
    await this.openCreateForm();
    await this.fillDashboardForm(data);
    await this.submitForm();
  }

  /**
   * Delete a dashboard by ID and wait for its row to disappear.
   * ✅ Explicit wait: row must detach from DOM — no networkidle needed.
   * @param {string|number} id
   */
  async deleteDashboard(id) {
    const row = this.page.locator(`[data-testid="dashboard-card-${id}"]`);
    await this.waitForVisible(row);

    const deleteBtn = this.loc.cardElement(`${id}`, '//button[contains(@data-testid,"delete")]');
    await this.clickWhenReady(deleteBtn);

    // Explicit wait: modal overlay must appear
    await this.waitForVisible(this.modal.openOverlay);
    // Click confirm button
    await this.clickWhenReady(this.modal.confirmBtn);
    // Explicit wait: row detaches from DOM when deletion is complete
    await this.waitForDetached(row);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Query helpers
  // ──────────────────────────────────────────────────────────────────────────

  async getRowCount() {
    return await this.loc.allCards.count();
  }

  async isFormErrorVisible() {
    const errorLoc = this.loc.cardElement('form-error', '//div[contains(@class,"form-error") or contains(@data-testid,"form-error")]');
    return await this.isVisible(errorLoc);
  }

  async getFormErrorText() {
    const errorLoc = this.loc.cardElement('form-error', '//div[contains(@class,"form-error") or contains(@data-testid,"form-error")]');
    return await this.getText(errorLoc);
  }

  /**
   * Submit form and wait for error to appear — used for negative/error tests.
   */
  async submitFormExpectError() {
    const submitBtn = this.loc.cardElement('submit', '//button[@type="submit"]');
    await this.waitForEnabled(submitBtn);
    await submitBtn.click();
    const errorLoc = this.loc.cardElement('form-error', '//div[contains(@class,"form-error") or contains(@data-testid,"form-error")]');
    await this.waitForVisible(errorLoc);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Dashboard card value readers
  // ──────────────────────────────────────────────────────────────────────────

  async getCustomersValue() {
    return await this.getIntText(this.loc.cardCustomers);
  }

  async getOrdersValue() {
    return await this.getIntText(this.loc.cardOrders);
  }

  async getRevenueValue() {
    return await this.getNumericText(this.loc.cardRevenue);
  }

  async getLowStockValue() {
    return await this.getIntText(this.loc.cardLowStock);
  }

  async getRevenueTitleText() {
    return await this.getText(this.loc.revenueTitle);
  }

  async getCardValueByLabel(label) {
    return await this.getText(this.loc.cardValueByLabel(label));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Card visibility helpers
  // ──────────────────────────────────────────────────────────────────────────

  async isCustomersCardVisible() {
    return await this.isVisible(this.loc.cardCustomers);
  }

  async isOrdersCardVisible() {
    return await this.isVisible(this.loc.cardOrders);
  }

  async isRevenueCardVisible() {
    return await this.isVisible(this.loc.cardRevenue);
  }

  async isLowStockCardVisible() {
    return await this.isVisible(this.loc.cardLowStock);
  }

  async waitForDashboardCards() {
    await this.waitForVisible(this.loc.cardCustomers);
    await this.waitForVisible(this.loc.cardOrders);
    await this.waitForVisible(this.loc.cardRevenue);
    await this.waitForVisible(this.loc.cardLowStock);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Granular field-fill helpers
  // ──────────────────────────────────────────────────────────────────────────

  async fillName(value) {
    const loc = this.page.getByTestId('dashboard-form-name').or(
      this.page.locator('xpath=//input[@name="name" or @data-testid="form-name"]')
    );
    await this.clearAndFill(loc, value);
  }

  async fillEmail(value) {
    const loc = this.page.getByTestId('dashboard-form-email').or(
      this.page.locator('xpath=//input[@name="email" or @data-testid="form-email"]')
    );
    await this.clearAndFill(loc, value);
  }

  async fillTitle(value) {
    const loc = this.page.getByTestId('dashboard-form-title').or(
      this.page.locator('xpath=//input[@name="title" or @data-testid="form-title"]')
    );
    await this.clearAndFill(loc, value);
  }

  async fillDescription(value) {
    const loc = this.page.getByTestId('dashboard-form-description').or(
      this.page.locator('xpath=//textarea[@name="description" or @data-testid="form-description"]')
    );
    await this.clearAndFill(loc, value);
  }

  async fillStatus(value) {
    const loc = this.page.getByTestId('dashboard-form-status').or(
      this.page.locator('xpath=//select[@name="status" or @data-testid="form-status"]')
    );
    await this.selectByValue(loc, value);
  }

  async fillCategory(value) {
    const loc = this.page.getByTestId('dashboard-form-category').or(
      this.page.locator('xpath=//input[@name="category" or @data-testid="form-category"]')
    );
    await this.clearAndFill(loc, value);
  }

  async fillValue(value) {
    const loc = this.page.getByTestId('dashboard-form-value').or(
      this.page.locator('xpath=//input[@name="value" or @data-testid="form-value"]')
    );
    await this.clearAndFill(loc, value);
  }

  async fillLabel(value) {
    const loc = this.page.getByTestId('dashboard-form-label').or(
      this.page.locator('xpath=//input[@name="label" or @data-testid="form-label"]')
    );
    await this.clearAndFill(loc, value);
  }
}
