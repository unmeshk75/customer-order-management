/**
 * TestDataFactory.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates unique, test-specific data for Playwright tests.
 * Uses timestamps to prevent data collisions across parallel / repeated runs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class TestDataFactory {

  /**
   * Returns a short timestamp suffix (e.g. "1748523451234")
   * to make test data unique per run.
   */
  static ts() {
    return Date.now();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Customer data
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Minimal Consumer customer — no company name required.
   */
  static consumerCustomer(suffix = TestDataFactory.ts()) {
    return {
      name:    `Consumer User ${suffix}`,
      email:   `consumer.${suffix}@test.com`,
      phone:   '+1-555-000-0001',
      country: 'UK',
      city:    'London',
      zip:     'EC1A 1BB',
    };
  }

  /**
   * SMB customer — company name required.
   */
  static smbCustomer(suffix = TestDataFactory.ts()) {
    return {
      name:        `SMB User ${suffix}`,
      email:       `smb.${suffix}@test.com`,
      phone:       '+1-555-000-0002',
      companyName: `SMB Corp ${suffix}`,
      country:     'UK',
      city:        'Manchester',
      zip:         'M1 1AD',
    };
  }

  /**
   * Enterprise customer — company name required.
   */
  static enterpriseCustomer(suffix = TestDataFactory.ts()) {
    return {
      name:        `Enterprise User ${suffix}`,
      email:       `enterprise.${suffix}@test.com`,
      phone:       '+1-555-000-0003',
      companyName: `Enterprise Inc ${suffix}`,
      country:     'UK',
      city:        'Birmingham',
      zip:         'B1 1BB',
    };
  }

  /**
   * US-based customer — triggers the state dropdown.
   */
  static usCustomer(suffix = TestDataFactory.ts()) {
    return {
      name:    `US User ${suffix}`,
      email:   `us.${suffix}@test.com`,
      phone:   '+1-555-000-0004',
      country: 'US',
      state:   'CA',
      city:    'Los Angeles',
      zip:     '90001',
    };
  }

  /**
   * Customer with non-US country — state field stays disabled.
   */
  static nonUsCustomer(suffix = TestDataFactory.ts()) {
    return {
      name:    `Non-US User ${suffix}`,
      email:   `nonus.${suffix}@test.com`,
      country: 'Canada',
      city:    'Toronto',
      zip:     'M5V 3A8',
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Product data
  // ══════════════════════════════════════════════════════════════════════════

  static basicProduct(suffix = TestDataFactory.ts()) {
    return {
      name:        `Basic Plan ${suffix}`,
      type:        'Basic',
      price:       9.99,
      stock:       100,
      description: `Basic product created for test ${suffix}`,
    };
  }

  static professionalProduct(suffix = TestDataFactory.ts()) {
    return {
      name:        `Professional Plan ${suffix}`,
      type:        'Professional',
      price:       29.99,
      stock:       80,
      description: `Professional product created for test ${suffix}`,
    };
  }

  static teamsProduct(suffix = TestDataFactory.ts()) {
    return {
      name:        `Teams Plan ${suffix}`,
      type:        'Teams',
      price:       49.99,
      stock:       60,
      description: `Teams product created for test ${suffix}`,
    };
  }

  static ultraEnterpriseProduct(suffix = TestDataFactory.ts()) {
    return {
      name:        `Ultra Enterprise Plan ${suffix}`,
      type:        'Ultra-Enterprise',
      price:       199.99,
      stock:       20,
      description: `Ultra-Enterprise product created for test ${suffix}`,
    };
  }

  /** A product with very low stock (< 10) to trigger low-stock alert. */
  static lowStockProduct(suffix = TestDataFactory.ts()) {
    return {
      name:  `Low Stock Product ${suffix}`,
      type:  'Basic',
      price: 5.00,
      stock: 5,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Invalid / edge-case data
  // ══════════════════════════════════════════════════════════════════════════

  /** Customer with a duplicate email (same as a fresh Consumer). */
  static duplicateEmailCustomer(existingEmail) {
    return {
      name:  'Duplicate Email User',
      email: existingEmail,   // intentionally duplicate
    };
  }

  /** Product with an invalid (zero) price — should fail form validation. */
  static invalidPriceProduct() {
    return {
      name:  'Invalid Price Product',
      type:  'Basic',
      price: 0,
      stock: 10,
    };
  }

  /** Product with a negative price — should fail form validation. */
  static negativePriceProduct() {
    return {
      name:  'Negative Price Product',
      type:  'Basic',
      price: -5,
      stock: 10,
    };
  }
}
