# Customer Order Management — Playwright Automation Framework

## 📁 Framework Structure

```
frontend/
├── playwright.config.js         # Playwright configuration
└── e2e/
    ├── locators/                 # Element locator classes (by page)
    │   ├── NavigationLocators.js
    │   ├── CustomerLocators.js
    │   ├── ProductLocators.js
    │   ├── OrderLocators.js
    │   ├── DashboardLocators.js
    │   └── ModalLocators.js
    ├── pages/                    # Page Object Model (POM) classes
    │   ├── BasePage.js
    │   ├── NavigationPage.js
    │   ├── CustomerPage.js
    │   ├── ProductPage.js
    │   ├── OrderPage.js
    │   └── DashboardPage.js
    ├── utils/                    # Shared utilities
    │   ├── TestDataFactory.js    # Test data generators
    │   ├── ApiHelper.js          # REST API helpers for setup/teardown
    │   └── AssertionHelper.js    # Custom assertion methods
    └── tests/                    # Executable test specifications
        ├── TC_CUST_01.spec.js    # Create Consumer Customer
        ├── TC_CUST_02.spec.js    # SMB/Enterprise Company Name Required
        ├── TC_CUST_03.spec.js    # Country/State Dynamic Behavior
        ├── TC_CUST_04.spec.js    # Customer Search & Filter
        ├── TC_CUST_05.spec.js    # Edit Customer & Expand Row
        ├── TC_PROD_01.spec.js    # Create Product & Type Filter
        ├── TC_PROD_02.spec.js    # Edit/Delete Product & Stock Badge
        ├── TC_ORD_01.spec.js     # Consumer Product Restrictions
        ├── TC_ORD_02.spec.js     # SMB & Enterprise Restrictions
        ├── TC_ORD_03.spec.js     # Stock Management
        ├── TC_ORD_04.spec.js     # Discount Calculation & Wizard
        ├── TC_ORD_05.spec.js     # Order Filter & Expand Row
        ├── TC_DASH_01.spec.js    # Dashboard Count Updates
        ├── TC_ADV_01.spec.js     # Advanced Scenarios
        └── TC_ADV_02.spec.js     # Negative & Edge Cases
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`

### Install
```bash
cd frontend
npm install
npx playwright install chromium
```

### Run all tests
```bash
npm test
```

### Run specific suites
```bash
npm run test:customers    # Customer tests only
npm run test:products     # Product tests only
npm run test:orders       # Order tests only
npm run test:dashboard    # Dashboard tests only
npm run test:advanced     # Advanced / edge case tests
```

### View HTML report
```bash
npm run test:report
```

---

## 📋 Test Cases (28 total)

