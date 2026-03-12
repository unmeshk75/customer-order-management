"""
prompt_builder.py
────────────────────────────────────────────────────────────────────────────
Builds system + user prompts for each generation mode.

Every prompt injects the hard constraint:
  No hardcoded waits or timeouts.
  Use only explicit Playwright waiting mechanisms.
────────────────────────────────────────────────────────────────────────────
"""

import json
import os

_HERE = os.path.dirname(os.path.abspath(__file__))
_E2E  = os.path.normpath(os.path.join(_HERE, 'e2e-sample'))

# ── shared constraint block ────────────────────────────────────────────────
_WAIT_CONSTRAINTS = """
CRITICAL CONSTRAINT — WAITING STRATEGY:
  ❌ NEVER use:  setTimeout, page.waitForTimeout, any hardcoded ms delay
  ✅ ALWAYS use explicit Playwright mechanisms:
      • locator.waitFor({ state: 'visible' | 'hidden' | 'attached' | 'detached' })
      • expect(locator).toBeVisible()
      • expect(locator).toBeEnabled()
      • expect(locator).toHaveCount(n)
      • expect(locator).toHaveText(...)
      • expect(async () => { ... }).toPass()
  These have built-in retry logic and no hardcoded delays.
""".strip()

# ── XPATH style guide ──────────────────────────────────────────────────────
_XPATH_GUIDE = """
LOCATOR STRATEGY (priority order):
  1. this.page.getByTestId('data-testid-value')  — primary for interactive elements
  2. this.page.locator('#some-id')               — for elements with stable id=""
  3. this.page.locator('xpath=...')              — for complex structural queries

REQUIRED XPATH PATTERNS (use at least 4 per locator class):
  • Compound:         //table[@id="x"]//tbody//tr[@data-foo]
  • following-sibling: //label[@for="x"]/following-sibling::*[1]
  • ancestor:          //td[@data-testid="x"]/ancestor::tr//button
  • parent:            //button[@data-testid="x"]/parent::div[contains(@class,"y")]
  • contains():        //span[contains(@class,"status-badge")]
  • normalize-space(): //label[normalize-space(text())="State *"]
""".strip()

# ── file loader ────────────────────────────────────────────────────────────

def _read(rel_path: str) -> str:
    """Read a reference file relative to the e2e directory."""
    path = os.path.join(_E2E, rel_path)
    if not os.path.exists(path):
        return f'// [reference file not found: {rel_path}]'
    with open(path, encoding='utf-8') as f:
        return f.read()


# ══════════════════════════════════════════════════════════════════════════
# 1. Locator prompt
# ══════════════════════════════════════════════════════════════════════════

def build_locator_prompt(entity_name: str, manifest_subset: dict) -> tuple[str, str]:
    """
    Returns (system_prompt, user_prompt) for generating a *Locators.js file.

    :param entity_name:      e.g. 'Customer', 'Product'
    :param manifest_subset:  entries from selector_manifest.json for this entity
    """
    example_locator = _read('locators/CustomerLocators.js')
    base_page       = _read('pages/BasePage.js')

    system = f"""You are an expert Playwright test automation engineer.
Generate a single JavaScript ES module file: {entity_name}Locators.js
Do not overthink. Output the file directly without any reasoning or analysis preamble.

RULES:
  • Export one class named {entity_name}Locators
  • Constructor accepts `page` (Playwright Page object)
  • All simple selectors use getter properties (get xxx() {{ return ...; }})
  • Dynamic selectors (requiring an id parameter) use regular methods: fooBar(id) {{ return ...; }}
  • Every getter/method returns a Playwright Locator
  • No logic, no await, no waits inside this file — pure locator definitions

{_XPATH_GUIDE}

{_WAIT_CONSTRAINTS}

OUTPUT: Return ONLY the raw JavaScript file content. No markdown, no explanation.
"""

    user = f"""Generate {entity_name}Locators.js for the following UI elements.

=== SELECTOR MANIFEST (ground truth — these are the ACTUAL data-testid and id values in the app) ===
{json.dumps(manifest_subset, indent=2)}

=== PATTERN EXAMPLE (CustomerLocators.js — follow this structure exactly) ===
{example_locator}

=== BasePage.js (reference — shows the Page API you can call in page objects, NOT in locators) ===
{base_page}

Requirements:
1. Use all testid entries from the manifest as getByTestId() calls
2. Use all id entries from the manifest as locator('#id') calls
3. Add at least 4 XPath-based locators using the patterns: compound, following-sibling, ancestor, parent, contains()
4. For dynamic rows (customer/product/order id-based), add parameterized methods returning XPath locators
5. Add "first row" shortcut getters using attribute-starts-with selectors
6. Group getters with section comments (List, Form, Dynamic rows, Shortcuts)
"""

    return system, user


