export class OrderLocators {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dashboard
  // ══════════════════════════════════════════════════════════════════════════

  get orderTotal() { return this.page.getByTestId('order-total'); }
  get orderStatusRow() { return this.page.getByTestId('order-status-row'); }

  orderCount(status) { return this.page.getByTestId(`order-count-${status.toLowerCase()}`); }

  // ══════════════════════════════════════════════════════════════════════════
  // Order Form
  // ══════════════════════════════════════════════════════════════════════════

  get orderWizard() { return this.page.getByTestId('order-wizard'); }
  get orderCustomerReadonly() { return this.page.getByTestId('order-customer-readonly'); }
  get orderCustomerSelect() { return this.page.getByTestId('order-customer-select'); }
  get orderStatusSelect() { return this.page.getByTestId('order-status-select'); }
  get orderPrioritySelect() { return this.page.getByTestId('order-priority-select'); }
  get orderDiscountInput() { return this.page.getByTestId('order-discount-input'); }
  get orderNotesInput() { return this.page.getByTestId('order-notes-input'); }
  get orderTotalSummary() { return this.page.getByTestId('order-total-summary'); }
  get orderSubtotal() { return this.page.getByTestId('order-subtotal'); }
  get orderDiscountAmount() { return this.page.getByTestId('order-discount-amount'); }
  get orderProductsReadonly() { return this.page.getByTestId('order-products-readonly'); }
  get cancelOrderBtn() { return this.page.getByTestId('cancel-order-btn'); }

  get orderFormError() { return this.page.locator('#order-form-error'); }
  get orderCustomer() { return this.page.locator('#order-customer'); }
  get orderStatus() { return this.page.locator('#order-status'); }
  get orderPriority() { return this.page.locator('#order-priority'); }
  get orderDiscount() { return this.page.locator('#order-discount'); }
  get orderNotes() { return this.page.locator('#order-notes'); }
  get orderProductsSection() { return this.page.locator('#order-products-section'); }
  get submitOrderBtn() { return this.page.locator('#submit-order-btn'); }
  get cancelOrderBtnById() { return this.page.locator('#cancel-order-btn'); }

  // ══════════════════════════════════════════════════════════════════════════
  // Order List
  // ══════════════════════════════════════════════════════════════════════════

  get orderList() { return this.page.getByTestId('order-list'); }
  get createOrderBtn() { return this.page.getByTestId('create-order-btn'); }
  get orderListError() { return this.page.locator('#order-list-error'); }
  get createOrderBtnById() { return this.page.locator('#create-order-btn'); }
  get ordersTable() { return this.page.locator('#orders-table'); }

  // ══════════════════════════════════════════════════════════════════════════
  // Dynamic Selectors
  // ══════════════════════════════════════════════════════════════════════════

  orderProduct(index) { return this.page.getByTestId(`order-product-${index}`); }
  orderSeats(index) { return this.page.getByTestId(`order-seats-${index}`); }
  orderId(id) { return this.page.getByTestId(`order-id-${id}`); }
  orderCustomerById(id) { return this.page.getByTestId(`order-customer-${id}`); }
  orderCustomerType(id) { return this.page.getByTestId(`order-customer-type-${id}`); }
  orderDate(id) { return this.page.getByTestId(`order-date-${id}`); }
  orderStatusById(id) { return this.page.getByTestId(`order-status-${id}`); }
  orderPriorityById(id) { return this.page.getByTestId(`order-priority-${id}`); }
  orderTotalById(id) { return this.page.getByTestId(`order-total-${id}`); }
  orderDiscountById(id) { return this.page.getByTestId(`order-discount-${id}`); }
  orderDiscountedTotal(id) { return this.page.getByTestId(`order-discounted-total-${id}`); }
  editOrderBtn(id) { return this.page.getByTestId(`edit-order-${id}`); }
  deleteOrderBtn(id) { return this.page.getByTestId(`delete-order-${id}`); }

  // ══════════════════════════════════════════════════════════════════════════
  // Advanced XPaths
  // ══════════════════════════════════════════════════════════════════════════

  /** Compound: table rows within orders table tbody */
  get allOrderRows() { return this.page.locator('xpath=//table[@id="orders-table"]//tbody//tr[contains(@data-testid, "order-id-")]'); }

  /** following-sibling: Get status select after its label */
  get statusSelectAfterLabel() { return this.page.locator('xpath=//label[normalize-space(text())="Status"]/following-sibling::select[1]'); }

  /** ancestor: Get submit button container */
  get submitBtnParent() { return this.page.locator('xpath=//button[@id="submit-order-btn"]/parent::div'); }

  /** ancestor: Get edit button based on specific order id cell */
  editBtnViaAncestor(id) { return this.page.locator(`xpath=//td[@data-testid="order-id-${id}"]/ancestor::tr//button[contains(@data-testid, "edit-order-")]`); }

  /** contains: Status badge inside a specific order row */
  orderStatusBadge(id) { return this.page.locator(`xpath=//tr[.//td[@data-testid="order-id-${id}"]]//span[contains(@class, "status-badge")]`); }

  // ══════════════════════════════════════════════════════════════════════════
  // Shortcuts
  // ══════════════════════════════════════════════════════════════════════════

  get firstOrderDeleteBtn() { return this.page.locator('[data-testid^="delete-order-"]').first(); }
  get firstOrderEditBtn() { return this.page.locator('[data-testid^="edit-order-"]').first(); }
}
