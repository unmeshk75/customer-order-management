# LLM Test Generator

A CLI tool that uses Claude (via the Anthropic API or Claude Code CLI) to generate Playwright locators, page objects, and test specs directly from the React source code.

## How It Works

```
JSX components
     │
     ▼
extractor.py  ──→  selector_manifest.json   (extracted data-testid / id values)
     │
     ▼
prompt_builder.py  ──→  system + user prompt  (with manifest + reference examples)
     │
     ▼
llm_client.py  ──→  Claude API / claude CLI   (generates JS code)
     │
     ▼
writer.py  ──→  e2e-generated/               (cleans output, writes files)
     │
     ▼
validator.py  ──→  syntax check              (reports JS errors)
```

## Setup

### Option A — Anthropic API key

```bash
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...
```

### Option B — Claude Code CLI (no API key needed)

Uses your Claude Code subscription. Requires `claude` on PATH:
```bash
npm install -g @anthropic-ai/claude-code
claude --version   # verify
```

Then pass `--sdk` to any command below.

**Activate the shared Python venv first:**
```bash
# From project root
venv/Scripts/activate        # Windows
# source venv/bin/activate   # Mac/Linux
```

## CLI Reference

All commands run from `automation/generator/`:

```bash
cd automation/generator
```

### Generate e2e infrastructure (`e2e` subcommand)

```bash
# Full generation: locators + pages + static files → e2e-generated/
python main.py e2e
python main.py e2e --sdk                  # use Claude Code CLI

# Only locators (fastest, run after UI changes)
python main.py e2e --only locators
python main.py e2e --only locators --sdk

# Only page objects (reads existing locators from e2e-generated/)
python main.py e2e --only pages
python main.py e2e --only pages --sdk

# Custom output directory
python main.py e2e --output ../some-dir
```

### Generate test specs (`tests` subcommand)

```bash
# From an Excel or CSV file
python main.py tests --input test_cases.xlsx
python main.py tests --input test_cases.csv --sdk

# From a JSON test case object
python main.py tests --input '{"id":"TC-01","name":"Customer creation","scenario":"...","expected":"...","type":"positive"}'

# From a plain text description (type is auto-inferred)
python main.py tests --input "TC-01: Customer can be created with valid data"
python main.py tests --input "TC-01: ..." --type positive

# Custom output directory for specs
python main.py tests --input cases.xlsx --output ../e2e-generated/tests
```

### Flags summary

| Flag | Applies to | Description |
|---|---|---|
| `--sdk` | both | Use `claude` CLI instead of Anthropic API |
| `--only locators\|pages` | `e2e` | Generate only one layer |
| `--output PATH` | both | Override output directory |
| `--input SOURCE` | `tests` | Required — file path or inline text/JSON |
| `--type positive\|negative` | `tests` | Force test type for plain-text input |

## File Overview

| File | Purpose |
|---|---|
| `main.py` | CLI entry point, wires subcommands together |
| `extractor.py` | Parses JSX files, extracts `data-testid` and `id` values into `selector_manifest.json` |
| `selector_manifest.json` | Ground truth of all selectors in the app; re-run extractor after UI changes |
| `prompt_builder.py` | Builds system + user prompts for locators, pages, and test specs |
| `llm_client.py` | `LLMClient` (API) and `SDKClient` (claude CLI) with identical `generate()` interface |
| `writer.py` | Strips markdown fences from LLM output, writes files, scaffolds directories |
| `validator.py` | Node.js syntax check on generated `.js` files |
| `input_parser.py` | Parses Excel/CSV/JSON/text into structured test case dicts |
| `feedback.py` | Collects pass/fail feedback to improve future generations |

## Reference Examples (`e2e-sample/`)

The `e2e-sample/` directory contains hand-crafted reference implementations used as few-shot examples in every prompt. The generator reads these at runtime — do not delete them.

```
e2e-sample/
├── locators/    # Reference locator files (one per entity)
├── pages/       # Reference page objects
├── utils/       # ApiHelper reference
└── tests/       # Reference test specs (tc_man_01 – tc_man_05)
```

| Sample test | Covers |
|---|---|
| `tc_man_01.spec.js` | Country→State dropdown: initial disabled state, US triggers dropdown, 50 states present |
| `tc_man_02.spec.js` | Country→State: US→NY confirm, switch to Canada hides dropdown, XPath label assertion |
| `tc_man_03.spec.js` | Order wizard: step navigation, product selection, customer required validation |
| `tc_man_04.spec.js` | Order filters: status/priority checkboxes, active filter chips, API negative test |
| `tc_man_05.spec.js` | Dashboard stats: customer/order/revenue counts match API data |

## Re-extracting Selectors

If the React components change, re-run the extractor to update `selector_manifest.json`:

```bash
cd automation/generator
python extractor.py
```

Then regenerate locators:

```bash
python main.py e2e --only locators --sdk
```

## Output Location

All generated files go to `automation/e2e-generated/` by default (configurable with `--output`). This folder is excluded from manual editing — treat it as build output.
