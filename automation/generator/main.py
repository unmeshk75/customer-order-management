"""
main.py
────────────────────────────────────────────────────────────────────────────
CLI entry point for the LLM test generation system.

Subcommands:
  e2e    — Generate entire e2e/ folder (locators + pages + static files)
  tests  — Generate test spec files from an Excel/CSV/JSON/text input

Backend flags (add to any subcommand):
  --sdk   Use Claude Code CLI (no API key needed, uses Claude Code subscription)
          Default: Anthropic API (requires ANTHROPIC_API_KEY in .env)

Usage (from automation/generator/ with venv active):
  python main.py e2e
  python main.py e2e --sdk
  python main.py e2e --only locators
  python main.py e2e --only pages
  python main.py e2e --output ../e2e-generated

  python main.py tests --input test_cases.xlsx
  python main.py tests --input test_cases.xlsx --sdk
  python main.py tests --input "TC-01: Customer can be created" --type positive
  python main.py tests --output ../e2e-generated/tests
────────────────────────────────────────────────────────────────────────────
"""

import argparse
import os
import sys

# Add generator directory to path for sibling imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

import extractor
import input_parser
import prompt_builder
import validator
import writer
from llm_client import create_client, LLMClient, SDKClient

_HERE   = os.path.dirname(os.path.abspath(__file__))
_E2E_REF = os.path.normpath(os.path.join(_HERE, '..', 'e2e'))

# ── entity configuration ──────────────────────────────────────────────────
ENTITIES = ['Customer', 'Product', 'Order', 'Dashboard', 'Navigation', 'Modal']

# Entities that get a Page object generated (Navigation and Modal are locator-only)
PAGE_ENTITIES = ['Customer', 'Product', 'Order', 'Dashboard']

# Static files to copy verbatim from reference e2e/
STATIC_COPIES = [
    'pages/BasePage.js',
    'utils/ApiHelper.js',
    'playwright.config.cjs',  # lives in automation/ not e2e/, handled separately
    'package.json',           # lives in automation/ not e2e/, handled separately
]


# ══════════════════════════════════════════════════════════════════════════
# Pipeline A helpers
# ══════════════════════════════════════════════════════════════════════════

def _generate_locators(client: LLMClient | SDKClient, manifest: dict, output_dir: str) -> dict[str, str]:
    """
    Generate all *Locators.js files.
    Returns {entity_name: generated_code} for use by page generation step.
    """
    generated: dict[str, str] = {}

    for entity in ENTITIES:
        subset = extractor.get_entity_entries(manifest, entity.lower())
        if not subset:
            print(f'  [locators] skipping {entity} — no manifest entries')
            continue

        system, user = prompt_builder.build_locator_prompt(entity, subset)
        code = client.generate(system, user, label=f'{entity}Locators.js')
        generated[entity] = code

        out_path = os.path.join(output_dir, 'locators', f'{entity}Locators.js')
        writer.write_file(out_path, code)

        # validate
        passed, msgs = validator.validate(out_path, manifest)
        for m in msgs:
            print(f'    {m}')
        if not passed:
            print(f'  [!] syntax error in {entity}Locators.js — review manually')

    return generated


def _generate_pages(
    client: LLMClient | SDKClient,
    locator_map: dict[str, str],
    output_dir: str,
    manifest: dict,
) -> dict[str, str]:
    """
    Generate all *Page.js files.
    Returns {entity_name: generated_code} for use by test generation step.
    """
    generated: dict[str, str] = {}

    for entity in PAGE_ENTITIES:
        if entity not in locator_map:
            # Try to read from output dir if locators were generated in a previous run
            loc_path = os.path.join(output_dir, 'locators', f'{entity}Locators.js')
            if os.path.exists(loc_path):
                with open(loc_path, encoding='utf-8') as f:
                    locator_map[entity] = f.read()
            else:
                print(f'  [pages] skipping {entity} — no locator file found')
                continue

        system, user = prompt_builder.build_page_prompt(entity, locator_map[entity])
        code = client.generate(system, user, label=f'{entity}Page.js')
        generated[entity] = code

        out_path = os.path.join(output_dir, 'pages', f'{entity}Page.js')
        writer.write_file(out_path, code)

        passed, msgs = validator.validate(out_path, manifest)
        for m in msgs:
            print(f'    {m}')
        if not passed:
            print(f'  [!] syntax error in {entity}Page.js — review manually')

    return generated


