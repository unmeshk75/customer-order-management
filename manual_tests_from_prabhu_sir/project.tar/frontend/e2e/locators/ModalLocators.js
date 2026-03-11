/**
 * ModalLocators.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Selectors for the confirmation Modal component.
 *
 * XPath Strategies demonstrated:
 *  • data-testid (primary)
 *  • Compound XPath: //div[@data-modal='confirm-delete-customer']//button[@data-testid='modal-confirm']
 *  • contains():     //div[contains(@class,'modal-overlay') and contains(@class,'modal-open')]
 *  • parent:         //h3[@data-testid='modal-title']/parent::div[contains(@class,'modal-header')]
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class ModalLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ── Overlay ───────────────────────────────────────────────────────────────
  get overlay() { return this.page.getByTestId('modal-overlay'); }

  /** Open overlay — contains() class check */
  get openOverlay() {
    return this.page.locator(
      'xpath=//div[contains(@class,"modal-overlay") and contains(@class,"modal-open")]'
    );
  }

  // ── Dialog ────────────────────────────────────────────────────────────────
  get dialog()       { return this.page.getByTestId('modal-dialog'); }
  get title()        { return this.page.getByTestId('modal-title'); }
  get message()      { return this.page.getByTestId('modal-message'); }
  get confirmBtn()   { return this.page.getByTestId('modal-confirm'); }
  get cancelBtn()    { return this.page.getByTestId('modal-cancel'); }

  /** Modal header container via parent XPath */
  get modalHeader() {
    return this.page.locator(
      'xpath=//h3[@data-testid="modal-title"]/parent::div[contains(@class,"modal-header")]'
    );
  }

  /**
   * Confirm button scoped inside a modal with a specific data-modal type.
   * XPath compound — scoped to modal type.
   */
  confirmBtnInModal(modalType) {
    return this.page.locator(
      `xpath=//div[@data-testid="modal-dialog" and @data-modal="${modalType}"]` +
      `//button[@data-testid="modal-confirm"]`
    );
  }
}
