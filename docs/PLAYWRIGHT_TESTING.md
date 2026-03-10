# Playwright UI Test Guide

This guide covers running the existing Playwright tests and generating new ones with the LLM-powered test generator.

---

## Prerequisites

Both the backend and frontend must be running before any UI test is executed.

```bash
# Terminal 1 — backend
cd backend
venv\Scripts\activate       # Windows
source venv/bin/activate    # Mac/Linux
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

Install Python test dependencies (once):

```bash
cd backend
pip install -r requirements.txt
```

---

## Configuration

All UI tests read their settings from environment variables defined in `tests/ui_config.py`.
Default values work out of the box for a standard local setup.

| Environment variable | Default | Description |
|---------------------|---------|-------------|
| `FRONTEND_URL` | `http://localhost:5173` | URL of the React dev server |
| `BACKEND_URL`  | `http://localhost:8000` | URL of the FastAPI backend |
| `CHROME_PATH`  | `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe` | Fallback system Chrome path — only used if Playwright's built-in Chromium is not installed |

**Override example (PowerShell):**
```powershell
$env:FRONTEND_URL = "http://localhost:3000"
$env:BACKEND_URL  = "http://localhost:9000"
pytest tests/test_ui_tc_man_01.py -v -s
```

**Override example (bash):**
```bash
FRONTEND_URL=http://localhost:3000 pytest tests/test_ui_tc_man_01.py -v -s
```

### Browser selection

`launch_browser()` in `ui_config.py` automatically picks the right browser:

1. **Playwright built-in Chromium** — used if installed via `playwright install chromium`
2. **System Chrome at `CHROME_PATH`** — fallback if built-in Chromium is unavailable
   (common in corporate environments where the Playwright CDN is blocked)

---

## Running a single UI test

```bash
# From the project root, with the venv active
pytest tests/test_ui_tc_man_01.py -v -s
```

> `-s` is required — it allows the Playwright Inspector (`page.pause()`) to open.
> Without it, pytest captures stdout and the Inspector will not appear.

Each test pauses at every step. In the **Playwright Inspector** window:
- Review the browser state visually
- Click **Resume (▶)** to proceed to the next step

### Run a specific test function

```bash
pytest tests/test_ui_tc_man_04.py::test_tc_man_04_consumer_product_filter -v -s
```

### Run all UI tests

```bash
pytest tests/test_ui_tc_man_*.py -v -s
```

### Run without pauses (headless, CI mode)

Remove or comment out `page.pause()` calls, then:

```bash
pytest tests/test_ui_tc_man_*.py -v
```

---

## Test inventory

| File | TC ID | What it tests |
|------|-------|---------------|
| `test_ui_tc_man_01.py` | TC-MAN-01 | Typing 'US' renders the State dropdown (50 states) |
| `test_ui_tc_man_02.py` | TC-MAN-02 | Switching country away from US hides dropdown & clears state |
| `test_ui_tc_man_03.py` | TC-MAN-03 | Selecting a customer dynamically loads the products section |
| `test_ui_tc_man_04.py` | TC-MAN-04 | Consumer sees only Basic & Professional products (+ API enforcement) |
| `test_ui_tc_man_05.py` | TC-MAN-05 | SMB sees only Professional & Teams products (+ API enforcement) |

---

## LLM Test Generator

The `test_generator/` package uses Claude to generate new Playwright test files from a short description or a CSV test case.

### Setup

```bash
# API mode — requires an Anthropic API key
pip install anthropic
export ANTHROPIC_API_KEY=sk-ant-...   # PowerShell: $env:ANTHROPIC_API_KEY = "sk-ant-..."

# SDK mode — uses your local Claude Code subscription (no API key needed)
pip install claude-agent-sdk
```

### Generate from a plain statement

```bash
# API mode (default)
python -m test_generator.main \
  --input "Test that Enterprise customers can buy Basic, Teams and Ultra-Enterprise products" \
  --output test_ui_tc_man_06.py

# SDK mode (Claude Code subscription)
python -m test_generator.main \
  --input "Test that Enterprise customers can buy Basic, Teams and Ultra-Enterprise products" \
  --output test_ui_tc_man_06.py \
  --mode sdk
```

### Generate from a CSV test case file

```bash
python -m test_generator.main \
  --input "path/to/TC-MAN-06.csv" \
  --mode api
```

The output filename is auto-derived from the CSV filename if `--output` is omitted.

### All CLI flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--input` | `-i` | *(required)* | Plain text statement, CSV file path, or raw CSV string |
| `--output` | `-o` | auto-derived | Output filename saved to `tests/` |
| `--mode` | `-m` | `api` | `api` = Anthropic API key · `sdk` = Claude Code subscription |
| `--quiet` | `-q` | off | Suppress streamed token output |

### How it works

```
Input (statement / CSV)
        │
        ▼
input_parser.py    →  normalised plain text
        │
        ▼
prompt_builder.py  →  system prompt:
                         • TESTING.md (DOM structure + business rules)
                         • TC-MAN-01 … TC-MAN-05 as few-shot examples
        │
        ▼
generator.py       →  Claude API / SDK  (streaming)
        │
        ▼
writer.py          →  tests/test_ui_tc_man_XX.py
```

### Adding new few-shot examples

Once you write a new manual test and verify it works, register it so future generated tests learn from it:

```python
# test_generator/context_loader.py
EXAMPLE_FILES = [
    "test_ui_tc_man_01.py",
    ...
    "test_ui_tc_man_06.py",   # ← add here
]
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `playwright install chromium` fails (SSL error) | Set `CHROME_PATH` to your system Chrome and skip the install — the fallback kicks in automatically |
| `ImportError: cannot import name 'ToolAnnotations'` | Run `pip uninstall mcp -y && pip install "mcp>=1.0.0"` (stop the backend server first) |
| Inspector does not open | Run pytest with `-s` flag |
| Tests fail with connection errors | Ensure backend is on port 8000 and frontend is on port 5173 (or override via env vars) |
| Generated test uses wrong URL or Chrome path | The generator reads the few-shot examples — update `ui_config.py` and the examples will teach the new defaults automatically |