# ══════════════════════════════════════════════════════════════════════════
# 2. Page Object prompt
# ══════════════════════════════════════════════════════════════════════════

def build_page_prompt(entity_name: str, locator_code: str) -> tuple[str, str]:
    """
    Returns (system_prompt, user_prompt) for generating a *Page.js file.

    :param entity_name:   e.g. 'Customer', 'Product'
    :param locator_code:  content of the already-generated *Locators.js
    """
    example_page = _read('pages/CustomerPage.js')
    base_page    = _read('pages/BasePage.js')
    nav_locators = _read('locators/NavigationLocators.js')
    modal_locators = _read('locators/ModalLocators.js')

    system = f"""You are an expert Playwright test automation engineer.
Generate a single JavaScript ES module file: {entity_name}Page.js
Do not overthink. Output the file directly without any reasoning or analysis preamble.

RULES:
  • Export one class named {entity_name}Page extends BasePage
  • Import BasePage from './BasePage.js'
  • Import {entity_name}Locators from '../locators/{entity_name}Locators.js'
  • Import NavigationLocators from '../locators/NavigationLocators.js'
  • Import ModalLocators from '../locators/ModalLocators.js' (for delete confirmations)
  • Constructor: super(page); this.navLoc = new NavigationLocators(page); this.loc = new {entity_name}Locators(page); this.modal = new ModalLocators(page);
  • All methods are async
  • Use ONLY BasePage helper methods for waiting and interaction (listed below)
  • Never call page.waitForTimeout or any hardcoded delay
  ❌ NEVER use plural page class names (e.g. {entity_name}sPage, {entity_name}sPages). ALWAYS use exactly: {entity_name}Page.

{_WAIT_CONSTRAINTS}

BASEPAGE HELPER METHODS AVAILABLE:
  Navigation:   this.goto()
  Waits:        this.waitForVisible(loc), this.waitForHidden(loc), this.waitForAttached(loc),
                this.waitForDetached(loc), this.waitForEnabled(loc), this.waitForCount(loc, n),
                this.waitForText(loc, text), this.waitForTextContaining(loc, sub)
  Boolean:      this.isVisible(loc), this.isEnabled(loc), this.isDisabled(loc)
  DOM:          this.getText(loc), this.clearAndFill(loc, value),
                this.selectByText(loc, text), this.selectByValue(loc, value),
                this.clickWhenReady(loc), this.scrollTo(loc)
  Numbers:      this.getNumericText(loc), this.getIntText(loc)
  Dialogs:      this.acceptDialog(), this.dismissDialog()

OUTPUT: Return ONLY the raw JavaScript file content. No markdown, no explanation.
"""

    user = f"""Generate {entity_name}Page.js using the locator class below.

=== {entity_name}Locators.js (the locator class to use) ===
{locator_code}

=== PATTERN EXAMPLE (CustomerPage.js — follow this structure and method naming) ===
{example_page}

=== BasePage.js (base class — import and extend this) ===
{base_page}

=== NavigationLocators.js (import for navigation) ===
{nav_locators}

=== ModalLocators.js (import for delete confirmations) ===
{modal_locators}

Requirements:
1. navigateTo{entity_name}s() — goto(), wait for nav btn, click, wait for list container
2. openCreateForm() — wait for btn enabled, click, wait for form visible
3. fill{entity_name}Form(data) — fill each field only if data.field !== undefined
4. submitForm() — wait enabled, click, wait for form hidden, wait for list visible
5. cancelForm() — click cancel, wait for form hidden
6. create{entity_name}(data) — compose openCreateForm + fillForm + submitForm
7. openEditForm(id) — wait for edit btn, click, wait for form
8. delete{entity_name}(id) — click delete btn, wait for modal, click confirm, wait for row detached
9. getRowCount() — return locator count
10. submitFormExpectError() — click submit, wait for error visible
11. Granular field helpers: fillName(v), fillEmail(v), etc. (one per form field)
"""

    return system, user


# ══════════════════════════════════════════════════════════════════════════
# 3. Test spec prompt
# ══════════════════════════════════════════════════════════════════════════

