export class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.page.on('dialog', dialog => this.dialogHandler && this.dialogHandler(dialog));
  }

  async goto(path = '') {
    await this.page.goto(path);
  }

  // Waits
  async waitForVisible(loc) { if (!loc) throw new Error("waitForVisible: Locator is undefined!"); await loc.waitFor({ state: 'visible' }); }
  async waitForHidden(loc) { if (!loc) throw new Error("waitForHidden: Locator is undefined!"); await loc.waitFor({ state: 'hidden' }); }
  async waitForAttached(loc) { if (!loc) throw new Error("waitForAttached: Locator is undefined!"); await loc.waitFor({ state: 'attached' }); }
  async waitForDetached(loc) { if (!loc) throw new Error("waitForDetached: Locator is undefined!"); await loc.waitFor({ state: 'detached' }); }
  async waitForEnabled(loc) { if (!loc) throw new Error("waitForEnabled: Locator is undefined!"); await loc.waitFor({ state: 'visible' }); }
  async waitForCount(loc, n) { if (!loc) throw new Error("waitForCount: Locator is undefined!"); await this.page.waitForFunction(([l, x]) => document.querySelectorAll(l).length === x, [loc._selector, n]); }
  async waitForText(loc, text) { if (!loc) throw new Error("waitForText: Locator is undefined!"); await loc.filter({ hasText: text }).waitFor(); }
  async waitForTextContaining(loc, sub) { if (!loc) throw new Error("waitForTextContaining: Locator is undefined!"); await loc.filter({ hasText: sub }).waitFor(); }

  // Booleans
  async isVisible(loc) { if (!loc) throw new Error("isVisible: Locator is undefined!"); return await loc.isVisible(); }
  async isEnabled(loc) { if (!loc) throw new Error("isEnabled: Locator is undefined!"); return await loc.isEnabled(); }
  async isDisabled(loc) { if (!loc) throw new Error("isDisabled: Locator is undefined!"); return await loc.isDisabled(); }

  // DOM
  async getText(loc) { if (!loc) throw new Error("getText: Locator is undefined!"); return await loc.innerText(); }
  async clearAndFill(loc, value) { if (!loc) throw new Error("clearAndFill: Locator is undefined!"); await loc.fill(''); await loc.fill(value); }
  async selectByText(loc, text) { if (!loc) throw new Error("selectByText: Locator is undefined!"); await loc.selectOption({ label: text }); }
  async selectByValue(loc, value) { if (!loc) throw new Error("selectByValue: Locator is undefined!"); await loc.selectOption({ value: value }); }
  async clickWhenReady(loc) { if (!loc) throw new Error("clickWhenReady: Locator is undefined!"); await loc.waitFor({ state: 'visible' }); await loc.click(); }
  async scrollTo(loc) { if (!loc) throw new Error("scrollTo: Locator is undefined!"); await loc.scrollIntoViewIfNeeded(); }

  // Numbers
  async getNumericText(loc) { const t = await this.getText(loc); return parseFloat(t.replace(/[^0-9.-]+/g, '')); }
  async getIntText(loc) { const t = await this.getText(loc); return parseInt(t.replace(/[^0-9-]+/g, ''), 10); }

  // Dialogs
  async acceptDialog() { this.dialogHandler = async d => await d.accept(); }
  async dismissDialog() { this.dialogHandler = async d => await d.dismiss(); }
}