| File | TC ID | Description | Type |
|------|-------|-------------|------|
| TC_CUST_01 | C01 | Create Consumer customer | Positive |
| TC_CUST_02 | C02-a | SMB: company name field appears | Positive |
| TC_CUST_02 | C02-b | Enterprise: company name field appears | Positive |
| TC_CUST_02 | C02-c | SMB without company name → error | Negative |
| TC_CUST_03 | C03-a | Country=US → State SELECT appears | Positive |
| TC_CUST_03 | C03-b | Non-US → State INPUT disabled | Negative |
| TC_CUST_03 | C03-c | US + state selected → customer created | Positive |
| TC_CUST_03 | C03-d | US without state → HTML5 validation | Negative |
| TC_CUST_03 | C03-e | Switch US → non-US clears state | Dynamic |
| TC_CUST_04 | C04-a | Search by name filters table | Positive |
| TC_CUST_04 | C04-b | Search by email filters table | Positive |
| TC_CUST_04 | C04-c | No-match search shows empty state | Negative |
| TC_CUST_05 | C05-a | Edit form pre-populates data | Positive |
| TC_CUST_05 | C05-b | Updated name reflects in list | Positive |
| TC_CUST_05 | C05-c | Expand row shows no-orders message | Positive |
| TC_PROD_01 | P01-a | Create Basic product | Positive |
| TC_PROD_01 | P01-b | Type filter shows only matching rows | Positive |
| TC_PROD_01 | P01-c | Zero price shows error | Negative |
| TC_PROD_01 | P01-d | Negative price shows error | Negative |
| TC_PROD_02 | P02-a | Edit product stock | Positive |
| TC_PROD_02 | P02-b | Low stock → red badge | Positive |
| TC_PROD_02 | P02-c | Medium stock → yellow badge | Positive |
| TC_PROD_02 | P02-d | Delete product (no orders) | Positive |
| TC_ORD_01 | O01-a | Consumer sees only Basic/Professional | Positive |
| TC_ORD_01 | O01-b | Consumer does NOT see Teams/Ultra-Ent | Negative |
| TC_ORD_01 | O01-c | Info text lists allowed types | Positive |
| TC_ORD_01 | O01-d | Consumer creates order with Basic | Positive |
| TC_ORD_02 | O02-a | SMB sees Professional & Teams | Positive |
| TC_ORD_02 | O02-b | SMB does NOT see Basic/Ultra-Ent | Negative |
| TC_ORD_02 | O02-c | Enterprise sees Basic/Teams/Ultra-Ent | Positive |
| TC_ORD_02 | O02-d | Enterprise does NOT see Professional | Negative |
| TC_ORD_02 | O02-e | SMB places order with Teams | Positive |
| TC_ORD_02 | O02-f | Enterprise places order with Ultra-Ent | Positive |
| TC_ORD_03 | O03-a | Stock decreases by seats after order | Positive |
| TC_ORD_03 | O03-b | Stock increases after cancellation | Positive |
| TC_ORD_03 | O03-c | Wizard shows stock indicator | Positive |
| TC_ORD_04 | O04-a | 10% discount applied correctly | Positive |
| TC_ORD_04 | O04-b | Discounted total shown in list | Positive |
| TC_ORD_04 | O04-c | Next disabled without customer | Negative |
| TC_ORD_04 | O04-d | Multi-product review has 2 rows | Positive |
| TC_ORD_05 | O05-a | Filter sidebar opens/closes | Positive |
| TC_ORD_05 | O05-b | Filter by Active hides Cancelled | Positive |
| TC_ORD_05 | O05-c | Remove chip restores all orders | Positive |
| TC_ORD_05 | O05-d | Expand row shows detail table | Positive |
| TC_ORD_05 | O05-e | Detail row shows product/seats | Positive |
| TC_DASH_01 | D01-a | Customer total increases | Positive |
| TC_DASH_01 | D01-b | Active orders count increases | Positive |
| TC_DASH_01 | D01-c | Cancelled orders count updates | Positive |
| TC_DASH_01 | D01-d | Revenue shown in card | Positive |
| TC_DASH_01 | D01-e | Low stock alert card appears | Positive |
| TC_ADV_01 | A01-a | Customer row shows order history | Advanced |
| TC_ADV_01 | A01-b | Delete customer cascades to orders | Advanced |
| TC_ADV_01 | A01-c | Compound status+priority filter | Advanced |
| TC_ADV_01 | A01-d | Critical priority badge | Advanced |
| TC_ADV_01 | A01-e | Suspended account status badge | Advanced |
| TC_ADV_02 | A02-a | Duplicate email rejected | Negative |
| TC_ADV_02 | A02-b | Empty form blocked by HTML5 | Negative |
| TC_ADV_02 | A02-c | Delete product in order → error | Negative |
| TC_ADV_02 | A02-d | Edit order shows customer readonly | Positive |
| TC_ADV_02 | A02-e | Step 2 Next disabled without product | Negative |
| TC_ADV_02 | A02-f | Edit order priority reflects in list | Positive |

---

## 🏗️ Architecture Decisions

### Locator Strategy (priority order)
1. `data-testid` — most stable, primary choice
2. `id` selector — for form elements with stable ids
3. **Advanced XPath** — for dynamic/relational scenarios

### XPath Patterns Used
| Pattern | Example Use Case |
|---------|-----------------|
| `compound` | `//fieldset[legend[contains(text(),'Address')]]//input` |
| `following-sibling` | State select after its label |
| `ancestor` | Edit button from name cell up to row |
| `parent` | Wizard nav container from button |
| `contains()` | Badge class checks, text partial match |

### Waiting Strategy (no hardcoded waits)
- `locator.waitFor({ state: 'visible' })` — wait for elements to appear
- `expect(locator).toBeVisible()` — built-in retry with configurable timeout
- `expect(async () => {}).toPass()` — polling for computed conditions
- Form close → wait for list container to reappear

### Data Isolation
- `TestDataFactory` generates timestamped test data
- `ApiHelper` provides REST setup/teardown in `beforeAll` / `afterAll` hooks
- Each test cleans up after itself
