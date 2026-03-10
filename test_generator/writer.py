"""
writer.py
Saves the generated test code to the tests/ directory.
"""

from pathlib import Path

TESTS_DIR = Path(__file__).parent.parent / "tests"


def save(code: str, filename: str) -> Path:
    """
    Write the generated code to tests/<filename>.
    Creates the directory if it doesn't exist.
    Returns the absolute path of the written file.
    """
    TESTS_DIR.mkdir(parents=True, exist_ok=True)

    if not filename.endswith(".py"):
        filename += ".py"

    output_path = TESTS_DIR / filename
    output_path.write_text(code, encoding="utf-8")
    return output_path