def build_test_prompt(
    test_cases: list[dict],
    entity_name: str,
    page_code: str,
) -> tuple[str, str]:
    """
    Returns (system_prompt, user_prompt) for generating a tc_xxx.spec.js file.

    :param test_cases:   list of {id, name, scenario, expected, type, steps, entity}
    :param entity_name:  the primary entity being tested
    :param page_code:    content of the relevant *Page.js
    """
    example_spec  = _read('tests/tc_man_01.spec.js')
    api_helper    = _read('utils/ApiHelper.js')

    # Determine page import name
    page_class   = f'{entity_name}Page'
    page_import  = f'../pages/{entity_name}Page.js'

    system = f"""You are an expert Playwright test automation engineer.
Generate a single Playwright test spec file.
Do not overthink. Output the file directly without any reasoning or analysis preamble.

CRITICAL — EXACT IMPORTS (copy these verbatim, do NOT change class names or paths):
  import {{ test, expect }} from '@playwright/test';
  import {{ {page_class} }} from '{page_import}';
  import {{ ApiHelper }} from '../utils/ApiHelper.js';
  ❌ NEVER use plural or variant names (e.g. {entity_name}sPage, {entity_name}s).
  ✅ The page class is ALWAYS named exactly: {page_class}

FILE STRUCTURE RULES:
  • ES module imports only
  • One test.describe block per test case group
  • ❌ NEVER save `let api;` globally or reuse a {{ request }} fixture across tests
  • test.beforeAll: instantiate `const api = new ApiHelper(request);` locally
  • test.afterAll: instantiate `const api = new ApiHelper(request);` locally
  • Individual tests: [Positive] or [Negative] prefix in test name
  • Each test is independent: navigate fresh, interact, assert, clean up
  ❌ NEVER shadow the imported class with a same-named variable:
     BAD:  const CustomerPage = new CustomerPage(page)   ← TDZ crash
     GOOD: const customerPage = new CustomerPage(page)   ← camelCase variable
  Note that CustomerPage is the correct class name.

{_WAIT_CONSTRAINTS}

ASSERTION RULES:
  • Use expect(locator).toBeVisible() not manual waitForVisible
  • Use expect(locator).toBeEnabled() / toBeDisabled()
  • Use expect(locator).toHaveValue('x') / toHaveText('x') / toContainText('x')
  • Use expect(locator).toHaveAttribute('attr', 'val')
  • Use expect(locator).toHaveCount(n) for lists
  • Use expect(locator).not.toBeVisible() for hidden assertions
  • XPath locators from the page object's .loc property can be used directly in expect()

OUTPUT: Return ONLY the raw JavaScript file content. No markdown, no explanation.
"""

    tc_json = json.dumps(test_cases, indent=2)

    user = f"""Generate a Playwright spec file for the following test cases.

REMINDER — use these exact imports at the top of the file:
  import {{ test, expect }} from '@playwright/test';
  import {{ {page_class} }} from '{page_import}';
  import {{ ApiHelper }} from '../utils/ApiHelper.js';

=== TEST CASES ===
{tc_json}

=== {page_class}.js (page object to use — its .loc property has all locators) ===
{page_code}

=== ApiHelper.js (for beforeAll/afterAll data setup) ===
{api_helper}

=== PATTERN EXAMPLE (tc_man_01.spec.js — follow this exact structure) ===
{example_spec}

Requirements:
1. One test.describe per test case (or group them logically if same entity/scenario)
2. Name the describe block: "TC-XXX: <test case name>"
3. Name each test: "[Positive] ..." or "[Negative] ..."
4. Use beforeAll to create test data via ApiHelper if the test needs existing records
5. Use afterAll to clean up by name pattern (cleanupCustomersByName, etc.)
6. Use explicit expect() assertions — not manual wait helpers
7. For negative tests: submit invalid data, assert error message is visible
8. Always cancel or clean up the form at the end of each test
"""

    return system, user


# ══════════════════════════════════════════════════════════════════════════
# 4. Barrel export prompt (locators.js)
# ══════════════════════════════════════════════════════════════════════════

def build_barrel_content(entity_names: list[str]) -> str:
    """Generate the locators.js barrel re-export file (no LLM needed)."""
    lines = ['/**', ' * locators.js — barrel re-export of all locator classes', ' */']
    for name in entity_names:
        lines.append(f"export {{ {name}Locators }} from './locators/{name}Locators.js';")
    return '\n'.join(lines) + '\n'
