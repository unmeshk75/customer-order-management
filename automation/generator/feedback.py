"""
feedback.py
────────────────────────────────────────────────────────────────────────────
Re-prompt Claude with Playwright failure traces to self-heal a failing test.

Usage:
  from feedback import retry_on_failure
  success = retry_on_failure(client, filepath, original_system, original_user, manifest)
────────────────────────────────────────────────────────────────────────────
"""

import os
import subprocess
import json

from llm_client import LLMClient
from writer import write_file

MAX_ITERATIONS = 3


def run_playwright(spec_file: str, e2e_dir: str) -> tuple[bool, str]:
    """
    Run `npx playwright test <spec_file>` from the automation/ directory.
    Returns (passed, trace_output).
    """
    automation_dir = os.path.normpath(os.path.join(e2e_dir, '..'))
    result = subprocess.run(
        ['npx', 'playwright', 'test', spec_file, '--reporter=list'],
        cwd=automation_dir,
        capture_output=True,
        text=True,
        timeout=120,
    )
    output = result.stdout + '\n' + result.stderr
    return result.returncode == 0, output.strip()


def _build_fix_prompt(
    original_system: str,
    original_user: str,
    current_code: str,
    failure_trace: str,
    manifest: dict,
) -> tuple[str, str]:
    """Build a re-prompt that asks Claude to fix the failing file."""

    system = original_system + '\n\nYou are fixing a previously generated file that failed.'

    user = f"""The generated file below failed when run with Playwright.
Fix it based on the failure trace. Keep the same overall structure and test logic.

=== FAILURE TRACE (verbatim — do not summarise) ===
{failure_trace}

=== CURRENT FILE (to be fixed) ===
{current_code}

=== SELECTOR MANIFEST (ground truth) ===
{json.dumps(manifest, indent=2)}

=== ORIGINAL GENERATION PROMPT ===
{original_user}

Return ONLY the corrected JavaScript file content. No markdown, no explanation.
"""
    return system, user


def retry_on_failure(
    client: LLMClient,
    filepath: str,
    original_system: str,
    original_user: str,
    manifest: dict,
    e2e_dir: str | None = None,
) -> bool:
    """
    Run the spec, and if it fails re-generate with the failure trace.
    Loops up to MAX_ITERATIONS times.

    Returns True if eventually passing, False if all retries exhausted.
    """
    if e2e_dir is None:
        e2e_dir = os.path.normpath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'e2e')
        )

    for attempt in range(1, MAX_ITERATIONS + 1):
        passed, trace = run_playwright(filepath, e2e_dir)
        if passed:
            print(f'[feedback] ✓ passed on attempt {attempt}')
            return True

        print(f'[feedback] attempt {attempt}/{MAX_ITERATIONS} failed — re-prompting...')

        with open(filepath, encoding='utf-8') as f:
            current_code = f.read()

        fix_system, fix_user = _build_fix_prompt(
            original_system, original_user, current_code, trace, manifest
        )
        fixed_code = client.generate(fix_system, fix_user, label=f'fix attempt {attempt}')
        write_file(filepath, fixed_code)

    # Final check
    passed, _ = run_playwright(filepath, e2e_dir)
    if passed:
        print(f'[feedback] ✓ passed after final fix')
        return True

    print(f'[feedback] ✗ still failing after {MAX_ITERATIONS} attempts — manual review needed')
    return False
