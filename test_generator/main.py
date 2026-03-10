"""
main.py
CLI entrypoint for the test generator.

Usage:
  python -m test_generator.main --input "test that state dropdown shows for US" --output test_ui_tc_man_03.py
  python -m test_generator.main --input path/to/TC-MAN-03.csv --output test_ui_tc_man_03.py
  python -m test_generator.main --input path/to/TC-MAN-03.csv          # auto-names output
"""

import argparse
import sys
from pathlib import Path

from test_generator.input_parser import parse
from test_generator.generator   import generate_test
from test_generator.writer      import save


def _auto_output_name(raw_input: str) -> str:
    """Derive a filename from a CSV path or generate a generic one."""
    path = Path(raw_input.strip())
    if path.suffix.lower() == ".csv" and path.exists():
        # TC-MAN-03.csv → test_ui_tc_man_03.py
        stem = path.stem.lower().replace("-", "_").replace(" ", "_")
        return f"test_ui_{stem}.py"
    return "test_ui_generated.py"


def main():
    parser = argparse.ArgumentParser(
        description="Generate a Playwright test from a statement or CSV test case."
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Plain text statement, path to CSV file, or inline CSV string.",
    )
    parser.add_argument(
        "--output", "-o",
        default=None,
        help="Output filename (saved to tests/). Auto-derived from input if omitted.",
    )
    parser.add_argument(
        "--mode", "-m",
        choices=["api", "sdk"],
        default="api",
        help=(
            "'api' uses Anthropic API (requires ANTHROPIC_API_KEY). "
            "'sdk' uses your local Claude Code subscription (no API key needed)."
        ),
    )
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Suppress streaming output.",
    )
    args = parser.parse_args()

    # 1. Parse input → normalised text
    normalised = parse(args.input)
    print(f"[input_parser]  Input normalised ({len(normalised)} chars)")
    print(f"[generator]     Mode: {args.mode}")

    # 2. Generate → Python source
    code = generate_test(normalised, verbose=not args.quiet, mode=args.mode)
    if not code.strip():
        print("ERROR: Claude returned empty output.", file=sys.stderr)
        sys.exit(1)

    # 3. Determine output filename
    output_name = args.output or _auto_output_name(args.input)

    # 4. Save
    output_path = save(code, output_name)
    print(f"[writer]  Saved → {output_path}")


if __name__ == "__main__":
    main()
