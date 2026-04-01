export class DashboardLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dashboard Cards
  // ══════════════════════════════════════════════════════════════════════════

  get dashboardContainer() { return this.page.getByTestId('dashboard'); }
  get cardCustomers()      { return this.page.getByTestId('dashboard-card-customers'); }
  get cardOrders()         { return this.page.getByTestId('dashboard-card-orders'); }
  get cardRevenue()        { return this.page.getByTestId('dashboard-card-revenue'); }
  get cardLowStock()       { return this.page.getByTestId('dashboard-card-lowstock'); }

  // ══════════════════════════════════════════════════════════════════════════
  // Complex XPath Locators
  // ══════════════════════════════════════════════════════════════════════════

  /** Compound: Targets a card title within the revenue card container */
  get revenueTitle() {
    return this.page.locator('xpath=//div[@data-testid="dashboard-card-revenue"]//div[contains(@class,"card-header")]//h2');
  }

  /** Following-sibling: Targets the value container immediately after the card label */
  cardValueByLabel(label) {
    return this.page.locator(`xpath=//span[normalize-space(text())="${label}"]/following-sibling::div[contains(@class,"card-value")]`);
  }

  /** Ancestor: Targets the specific card container from an internal action button */
  cardParentFromButton(btnTestId) {
    return this.page.locator(`xpath=//button[@data-testid="${btnTestId}"]/ancestor::div[contains(@data-testid,"dashboard-card-")]`);
  }

  /** Parent: Targets the wrapper of the card if it has an active class */
  get activeCardContainer() {
    return this.page.locator('xpath=//div[contains(@class,"status-active")]/parent::div[@data-testid="dashboard"]');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dynamic Helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** Generic helper for card specific elements */
  cardElement(cardId, selector) {
    return this.page.locator(`xpath=//div[@data-testid="dashboard-card-${cardId}"]${selector}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Shortcuts
  // ══════════════════════════════════════════════════════════════════════════

  get firstCard() {
    return this.page.locator('[data-testid^="dashboard-card-"]').first();
  }

  get allCards() {
    return this.page.locator('[data-testid^="dashboard-card-"]');
  }
}
