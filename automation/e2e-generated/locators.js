/**
 * locators.js — barrel re-export
 * ─────────────────────────────────────────────────────────────────────────────
 * Convenience re-export of all locator classes.
 * Prefer importing directly from the individual files under locators/:
 *   import { CustomerLocators } from './locators/CustomerLocators.js';
 * ─────────────────────────────────────────────────────────────────────────────
 */

export { NavigationLocators } from './locators/NavigationLocators.js';
export { DashboardLocators }  from './locators/DashboardLocators.js';
export { CustomerLocators }   from './locators/CustomerLocators.js';
export { ProductLocators }    from './locators/ProductLocators.js';
export { OrderLocators }      from './locators/OrderLocators.js';
export { ModalLocators }      from './locators/ModalLocators.js';
