"""
validator.py
────────────────────────────────────────────────────────────────────────────
Static validation of generated JavaScript files.

Two checks:
  1. Syntax — `node --check <file>` (Node.js already present in automation/)
  2. Manifest cross-reference — warn if a literal getByTestId('x') value
     is not present in the selector manifest.
     Template literals (getByTestId(`edit-${id}`)) are SKIPPED — only
     static string literals are checked.
  3. Wait constraint — warn if setTimeout / waitForTimeout appears in the file.
────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import subprocess

from extractor import load as load_manifest

# Matches static string getByTestId calls:  getByTestId('foo')  or  getByTestId("foo")
_TESTID_LITERAL_RE = re.compile(r"""getByTestId\(\s*['"]([^'"]+)['"]\s*\)""")

# Detects hardcoded wait patterns
_HARDCODED_WAIT_RE = re.compile(
    r'(setTimeout|waitForTimeout|sleep\(|\.wait\(\s*\d)',
    re.IGNORECASE,
)


def check_syntax(filepath: str) -> tuple[bool, str]:
    """
    Run `node --check <filepath>` to validate JS syntax.
    Returns (passed, error_message).
    """
    result = subprocess.run(
        ['node', '--check', filepath],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return False, result.stderr.strip()
    return True, ''


def check_manifest(filepath: str, manifest: dict | None = None) -> list[str]:
    """
    Read the file, extract all static getByTestId('x') calls, and warn
    for any 'x' that is not in the selector manifest.

    Returns a list of warning strings (empty = no issues).
    """
    if manifest is None:
        try:
            manifest = load_manifest()
        except FileNotFoundError:
            return []  # manifest not generated yet — skip check

    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    warnings: list[str] = []
    for m in _TESTID_LITERAL_RE.finditer(content):
        value = m.group(1)
        if value not in manifest:
            warnings.append(
                f'  ⚠  getByTestId("{value}") — not found in selector manifest'
            )
    return warnings


def check_wait_constraints(filepath: str) -> list[str]:
    """
    Scan for hardcoded waits / timeouts in generated code.
    Returns list of violation lines.
    """
    violations: list[str] = []
    with open(filepath, encoding='utf-8') as f:
        for i, line in enumerate(f, start=1):
            if _HARDCODED_WAIT_RE.search(line):
                violations.append(f'  ✗  line {i}: {line.rstrip()}')
    return violations


def validate(filepath: str, manifest: dict | None = None) -> tuple[bool, list[str]]:
    """
    Run all checks on a generated file.

    Returns (passed, messages) where:
      passed   — False only if syntax check fails (hard failure)
      messages — warnings for manifest / wait-constraint issues
    """
    messages: list[str] = []

    # 1. Syntax
    syntax_ok, syntax_err = check_syntax(filepath)
    if not syntax_ok:
        messages.append(f'[SYNTAX ERROR] {syntax_err}')
        return False, messages

    messages.append('[syntax] ✓ OK')

    # 2. Manifest xref
    manifest_warns = check_manifest(filepath, manifest)
    if manifest_warns:
        messages.append('[manifest xref] warnings:')
        messages.extend(manifest_warns)
    else:
        messages.append('[manifest xref] ✓ all testids found')

    # 3. Wait constraints
    wait_violations = check_wait_constraints(filepath)
    if wait_violations:
        messages.append('[wait constraint] VIOLATIONS — hardcoded delays detected:')
        messages.extend(wait_violations)
    else:
        messages.append('[wait constraint] ✓ no hardcoded waits')

    return True, messages


def validate_all(directory: str, manifest: dict | None = None) -> dict[str, tuple[bool, list[str]]]:
    """
    Validate every .js file under a directory tree.
    Returns {filepath: (passed, messages)}.
    """
    results: dict[str, tuple[bool, list[str]]] = {}
    for root, _, files in os.walk(directory):
        for fname in files:
            if fname.endswith('.js'):
                fpath = os.path.join(root, fname)
                results[fpath] = validate(fpath, manifest)
    return results