def _write_static_files(output_dir: str) -> None:
    """Copy BasePage.js and ApiHelper.js from reference; scaffold config files."""
    # BasePage.js and ApiHelper.js — copy verbatim from reference e2e/
    writer.copy_reference_file('pages/BasePage.js', output_dir)
    writer.copy_reference_file('utils/ApiHelper.js', output_dir)

    # playwright.config.cjs and package.json — copy from automation/ root
    automation_dir = os.path.normpath(os.path.join(_HERE, '..'))
    for fname in ('playwright.config.cjs', 'package.json'):
        src  = os.path.join(automation_dir, fname)
        dest = os.path.join(output_dir, '..', fname)  # sibling of e2e-generated/
        if os.path.exists(src) and not os.path.exists(dest):
            import shutil
            shutil.copy2(src, dest)
            print(f'  [copy]  {dest}')


def _write_barrel(output_dir: str) -> None:
    """Write locators.js barrel re-export."""
    barrel_path = os.path.join(output_dir, 'locators.js')
    content = prompt_builder.build_barrel_content(ENTITIES)
    writer.write_file(barrel_path, content)


# ══════════════════════════════════════════════════════════════════════════
# Pipeline A — generate e2e/
# ══════════════════════════════════════════════════════════════════════════

def cmd_e2e(args) -> None:
    output_dir = os.path.abspath(args.output)
    only       = args.only  # None | 'locators' | 'pages'

    print(f'\n[e2e] output directory: {output_dir}')
    writer.scaffold_output_dir(output_dir)

    client = create_client(use_sdk=args.sdk)

    # Step 1: extract selectors
    print('\n[e2e] step 1 — extracting selectors from JSX...')
    manifest = extractor.extract()
    print(f'[e2e] {len(manifest)} selectors extracted')

    if only == 'locators' or only is None:
        print('\n[e2e] step 2 — generating locator files...')
        locator_map = _generate_locators(client, manifest, output_dir)
    else:
        locator_map = {}

    if only == 'pages' or only is None:
        print('\n[e2e] step 3 — generating page object files...')
        _generate_pages(client, locator_map, output_dir, manifest)

    if only is None:
        print('\n[e2e] step 4 — writing static / copied files...')
        _write_static_files(output_dir)
        _write_barrel(output_dir)

    print(f'\n[e2e] ✓ done — output: {output_dir}')


# ══════════════════════════════════════════════════════════════════════════
# Pipeline B — generate tests from input
# ══════════════════════════════════════════════════════════════════════════

def cmd_tests(args) -> None:
    output_dir = os.path.abspath(args.output)
    os.makedirs(output_dir, exist_ok=True)

    print(f'\n[tests] input:  {args.input}')
    print(f'[tests] output: {output_dir}')

    # Parse test cases
    test_cases = input_parser.parse(args.input, args.type or '')
    if not test_cases:
        print('[tests] no test cases parsed — check your input')
        return
    print(f'[tests] parsed {len(test_cases)} test case(s)')

    # Load manifest (for validation)
    try:
        manifest = extractor.load()
    except FileNotFoundError:
        print('[tests] selector_manifest.json not found — run `python main.py e2e --only locators` first')
        print('[tests] continuing without manifest validation...')
        manifest = {}

    client = create_client(use_sdk=args.sdk)

    # Group by entity
    groups = input_parser.group_by_entity(test_cases)

    for entity, tcs in groups.items():
        print(f'\n[tests] entity: {entity} ({len(tcs)} test case(s))')

        # Load page object for context
        page_code = _load_page_code(entity, output_dir)

        for tc in tcs:
            system, user = prompt_builder.build_test_prompt([tc], entity, page_code)
            code = client.generate(system, user, label=f'{tc["id"]} — {tc["name"]}')

            fname    = writer.tc_filename(tc['id'])
            out_path = os.path.join(output_dir, fname)
            writer.write_file(out_path, code)

            # Validate
            passed, msgs = validator.validate(out_path, manifest)
            for m in msgs:
                print(f'    {m}')
            if not passed:
                print(f'  [!] syntax error in {fname} — review manually')

    print(f'\n[tests] ✓ done — {len(test_cases)} spec file(s) written to {output_dir}')


