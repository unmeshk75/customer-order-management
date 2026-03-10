"""
input_parser.py
Normalises different input formats into a single plain-text string
that the prompt builder can embed in the user message.

Supported inputs:
  - Plain text statement  e.g. "Test that state dropdown shows for US"
  - CSV file path         e.g. "path/to/TC-MAN-03.csv"
  - Raw CSV string        (detected by presence of newlines + commas)
"""

import csv
import io
from pathlib import Path


def parse(raw_input: str) -> str:
    """
    Accept any of the supported input formats and return
    a normalised plain-text description of the test case.
    """
    stripped = raw_input.strip()

    # --- CSV file path ---
    path = Path(stripped)
    if path.suffix.lower() == ".csv" and path.exists():
        return _parse_csv_file(path)

    # --- Inline CSV string (has commas AND newlines) ---
    if "\n" in stripped and "," in stripped:
        return _parse_csv_string(stripped)

    # --- Plain text statement ---
    return stripped


# ── helpers ──────────────────────────────────────────────────────────────────

def _parse_csv_file(path: Path) -> str:
    return _parse_csv_string(path.read_text(encoding="utf-8-sig"))


def _parse_csv_string(raw: str) -> str:
    """
    Convert a test-case CSV into a structured plain-text block.
    Handles the format used in the project's Manual_TestCases CSV files.
    """
    reader = csv.reader(io.StringIO(raw))
    rows = [row for row in reader if any(cell.strip() for cell in row)]

    lines: list[str] = []
    in_steps = False

    for row in rows:
        non_empty = [c.strip() for c in row if c.strip()]
        if not non_empty:
            continue

        first = non_empty[0]

        # Section headers
        if first.startswith("Test Case:"):
            lines.append(f"TEST CASE ID: {first.replace('Test Case:', '').strip()}")
            if len(non_empty) > 1:
                lines.append(f"TITLE: {non_empty[1]}")
            continue

        if first in ("PRE-CONDITIONS", "PASS CRITERIA"):
            lines.append(f"\n{first}:")
            in_steps = False
            continue

        if first == "Step #":
            lines.append("\nSTEPS:")
            in_steps = True
            continue

        # Step rows:  Step#, Action, Input, Expected, Actual, Status
        if in_steps and first.isdigit():
            step_num = first
            action   = row[1].strip() if len(row) > 1 else ""
            data     = row[2].strip() if len(row) > 2 else ""
            expected = row[3].strip() if len(row) > 3 else ""
            parts = [f"  Step {step_num}: {action}"]
            if data:
                parts.append(f"    Input: {data}")
            if expected:
                parts.append(f"    Expected: {expected}")
            lines.append("\n".join(parts))
            continue

        # Generic key-value rows (Group, Priority, etc.)
        if len(non_empty) >= 2:
            lines.append(f"{non_empty[0]} {non_empty[1]}")
        else:
            lines.append(first)

    return "\n".join(lines)
