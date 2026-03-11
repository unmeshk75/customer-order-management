# LLM-Powered E2E Test Generation — Architecture Plan

## Problem Statement

Manually maintaining Playwright test suites breaks down at scale:
- Selectors drift silently when components change
- Test logic is written without knowing the actual DOM
- Page objects go stale without a feedback mechanism

An LLM can generate the full framework (locators → pages → scripts), but only if
it is given ground truth about the real UI — otherwise it hallucinates selectors.

---

## Core Principle

> Never prompt the LLM to generate tests from scratch.
> Always give it a verified selector manifest extracted from source code first.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUT PIPELINE                          │
│                                                                 │
│  JSX source files  ──→  [Extractor]  ──→  selector-manifest.json│
│  FastAPI routes    ──→  [OA Parser]  ──→  api-contract.json     │
│  Test case spec    ──→  [Formatter]  ──→  structured-prompt     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                         [Claude API]
                                │
               ┌────────────────┼────────────────┐
               ▼                ▼                ▼
         locators.js      PageObject.js     tc_xxx.spec.js
               │                │                │
               └────────────────┴────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   VALIDATION LAYER    │
                    │                       │
                    │  1. AST parse check   │
                    │  2. Selector xref     │
                    │     (manifest check)  │
                    │  3. Flow analysis     │
                    └───────────┬───────────┘
                                │
                         pass / fail
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
      [Playwright dry-run]              re-prompt with
               │                       validation error
               ▼
      [Full test execution]
               │
         failure trace
               │
      re-prompt with trace
      + manifest context
```

---

## Phase 1 — Selector Extraction Pipeline

A script that statically scans `frontend/src/**/*.jsx` and outputs a manifest:

```json
{
  "order-wizard":  { "file": "OrderForm.jsx", "element": "div",    "condition": "always in create mode" },
  "wizard-next":   { "file": "OrderForm.jsx", "element": "button", "condition": "currentStep < totalSteps" },
  "wizard-submit": { "file": "OrderForm.jsx", "element": "button", "condition": "currentStep === totalSteps" },
  "order-customer-select": { "file": "OrderForm.jsx", "element": "select", "condition": "!isEdit" }
}
```

**Why this matters:** Every bug found in this test suite — `#order-form` not existing,
`wizard-submit` being on the wrong step — would have been prevented if the LLM had
this manifest as input. Ground truth eliminates selector hallucination.

**Implementation approach:**
- Babel AST parser or simple regex scan for `data-testid=` attributes
- Parse JSX conditional wrappers (`{condition && <el>}`) for the `condition` field
- Run as a pre-generation step; manifest is injected into every LLM prompt

---

## Phase 2 — Structured Generation (3 separate LLM calls)

Never generate the full test file in one shot. Use three sequential calls with
validation between each step.

### Call 1 — Generate `locators.js`
**Input:** selector manifest + existing locators.js as pattern example
**Output:** structured JSON of locator definitions
**Validation:** every `getByTestId('x')` must exist in the manifest

### Call 2 — Generate Page Object methods
**Input:** locators JSON + API contract + page flow description
**Output:** page method definitions (name, steps, locators used)
**Validation:** all referenced locators exist in the output of Call 1

### Call 3 — Generate test scripts
**Input:** test case specification + validated page methods
**Output:** `tc_xxx.spec.js` files
**Validation:** AST parse, no direct `page.locator()` calls (must use POM)

---

## Phase 3 — Static Validation Layer

Runs before any browser. Catches ~80% of hallucinations cheaply.

| Check | What it catches |
|-------|----------------|
| AST parse | Syntax errors, malformed JS |
| Selector cross-reference | `getByTestId('x')` where `x` not in manifest |
| Step context analysis | `wizard-submit` referenced outside step-3 context |
| POM compliance | Direct `page.locator()` in test files (bypass of page objects) |

---

## Phase 4 — Execution Feedback Loop

```
Generated test
      │
      ▼
Playwright run
      │
   failure?
      │
      ▼
Failure trace + manifest + original prompt
      │
      ▼
Claude API (re-generation with error context)
      │
      ▼
Patched test file
      │
      ▼
Re-run (max 3 iterations)
```

The Playwright failure trace (the exact error messages with locator name, expected
vs received, and call log) is the highest-signal input for correction. Feed it
verbatim — do not summarize.

---

## Phase 5 — Diff-Triggered Regeneration

When a component changes, regenerate only what's affected — not the whole suite.

```
git diff HEAD frontend/src/components/OrderForm.jsx
      │
      ▼
Re-run selector extractor → new manifest
      │
      ▼
Diff old manifest vs new manifest
      │
      ▼
Find affected locators + page methods
      │
      ▼
Re-generate only affected files
      │
      ▼
Static validation + dry-run
```

This keeps the cost of regeneration low and avoids breaking unrelated tests.

---

## What NOT to Do

| Anti-pattern | Why |
|---|---|
| Prompt: "generate Playwright tests for an order management app" | No DOM knowledge → pure hallucination |
| Generate full test file in one shot | No validation breakpoints; errors compound |
| Skip the manifest step | LLM invents `data-testid` values that don't exist |
| Summarize failure traces before re-prompting | Removes the exact signal needed for correction |
| Regenerate entire suite on any change | Expensive, breaks unrelated passing tests |

---

## Tech Stack Recommendation

| Component | Tool |
|---|---|
| Selector extractor | Node.js script with `@babel/parser` AST |
| API contract | FastAPI's auto-generated `/openapi.json` |
| LLM | Claude API (`claude-sonnet-4-6`) with tool use for structured output |
| Structured output | JSON schema enforcement via Claude tool_use parameter |
| Static validation | Custom Node.js validator + `@babel/parser` |
| Test execution | Playwright (this project's existing setup) |
| Orchestration | Simple Node.js CLI or Python script |

---

## Directory Structure (future state)

```
automation/
  e2e/
    locators.js          ← generated + human-maintained
    pages/               ← generated + human-maintained
    tests/               ← generated
  generator/             ← the LLM generation system (to be built)
    extract-selectors.js ← Phase 1: scans JSX → manifest
    generate.js          ← Phase 2: calls Claude API in 3 steps
    validate.js          ← Phase 3: static checks
    feedback.js          ← Phase 4: failure trace → re-prompt
    selector-manifest.json  ← output of extractor (gitignored or committed)
  playwright.config.cjs
  package.json
  LLM_TEST_GENERATION_PLAN.md  ← this file
```