def _load_page_code(entity: str, output_dir: str) -> str:
    """
    Try to load an already-generated *Page.js from:
      1. output_dir/pages/
      2. reference e2e/pages/ (fallback)
    """
    # Check generated output first
    gen_path = os.path.join(output_dir, '..', 'pages', f'{entity}Page.js')
    if os.path.exists(gen_path):
        with open(gen_path, encoding='utf-8') as f:
            return f.read()

    # Fallback: reference e2e/
    ref_path = os.path.join(_E2E_REF, 'pages', f'{entity}Page.js')
    if os.path.exists(ref_path):
        with open(ref_path, encoding='utf-8') as f:
            return f.read()

    return f'// {entity}Page.js not found — generate pages first with: python main.py e2e --only pages'


# ══════════════════════════════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(
        description='LLM-powered Playwright test generation',
        formatter_class=argparse.RawTextHelpFormatter,
    )
    sub = parser.add_subparsers(dest='command', required=True)

    # ── e2e subcommand ────────────────────────────────────────────────────
    e2e_p = sub.add_parser(
        'e2e',
        help='Generate entire e2e/ folder (locators + pages + static files)',
    )
    e2e_p.add_argument(
        '--output', '-o',
        default=os.path.normpath(os.path.join(_HERE, '..', 'e2e-generated')),
        help='Output directory (default: automation/e2e-generated/)',
    )
    e2e_p.add_argument(
        '--only',
        choices=['locators', 'pages'],
        default=None,
        help='Generate only locators or only pages (default: both)',
    )
    e2e_p.add_argument(
        '--sdk',
        action='store_true',
        default=False,
        help='Use Claude Code CLI instead of Anthropic API (no API key needed)',
    )

    # ── tests subcommand ──────────────────────────────────────────────────
    tests_p = sub.add_parser(
        'tests',
        help='Generate test spec files from Excel/CSV/JSON/text input',
    )
    tests_p.add_argument(
        '--input', '-i',
        required=True,
        help=(
            'Input source:\n'
            '  path/to/test_cases.xlsx\n'
            '  path/to/test_cases.csv\n'
            '  \'{"id":"TC-01","name":"...","scenario":"...","expected":"...","type":"positive"}\'\n'
            '  "TC-01: Customer creation with valid data"'
        ),
    )
    tests_p.add_argument(
        '--type', '-t',
        choices=['positive', 'negative', ''],
        default='',
        help='Force test type for plain-text input (auto-inferred if not set)',
    )
    tests_p.add_argument(
        '--output', '-o',
        default=os.path.normpath(os.path.join(_HERE, '..', 'e2e-generated', 'tests')),
        help='Output directory for test specs (default: automation/e2e-generated/tests/)',
    )
    tests_p.add_argument(
        '--sdk',
        action='store_true',
        default=False,
        help='Use Claude Code CLI instead of Anthropic API (no API key needed)',
    )

    args = parser.parse_args()

    if args.command == 'e2e':
        cmd_e2e(args)
    elif args.command == 'tests':
        cmd_tests(args)


if __name__ == '__main__':
    main()
