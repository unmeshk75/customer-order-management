# LLM Test Generator

CLI tool that generates Playwright locator classes, page objects, and test specs from a React app's source code — using Claude, Gemini, or Vertex AI.

## How It Works

```
JSX / TSX source
      │
      ▼
extractor.py  ──→  selector_manifest.json   (all data-testid / id values)
      │
      ▼
prompt_builder.py  ──→  system + user prompt
      │                  (manifest + reference examples from e2e-sample/)
      ▼
llm_client.py  ──→  chosen LLM provider    (streaming output)
      │
      ▼
writer.py  ──→  e2e-generated/             (writes JS files)
      │
      ▼
validator.py  ──→  node --check            (syntax validation)
```

## Setup

### 1. Activate the shared Python venv

```bash
# From the project root
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac / Linux
```

### 2. Configure your LLM provider

Copy `.env.example` to `.env` and fill in the keys for the provider(s) you want to use:

```bash
cp .env.example .env
```

| Provider | Required `.env` keys |
|---|---|
| Anthropic (default) | `ANTHROPIC_API_KEY` |
| Claude Code CLI | *(no key — uses your Claude Code subscription)* |
| Google Gemini API | `GEMINI_API_KEY` |
| Google Vertex AI | `GCP_CREDENTIALS_PATH`, `GCP_PROJECT` |

**Vertex AI:** place your GCP service account JSON file in this directory (`automation/generator/`) and set `GCP_CREDENTIALS_PATH` to its filename (e.g. `gcp_credential_2026.json`). The path is resolved relative to this directory, so just the filename is enough.

**Claude Code CLI:** install the CLI globally — no API key needed:
```bash
npm install -g @anthropic-ai/claude-code
claude --version   # verify
```

**Optional Python packages** (install only what you need):
```bash
pip install google-generativeai          # Gemini API
pip install google-cloud-aiplatform      # Vertex AI
pip install google-auth                  # Vertex AI service account auth
```

## CLI Reference

All commands run from this directory (`automation/generator/`):

```bash
cd automation/generator
```

### `e2e` — generate locators, page objects, and static files

```bash
# Full generation (locators + pages + static files) → automation/e2e-generated/
python main.py e2e

# Choose provider
python main.py e2e --provider anthropic    # default — Anthropic API
python main.py e2e --provider sdk          # Claude Code CLI, no API key
python main.py e2e --provider gemini       # Google Gemini API
python main.py e2e --provider vertexai     # Google Vertex AI

# Generate only one layer
python main.py e2e --only locators         # steps 1–2 only (fastest after UI changes)
python main.py e2e --only pages            # step 3 only (reads existing locators)

# Point at a different React app
python main.py e2e --src /path/to/my-app/src

# Custom output directory
python main.py e2e --output ../some-dir
```

> `--only pages` reads locators already in the output directory. Run `--only locators` first if they do not exist.

### `tests` — generate spec files from test case input

```bash
# From an Excel or CSV file
python main.py tests --input test_cases.xlsx
python main.py tests --input test_cases.csv --provider gemini

# From an inline JSON test case object
python main.py tests --input '{"id":"TC-01","name":"Customer creation","scenario":"...","expected":"...","type":"positive"}'

# From a plain text description (type auto-inferred; override with --type)
python main.py tests --input "TC-01: Customer can be created with valid data"
python main.py tests --input "TC-01: ..." --type positive

# Re-use a previously parsed staging file (skip parsing, skip LLM)
python main.py tests --from-staging parsed_test_cases.json

# Dry run — generate prompt files only, no LLM calls
python main.py tests --input cases.xlsx --dry-run

# Custom output directory
python main.py tests --input cases.xlsx --output ../e2e-generated/tests
```

### All flags

| Flag | Subcommand | Description |
|---|---|---|
| `--provider` / `-p` | both | `anthropic` (default) / `sdk` / `gemini` / `vertexai` |
| `--sdk` | both | Legacy alias for `--provider sdk` |
| `--src` / `-s` | `e2e` | Path to React app `src/` directory (default: `../../frontend/src`) |
| `--only locators\|pages` | `e2e` | Generate only locators or only pages |
| `--output` / `-o` | both | Override output directory |
| `--input` / `-i` | `tests` | File path or inline text / JSON |
| `--type positive\|negative` | `tests` | Force test type for plain-text input |
| `--from-staging FILE` | `tests` | Load from a previously saved `parsed_test_cases.json` |
| `--dry-run` | `tests` | Write prompt files only, skip LLM |

## Environment Variables

All settings go in `.env` in this directory. See `.env.example` for the full list.

| Variable | Provider | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | anthropic | Claude API key |
| `GEMINI_API_KEY` | gemini | Google AI Studio key |
| `GEMINI_MODEL` | gemini | Model override (default: `gemini-2.0-flash`) |
| `GCP_CREDENTIALS_PATH` | vertexai | Filename of the service account JSON (relative to this directory) |
| `GCP_PROJECT` | vertexai | GCP project ID |
| `GCP_LOCATION` | vertexai | Region (default: `us-central1`) |
| `VERTEX_MODEL` | vertexai | Model override (default: `gemini-2.0-flash`) |

## File Overview

| File | Purpose |
|---|---|
| `main.py` | CLI entry point — wires subcommands and provider selection |
| `extractor.py` | Scans `.jsx` / `.tsx` files, extracts `data-testid` and `id` values, writes `selector_manifest.json` |
| `selector_manifest.json` | Ground truth of all selectors — re-run extractor after any UI change |
| `prompt_builder.py` | Builds system + user prompts for locators, pages, and test specs |
| `llm_client.py` | Provider adapters: `LLMClient` (Anthropic), `SDKClient` (claude CLI), `GeminiClient`, `VertexAIClient` |
| `writer.py` | Strips markdown fences, writes files, scaffolds directories |
| `validator.py` | `node --check` syntax validation on generated `.js` files |
| `input_parser.py` | Parses Excel / CSV / JSON / plain text into structured test case dicts |
| `feedback.py` | Collects pass/fail results for future prompt improvement (not yet integrated) |
| `.env` | Local secrets — never commit |
| `.env.example` | Template — copy to `.env` and fill in |

## Reference Examples (`e2e-sample/`)

The `e2e-sample/` directory contains hand-crafted implementations used as few-shot examples in every prompt. Do not delete or rename these files.

```
e2e-sample/
├── locators/    # Reference locator classes
├── pages/       # Reference page objects + BasePage.js
├── utils/       # ApiHelper.js
└── tests/       # Reference specs: tc_man_01 – tc_man_05
```

| Sample | Covers |
|---|---|
| `tc_man_01.spec.js` | Country→State dropdown: initial state, US triggers dropdown, all 50 states present |
| `tc_man_02.spec.js` | US→NY confirm, switch to Canada hides dropdown, XPath label assertion |
| `tc_man_03.spec.js` | Order wizard: step navigation, product selection, customer required validation |
| `tc_man_04.spec.js` | Order filters: status/priority checkboxes, active filter chips, API negative test |
| `tc_man_05.spec.js` | Dashboard stats: customer/order/revenue counts match API data |

## Re-extracting Selectors

Run this whenever React components change:

```bash
python extractor.py
# or via main.py:
python main.py e2e --only locators
```

The extractor scans all `.jsx` and `.tsx` files under the configured `src/` directory and classifies each selector by its entity prefix automatically — it works with any React app that follows `{entity}-{element}` naming.

## Output Location

Generated files go to `automation/e2e-generated/` by default. Change with `--output`. Treat this folder as build output — regenerate rather than hand-edit.
