# Automation

Playwright E2E test suite for the Customer Order Management application.

## Prerequisites

- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- Playwright browsers installed (once):

```bash
npx playwright install chromium
```

> If `playwright install chromium` fails due to a blocked CDN (common in corporate environments), set `CHROME_PATH` to your system Chrome installation. The config falls back to it automatically — no other change needed.

## Running Tests

```bash
# From the project root
npm test                              # headless
npm run test:headed                   # browser visible
npm run test:ui                       # Playwright interactive UI

# From automation/ directly
cd automation
npx playwright test
npx playwright test --headed
npx playwright show-report            # open last HTML report
```

### Run a single spec

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
| Base URL | `http://localhost:5173` (override: `FRONTEND_URL`) |
| Browser | Chromium (Chrome channel) |
| Timeout | 30 s per test, 5 s per assertion |
| Workers | 1 (sequential) |
| Retries | 0 local / 2 on CI |
| Reporter | HTML (`playwright-report/`) |
| Trace | On first retry |

Environment variables:

| Variable | Default | Description |
|---|---|---|
| `FRONTEND_URL` | `http://localhost:5173` | Base URL for all tests |
| `API_URL` | `http://localhost:8000/api` | Used by `ApiHelper.js` |
| `CHROME_PATH` | Windows Chrome path | Fallback when Playwright Chromium is not installed |

## Folder Structure

```
automation/
├── playwright.config.cjs        # Playwright settings
├── package.json                 # npm scripts
├── e2e-generated/               # Generator output — do not edit manually
│   ├── locators.js              # Barrel re-export of all locator classes
│   ├── locators/                # *Locators.js — one per entity
│   ├── pages/                   # *Page.js — one per domain entity
│   │   └── BasePage.js          # Shared wait/interaction helpers
│   ├── utils/
│   │   └── ApiHelper.js         # REST helpers for test setup/teardown
│   └── tests/                   # tc_<id>.spec.js test specs
└── generator/                   # LLM test generation CLI → see generator/README.md
```

### What is `e2e-generated/`?

All files under `e2e-generated/` are produced by the LLM generator. Treat this folder as a build artefact — regenerate rather than hand-edit. The generator copies `BasePage.js` and `ApiHelper.js` verbatim from `generator/e2e-sample/`; all other files are LLM-generated.

## Locator Strategy

Generated locators follow this priority order:

1. `page.getByTestId('data-testid-value')` — primary for all interactive elements
2. `page.locator('#some-id')` — for elements with a stable `id` attribute
3. `page.locator('xpath=...')` — compound / structural queries (following-sibling, ancestor, contains())

## Waiting Strategy

No `page.waitForTimeout` or hardcoded delays anywhere. All generated code uses explicit Playwright mechanisms:

## Using ApiHelper in Tests

`ApiHelper.js` provides REST helpers for setting up and tearing down test data without going through the UI:

## Regenerating Files

If the React app changes (new components, renamed test IDs), regenerate the locators and pages:

```bash
cd automation/generator

# Re-extract selectors + regenerate locators + pages (full run)
python main.py e2e

# Only locators (faster, after minor UI changes)
python main.py e2e --only locators

# Only pages (reads existing locators)
python main.py e2e --only pages
```

See [generator/README.md](generator/README.md) for the full CLI reference and LLM provider options.

## Troubleshooting

| Problem | Fix |
|---|---|
| `playwright install chromium` fails (SSL / corporate network) | Set `CHROME_PATH` to your system Chrome — the config falls back automatically |
| Inspector / `page.pause()` does not open | Run pytest with `-s` to allow stdout through |
| Tests fail with connection errors | Confirm backend is on port 8000 and frontend on port 5173 (or set `FRONTEND_URL`) |
| Playwright can't find an element | Re-run `python main.py e2e --only locators` after any UI changes |
| `ImportError: cannot import name 'ToolAnnotations'` | `pip uninstall mcp -y && pip install "mcp>=1.0.0"` |
