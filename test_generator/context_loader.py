"""
context_loader.py
Loads static context: TESTING.md (DOM structure, business rules)
and the manually written example Playwright test files.
"""

from pathlib import Path

ROOT = Path(__file__).parent.parent
TESTING_MD   = ROOT / "docs" / "TESTING.md"
EXAMPLES_DIR = ROOT / "tests"

EXAMPLE_FILES = [
    "test_ui_tc_man_01.py",
    "test_ui_tc_man_02.py",
    "test_ui_tc_man_03.py",
    "test_ui_tc_man_04.py",
    "test_ui_tc_man_05.py",
]


def load_app_context() -> str:
    """Return the full contents of TESTING.md as a string."""
    return TESTING_MD.read_text(encoding="utf-8")


def load_examples() -> list[dict]:
    """
    Return a list of dicts:
      { "filename": str, "code": str }
    One entry per manually written example test file.
    """
    examples = []
    for name in EXAMPLE_FILES:
        path = EXAMPLES_DIR / name
        if path.exists():
            examples.append({"filename": name, "code": path.read_text(encoding="utf-8")})
    return examples
