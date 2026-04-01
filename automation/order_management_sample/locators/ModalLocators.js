/**
 * ModalLocators.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Locators for the Modal UI component.
 *
 * XPath Patterns included:
 *  • Compound:         //div[@data-testid="modal-dialog"]//div[contains(@class,"footer")]
 *  • following-sibling: //h3[@data-testid="modal-title"]/following-sibling::p
 *  • ancestor:          //button[@data-testid="modal-confirm"]/ancestor::div[contains(@class,"modal")]
 *  • parent:            //p[@data-testid="modal-message"]/parent::div
 *  • contains():        //div[contains(@class,"modal-overlay-active")]
 *  • normalize-space(): //h3[normalize-space(text())="Confirm Action"]
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class ModalLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Modal Core
  // ══════════════════════════════════════════════════════════════════════════

  get overlay() { return this.page.getByTestId('modal-overlay'); }
  get dialog()  { return this.page.getByTestId('modal-dialog'); }
  get title()   { return this.page.getByTestId('modal-title'); }
  get message() { return this.page.getByTestId('modal-message'); }
  get confirm() { return this.page.getByTestId('modal-confirm'); }
  get cancel()  { return this.page.getByTestId('modal-cancel'); }

  // ══════════════════════════════════════════════════════════════════════════
  // XPath Custom Patterns
  // ══════════════════════════════════════════════════════════════════════════

  /** Compound pattern: footer elements within the modal */
  get modalFooter() {
    return this.page.locator('xpath=//div[@data-testid="modal-dialog"]//div[contains(@class,"footer")]');
  }

  /** Following-sibling pattern: paragraph content after the title */
  get titleSiblingMessage() {
    return this.page.locator('xpath=//h3[@data-testid="modal-title"]/following-sibling::p');
  }

  /** Ancestor pattern: container of the confirm button */
  get confirmButtonAncestor() {
    return this.page.locator('xpath=//button[@data-testid="modal-confirm"]/ancestor::div[contains(@class,"modal")]');
  }

  /** Parent pattern: div wrapping the message content */
  get messageParent() {
    return this.page.locator('xpath=//p[@data-testid="modal-message"]/parent::div');
  }

  /** Contains pattern: active overlay specifically */
  get activeOverlay() {
    return this.page.locator('xpath=//div[contains(@class,"modal-overlay-active")]');
  }

  /** Normalize-space pattern: specific title match */
  get confirmTitle() {
    return this.page.locator('xpath=//h3[normalize-space(text())="Confirm Action"]');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dynamic Locators (Requires ID)
  // ══════════════════════════════════════════════════════════════════════════

  modalActionBtn(actionType) {
    return this.page.locator(`xpath=//div[@data-testid="modal-dialog"]//button[@data-action="${actionType}"]`);
  }

  modalSection(sectionId) {
    return this.page.locator(`xpath=//section[@id="${sectionId}"]`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Shortcuts
  // ══════════════════════════════════════════════════════════════════════════

  get firstButton() { return this.page.locator('[data-testid^="modal-"]').locator('button').first(); }
}
