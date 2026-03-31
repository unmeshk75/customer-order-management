# Developers Guide

Technical reference for contributors. For user-facing setup and usage see [README.md](README.md).

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2, SQLite, Pydantic v2 |
| Frontend | React 18, Vite, Axios |
| E2E Testing | Playwright (Node.js) |
| Test Generator | Python — Anthropic, Gemini, or Vertex AI |

## Architecture

```
browser
  │  HTTP (Vite proxy /api → :8000)
  ▼
frontend/       React SPA on :5173
  │  Axios → /api/*
  ▼
backend/        FastAPI on :8000
  │  SQLAlchemy ORM
  ▼
backend/app.db  SQLite (auto-created)
```

The frontend and backend are independent processes. Vite's dev-server proxy (`/api → http://localhost:8000`) eliminates CORS issues during development. In production, a reverse proxy (nginx, etc.) would serve the same purpose.

## Repository Layout

```
order-management/
├── backend/
│   ├── main.py              # FastAPI app + all route handlers
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── crud.py              # DB read/write helpers
│   ├── business_rules.py    # Product-customer compatibility matrix
│   └── database.py          # Engine, session, Base
├── frontend/
│   ├── vite.config.js       # Dev server config + /api proxy
│   └── src/
│       ├── App.jsx           # Root component, view state
│       ├── api.js            # Axios instance (baseURL: /api)
│       └── components/       # One file per view/feature
├── automation/
│   ├── playwright.config.cjs # Playwright settings
│   ├── e2e-generated/        # Generator output (treat as build artefact)
│   └── generator/            # LLM test generator CLI
│       ├── main.py           # CLI entry point
│       ├── extractor.py      # JSX → selector_manifest.json
│       ├── prompt_builder.py # Builds system + user prompts
│       ├── llm_client.py     # Provider adapters (Anthropic / SDK / Gemini / Vertex)
│       ├── writer.py         # File output + directory scaffolding
│       ├── validator.py      # Node.js syntax check on generated JS
│       ├── input_parser.py   # Excel / CSV / JSON / text → test case dicts
│       └── e2e-sample/       # Hand-crafted few-shot examples for the LLM
├── package.json              # npm workspace root (frontend + automation)
└── requirements.txt          # Python deps (backend + generator, shared venv)
```

## Automation Pipeline

### How test generation works

The generator (`automation/generator/`) has two modes:

**Mode A — `e2e` — generates locator classes and page objects**

```
Step 1  extractor.py
        Scans every .jsx / .tsx file in the React src/ directory.
        Extracts data-testid and id attributes.
        Classifies each selector by entity (first meaningful token of the name).
        Writes selector_manifest.json.

Step 2  LLM generates *Locators.js (one per entity)
        Priority: getByTestId() → locator('#id') → XPath.
        Uses the manifest as ground truth.

Step 3  LLM generates *Page.js (one per domain entity)
        Extends BasePage.js. Methods: navigateTo, openCreateForm,
        fillForm, submitForm, deleteEntity, etc.
        Navigation and Modal entities are locator-only — no Page class.

Step 4  Static files copied verbatim:
        BasePage.js, ApiHelper.js, locators.js barrel re-export.
```

**Mode B — `tests` — generates spec files from test case descriptions**

```
Input: Excel (.xlsx) / CSV / inline JSON / plain text
        │
        ▼
input_parser.py  →  list of {id, name, scenario, expected, type, entity}
        │
        ▼
prompt_builder.py  →  system + user prompt
                       (includes selector_manifest + page object code
                        + 5 hand-written reference specs as few-shot examples)
        │
        ▼
llm_client.py  →  chosen LLM provider (streaming)
        │
        ▼
writer.py  →  tc_<id>.spec.js in e2e-generated/tests/
        │
        ▼
validator.py  →  node --check (syntax)
```

### Entity classification

Selectors are classified automatically from their name prefix:
- First hyphen-separated token that is not an action verb (`add`, `edit`, `delete`…), a UI structural word (`btn`, `form`, `list`…), or a common field name (`name`, `email`, `price`…) becomes the entity.
- Exception: tokens matching navigation keywords (`nav`, `navbar`…) → `navigation`; tokens matching modal keywords (`modal`, `dialog`…) → `modal`.
- Navigation and Modal entities get locator files only — no Page class.

