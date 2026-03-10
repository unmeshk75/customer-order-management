"""
prompt_builder.py
Assembles the system prompt and the user message sent to Claude.
Keeps prompt logic separate from the API call logic.
"""

from test_generator.context_loader import load_app_context, load_examples


SYSTEM_PROMPT_TEMPLATE = """\
You are a QA automation engineer specialising in Playwright (Python, sync API).

## Application context
The following document describes the Customer Order Management application,
its DOM element IDs, data-testid attributes, and business rules:

{app_context}

## Code style rules
- Use `sync_playwright` (never async).
- Import shared config at the top: `from tests.ui_config import FRONTEND_URL, BACKEND_URL, launch_browser`
- For tests that call the API directly also add: `API_URL = f"{{BACKEND_URL}}/api"`
- Browser fixture must use `launch_browser(p)` — never call `p.chromium.launch(...)` directly.
  `launch_browser` tries Playwright's built-in Chromium first; falls back to system Chrome automatically.
- Fixture scope: "module".
- Navigate to the app using `FRONTEND_URL` (default http://localhost:5173).
- Call the backend API using `BACKEND_URL` (default http://localhost:8000).
- Always insert `page.pause()` after EVERY step with a comment explaining what to verify.
- Use `page.get_by_test_id(...)` for elements that have data-testid attributes.
- Use `page.locator("#id")` for elements referenced only by id.
- Use `expect(...)` for all assertions (never bare `assert` on Playwright locators).
- Pre-conditions must be set up in code BEFORE Step 1.
- One test function per file. File name pattern: test_ui_tc_man_XX.py
- Include the TC id, title, module, type, and priority in the module docstring.

## Few-shot examples
The following are REAL, working test files that follow the exact style you must produce.
Study them carefully before generating new code.

{examples}
"""

USER_PROMPT_TEMPLATE = """\
Generate a complete Playwright test file for the following test case.
Follow the style of the few-shot examples exactly.

{test_input}
"""


def build_system_prompt() -> str:
    app_context = load_app_context()
    examples = load_examples()

    example_blocks = "\n\n".join(
        f"### {ex['filename']}\n```python\n{ex['code']}\n```"
        for ex in examples
    )

    return SYSTEM_PROMPT_TEMPLATE.format(
        app_context=app_context,
        examples=example_blocks,
    )


def build_user_prompt(test_input: str) -> str:
    return USER_PROMPT_TEMPLATE.format(test_input=test_input.strip())
