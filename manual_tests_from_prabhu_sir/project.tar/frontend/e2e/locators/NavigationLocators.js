/**
 * NavigationLocators.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Locators for the top navigation bar.
 *
 * XPath Strategies used:
 *  • data-testid attributes (primary)
 *  • Compound XPath: //nav//button[contains(@class,'active')]
 *  • ancestor::  //button[@id='nav-dashboard']/ancestor::nav
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class NavigationLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ── Nav bar container ──────────────────────────────────────────────────────
  get navBar() {
    return this.page.locator('nav.navigation');
  }

  get appTitle() {
    // XPath: compound — title is an h1 inside nav.navigation
    return this.page.locator('xpath=//nav[contains(@class,"navigation")]//h1');
  }

  // ── Nav buttons (data-testid primary) ─────────────────────────────────────
  get dashboardBtn() { return this.page.getByTestId('nav-dashboard'); }
  get customersBtn()  { return this.page.getByTestId('nav-customers'); }
  get productsBtn()   { return this.page.getByTestId('nav-products'); }
  get ordersBtn()     { return this.page.getByTestId('nav-orders'); }

  // ── Active-state locators (XPath contains) ────────────────────────────────
  /**
   * Returns the currently-active nav button using XPath contains(@class,'active').
   */
  get activeNavBtn() {
    return this.page.locator('xpath=//nav[contains(@class,"navigation")]//button[contains(@class,"active")]');
  }

  /**
   * Returns a nav button by its visible label text using XPath text search.
   * @param {'Dashboard'|'Customers'|'Products'|'Orders'} label
   */
  navBtnByLabel(label) {
    return this.page.locator(`xpath=//nav[contains(@class,"navigation")]//button[normalize-space(text())="${label}"]`);
  }
}