This means the generator adapts automatically to any React app that follows `{entity}-{element}` naming for `data-testid` attributes.

### Waiting strategy (enforced in all generated code)

`page.waitForTimeout` and hardcoded delays are banned. All waits use explicit Playwright mechanisms:
- `locator.waitFor({ state: 'visible' | 'hidden' | 'detached' })`
- `expect(locator).toBeVisible()` / `.toBeEnabled()` / `.toHaveCount(n)`

## LLM Providers

The generator supports four backends, all exposing the same `generate(system, user, label)` interface:

| Provider | Class | Flag | Requirements |
|---|---|---|---|
| Anthropic API | `LLMClient` | `--provider anthropic` (default) | `ANTHROPIC_API_KEY` in `.env` |
| Claude Code CLI | `SDKClient` | `--provider sdk` | `claude` on PATH |
| Google Gemini API | `GeminiClient` | `--provider gemini` | `GEMINI_API_KEY` in `.env` |
| Google Vertex AI | `VertexAIClient` | `--provider vertexai` | `GCP_CREDENTIALS_PATH`, `GCP_PROJECT` in `.env` |

Provider selection logic in `llm_client.create_client()`:
1. `--provider <name>` wins if set explicitly
2. `--sdk` is a legacy alias for `--provider sdk`
3. Default is `anthropic`

Optional Python packages (install only what you use):
```bash
pip install google-generativeai          # Gemini API
pip install google-cloud-aiplatform      # Vertex AI
pip install google-auth                  # Vertex AI service account auth
```

## Environment Variables

All generator settings live in `automation/generator/.env` (copy from `.env.example`):

| Variable | Used by | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic provider | Claude API key |
| `GEMINI_API_KEY` | Gemini provider | Google AI Studio API key |
| `GCP_CREDENTIALS_PATH` | Vertex provider | Filename of GCP service account JSON, relative to `generator/` |
| `GCP_PROJECT` | Vertex provider | GCP project ID |
| `GCP_LOCATION` | Vertex provider | Region (default: `us-central1`) |
| `GEMINI_MODEL` | Gemini provider | Model override (default: `gemini-2.0-flash`) |
| `VERTEX_MODEL` | Vertex provider | Model override (default: `gemini-2.0-flash`) |

Playwright environment variables (set at shell level or in CI):

| Variable | Default | Description |
|---|---|---|
| `FRONTEND_URL` | `http://localhost:5173` | Base URL for all E2E tests |
| `API_URL` | `http://localhost:8000/api` | API base used by `ApiHelper.js` in tests |
| `CHROME_PATH` | Windows Chrome path | Fallback system Chrome if Playwright Chromium is not installed |

## Known Limitations and Pending Work

**Anthropic API key provisioning**
The default provider requires `ANTHROPIC_API_KEY`. Use `--provider sdk` with a Claude Code subscription as a no-key alternative while a key is being provisioned.

**Feedback loop not integrated**
`automation/generator/feedback.py` exists to collect pass/fail results and feed them back into future LLM prompts, but it is not yet called automatically after test runs.

**Order edit UI is partial**
Orders support editing basic fields (status, priority, notes, discount) via `PUT /api/orders/{id}`, but the 3-step wizard UI does not yet support modifying the product line items of an existing order.

**Corporate network / Playwright Chromium**
`playwright install chromium` may fail if the Playwright CDN is blocked. The Playwright config falls back to system Chrome via `CHROME_PATH` automatically when the built-in Chromium is not found.

## Adding a New LLM Provider

1. Add a new class to `automation/generator/llm_client.py` implementing `generate(system, user, label) -> str`.
2. Register it in `create_client()` with a new `provider` string.
3. Add it to the `choices` list in both `--provider` arguments in `main.py`.
4. Document the required `.env` variables in `.env.example`.

## Running Backend Tests

```bash
venv\Scripts\activate
cd backend
pytest -v
```

## Git Branches

| Branch | Purpose |
|---|---|
| `master` | Stable, deployable |
| `qa-automation` | Active — Playwright generator and E2E suite development |
