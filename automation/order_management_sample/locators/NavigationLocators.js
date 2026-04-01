export class NavigationLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Navigation Menu Items (TestId)
  // ══════════════════════════════════════════════════════════════════════════

  get navDashboard() { return this.page.getByTestId('nav-dashboard'); }
  get navCustomers() { return this.page.getByTestId('nav-customers'); }
  get navProducts()  { return this.page.getByTestId('nav-products'); }
  get navOrders()    { return this.page.getByTestId('nav-orders'); }
  get sidebarClose() { return this.page.getByTestId('sidebar-close'); }

  // ══════════════════════════════════════════════════════════════════════════
  // Navigation Menu Items (IDs)
  // ══════════════════════════════════════════════════════════════════════════

  get navDashboardId() { return this.page.locator('#nav-dashboard'); }
  get navCustomersId() { return this.page.locator('#nav-customers'); }
  get navProductsId()  { return this.page.locator('#nav-products'); }
  get navOrdersId()    { return this.page.locator('#nav-orders'); }

  // ══════════════════════════════════════════════════════════════════════════
  // Advanced XPaths (Structural & State)
  // ══════════════════════════════════════════════════════════════════════════

  /** Compound: Table rows containing specific navigation items */
  get navTableRows() {
    return this.page.locator('xpath=//table[@id="nav-table"]//tbody//tr[@data-nav-item]');
  }

  /** Following-sibling: Control immediately following the nav label */
  navControlAfterLabel(label) {
    return this.page.locator(`xpath=//label[normalize-space(text())="${label}"]/following-sibling::*[1]`);
  }

  /** Ancestor: Find the container card of a specific navigation button */
  navContainer(testid) {
    return this.page.locator(`xpath=//button[@data-testid="${testid}"]/ancestor::div[contains(@class,"nav-card")]`);
  }

  /** Parent: Nav item wrapper inside a sidebar section */
  navParentWrapper(testid) {
    return this.page.locator(`xpath=//button[@data-testid="${testid}"]/parent::div[contains(@class,"sidebar-item-wrapper")]`);
  }

  /** Contains: Active badge indicator on nav links */
  get activeNavLinkBadge() {
    return this.page.locator('xpath=//span[contains(@class,"status-badge-active")]');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dynamic Nav items (requires identifier)
  // ══════════════════════════════════════════════════════════════════════════

  navItemById(id) {
    return this.page.locator(`xpath=//button[@id="${id}"]`);
  }

  navItemByTestId(testid) {
    return this.page.getByTestId(testid);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Shortcuts
  // ══════════════════════════════════════════════════════════════════════════

  get firstNavLink() {
    return this.page.locator('[data-testid^="nav-"]').first();
  }

  get lastNavLink() {
    return this.page.locator('[data-testid^="nav-"]').last();
  }
}
