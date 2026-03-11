# Automation

Playwright E2E test suite for the Customer Order Management application, plus an LLM-driven generator that writes locators, page objects, and test specs from the React source.

## Structure

```
automation/
├── playwright.config.cjs       # Playwright configuration
├── package.json                # Scripts (delegates to root node_modules)
├── e2e-generated/              # Generated test infrastructure (do not edit manually)
│   ├── locators/               # Locator classes — one per entity
│   ├── pages/                  # Page Object classes — one per entity
│   ├── utils/
│   │   └── ApiHelper.js        # REST helpers for test setup/teardown
│   └── tests/                  # Generated .spec.js test files
└── generator/                  # LLM test generation CLI
    └── README.md               # Generator docs
```

## Prerequisites

- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- Playwright browsers installed: `npx playwright install chromium`

## Running Tests

```bash
# From project root
npm test                          # headless Chromium
npm run test:headed               # with browser visible
npm run test:ui                   # Playwright UI mode (interactive)

# Or from automation/ directly
cd automation
npx playwright test
npx playwright test --headed
npx playwright show-report        # open last HTML report
```

### Run a specific spec file

```bash
cd automation
npx playwright test e2e-generated/tests/tc_man_01.spec.js
```

### Run with a different base URL

```bash
FRONTEND_URL=http://localhost:3000 npm test
```

## Playwright Configuration

Key settings in [playwright.config.cjs](playwright.config.cjs):

| Setting | Value |
|---|---|
| Test directory | `./e2e-generated/tests` |
| Base URL | `http://localhost:5173` (override with `FRONTEND_URL`) |
| Browser | Chromium (Chrome channel) |
| Timeout | 30 s per test, 5 s per assertion |
| Parallelism | Auto (1 worker on CI) |
| Retries | 0 (2 on CI) |
| Reporter | HTML (`playwright-report/`) |
| Trace | On first retry |

## e2e-generated Layout

The `e2e-generated/` folder is the output of the LLM generator. Do not edit files here manually — regenerate them instead.

```
e2e-generated/
├── locators.js                # Barrel re-export of all locator classes
├── locators/
│   ├── CustomerLocators.js    # Customer List + Form selectors
│   ├── ProductLocators.js     # Product List + Form selectors
│   ├── OrderLocators.js       # Order List + Wizard selectors
│   ├── DashboardLocators.js   # Dashboard card selectors
│   ├── NavigationLocators.js  # Top nav selectors  (locator-only, no Page class)
│   └── ModalLocators.js       # Confirmation modal selectors  (locator-only, no Page class)
├── pages/
│   ├── BasePage.js            # Shared wait/interaction helpers  (copied verbatim)
│   ├── CustomerPage.js
│   ├── ProductPage.js
│   ├── OrderPage.js
│   └── DashboardPage.js
├── utils/
│   └── ApiHelper.js           # REST helpers for test setup/teardown  (copied verbatim)
└── tests/
    └── *.spec.js              # Generated test specs (tc_<id>.spec.js)
```

### Locator strategy (priority order)

1. `page.getByTestId('data-testid-value')` — primary for interactive elements
2. `page.locator('#some-id')` — for elements with stable `id`
3. `page.locator('xpath=...')` — compound, following-sibling, ancestor, parent, contains()

### Waiting strategy

No `page.waitForTimeout` anywhere. All waits use explicit Playwright mechanisms:
- `locator.waitFor({ state: 'visible' | 'hidden' | 'detached' })`
- `expect(locator).toBeVisible()` / `.toBeEnabled()` / `.toHaveCount()`

## Generating / Regenerating Files

All commands run from `automation/generator/` with the root venv active.

### `e2e` subcommand — generates locators, pages, and static files

The full pipeline runs 4 steps:
1. Extract selectors from JSX → `selector_manifest.json`
2. Generate `*Locators.js` for all 6 entities (Customer, Product, Order, Dashboard, Navigation, Modal)
3. Generate `*Page.js` for 4 entities (Customer, Product, Order, Dashboard — Navigation and Modal are locator-only)
4. Copy `BasePage.js` and `ApiHelper.js` verbatim, write `locators.js` barrel re-export

```bash
cd automation/generator

# Full run (steps 1–4)
python main.py e2e
python main.py e2e --sdk                    # use Claude Code CLI, no API key needed

# Only locators (steps 1–2)
python main.py e2e --only locators --sdk

# Only pages (step 3 only — reads existing locators from e2e-generated/locators/)
python main.py e2e --only pages --sdk

# Custom output path  (default: ../e2e-generated)
python main.py e2e -o ../some-other-dir
```

> **Note:** `--only pages` reads locator files already in the output directory. Run `--only locators` first if they don't exist.

### `tests` subcommand — generates spec files from test case input

One `.spec.js` file is written per test case, named after the TC ID (e.g. `TC-CUST-01` → `tc_cust_01.spec.js`). Test cases are grouped by entity and each spec is validated for JS syntax before being saved.

```bash
# From an Excel or CSV file  (-i is short for --input)
python main.py tests -i test_cases.xlsx --sdk
python main.py tests -i test_cases.csv

# From an inline JSON test case
python main.py tests -i '{"id":"TC-01","name":"...","scenario":"...","expected":"...","type":"positive"}'

# From plain text  (-t forces type; auto-inferred if omitted)
python main.py tests -i "TC-01: Customer can be created with valid data"
python main.py tests -i "TC-01: ..." -t positive

# Custom output  (default: ../e2e-generated/tests)
python main.py tests -i cases.xlsx -o ../e2e-generated/tests
```

See [generator/README.md](generator/README.md) for full CLI reference and setup instructions.

## API Helper Usage in Tests

```js
import { ApiHelper } from '../utils/ApiHelper.js';

test.beforeAll(async ({ request }) => {
  const api = new ApiHelper(request);
  customer = await api.createCustomer({ name: 'Test User', customer_type: 'Consumer', ... });
});

test.afterAll(async ({ request }) => {
  const api = new ApiHelper(request);
  await api.cleanupCustomersByName('Test User');
});
```
