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
  python main.py e2e                                       # Anthropic API (default)
  python main.py e2e --provider sdk                        # Claude Code CLI
  python main.py e2e --provider gemini                     # Google Gemini API
  python main.py e2e --provider vertexai                   # Google Vertex AI
  python main.py e2e --only locators
  python main.py e2e --only pages
  python main.py e2e --output ../e2e-generated
  python main.py e2e --src /path/to/other-react-app/src   # any React app

  python main.py tests --input test_cases.xlsx
  python main.py tests --input test_cases.xlsx --provider gemini
  python main.py tests --input "TC-01: Customer can be created" --type positive
  python main.py tests --output ../e2e-generated/tests
────────────────────────────────────────────────────────────────────────────
"""

import argparse
import json
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
from llm_client import create_client, LLMClient, SDKClient, GeminiClient, VertexAIClient

_HERE   = os.path.dirname(os.path.abspath(__file__))
_E2E_REF = os.path.normpath(os.path.join(_HERE, 'e2e-sample'))

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

def _generate_locators(
    client: LLMClient | SDKClient,
    manifest: dict,
    output_dir: str,
    entities: list[str],
) -> dict[str, str]:
    """
    Generate all *Locators.js files.
    Returns {entity_name: generated_code} for use by page generation step.
    """
    generated: dict[str, str] = {}

    for entity in entities:
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
    page_entities: list[str],
) -> dict[str, str]:
    """
    Generate all *Page.js files.
    Returns {entity_name: generated_code} for use by test generation step.
    """
    generated: dict[str, str] = {}

    for entity in page_entities:
        if entity not in locator_map:
            # Try to read from output dir if locators were generated in a previous run]
            loc_path = os.path.join(output_dir, 'locators', f'{entity}Locators.js')
            if os.path.exists(loc_path):
                with open(loc_path, encoding='utf-8') as f:
                    locator_map[entity] = f.read()
            else:
                print(f'  [pages] skipping {entity} — no locator file found')
                continue

        system, user = prompt_builder.build_page_prompt(entity, locator_map[entity])
        code = client.generate(system, user, label=f'{entity}Page.js')
        code = _fix_page_imports(code, entity)
        generated[entity] = code

        out_path = os.path.join(output_dir, 'pages', f'{entity}Page.js')
        writer.write_file(out_path, code)

        passed, msgs = validator.validate(out_path, manifest)
        for m in msgs:
            print(f'    {m}')
        if not passed:
            print(f'  [!] syntax error in {entity}Page.js — review manually')

    return generated


_SCOPED_PLAYWRIGHT_CONFIG = """\
const { defineConfig, devices } = require('@playwright/test');

/**
 * Scoped config for automation/e2e-generated/.
 *
 * Used when running a single generated spec from inside this directory:
 *   cd automation/e2e-generated/tests
 *   npx playwright test TC_CUST_03.spec.js
 *
 * Playwright walks up parent directories looking for a config file, so it
 * finds this file when invoked from the tests/ sub-directory.
 *
 * testDir is set to ./tests so only generated specs are in scope — the
 * e2e-sample and other suites are excluded.
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    actionTimeout: 0,
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
});
"""


def _write_static_files(output_dir: str) -> None:
    """Copy BasePage.js and ApiHelper.js from reference; write scoped Playwright config."""
    # BasePage.js and ApiHelper.js — copy verbatim from reference e2e/
    writer.copy_reference_file('pages/BasePage.js', output_dir)
    writer.copy_reference_file('utils/ApiHelper.js', output_dir)
    # Scoped playwright config — allows running single specs from e2e-generated/tests/
    config_path = os.path.join(output_dir, 'playwright.config.cjs')
    with open(config_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(_SCOPED_PLAYWRIGHT_CONFIG)
    print(f'  [write] {config_path}')


def _write_barrel(output_dir: str, entities: list[str]) -> None:
    """Write locators.js barrel re-export."""
    barrel_path = os.path.join(output_dir, 'locators.js')
    content = prompt_builder.build_barrel_content(entities)
    writer.write_file(barrel_path, content)


# ══════════════════════════════════════════════════════════════════════════
# Provider resolution
# ══════════════════════════════════════════════════════════════════════════

def _resolve_provider(args) -> str:
    """
    Derive the provider string from parsed CLI args.

    Priority:
      1. --provider <name>   (explicit, wins over everything)
      2. --sdk               (legacy flag, maps to 'sdk')
      3. default             'anthropic'
    """
    if getattr(args, 'provider', None):
        return args.provider
    if getattr(args, 'sdk', False):
        return 'sdk'
    return 'anthropic'


# ══════════════════════════════════════════════════════════════════════════
# Pipeline A — generate e2e/
# ══════════════════════════════════════════════════════════════════════════

def cmd_e2e(args) -> None:
    output_dir = os.path.abspath(args.output)
    only       = args.only  # None | 'locators' | 'pages'
    src_dir    = os.path.abspath(args.src)

    print(f'\n[e2e] output directory: {output_dir}')
    print(f'[e2e] frontend src:     {src_dir}')
    writer.scaffold_output_dir(output_dir)

    client = create_client(provider=_resolve_provider(args))

    # Step 1: extract selectors
    print('\n[e2e] step 1 — extracting selectors from JSX/TSX...')
    manifest = extractor.extract(src_dir)
    print(f'[e2e] {len(manifest)} selectors extracted')

    if not manifest:
        print('[e2e] ERROR: no selectors found — check that --src points to the React app src/ directory')
        return

    # Derive entity lists from the actual manifest (works for any React app)
    entities      = extractor.get_all_entities(manifest)
    page_entities = extractor.get_page_entities(manifest)
    print(f'[e2e] detected entities:      {entities}')
    print(f'[e2e] page-object entities:   {page_entities}')

    if only == 'locators' or only is None:
        print('\n[e2e] step 2 — generating locator files...')
        locator_map = _generate_locators(client, manifest, output_dir, entities)
    else:
        locator_map = {}

    if only == 'pages' or only is None:
        print('\n[e2e] step 3 — generating page object files...')
        _generate_pages(client, locator_map, output_dir, manifest, page_entities)

    if only is None:
        print('\n[e2e] step 4 — writing static / copied files...')
        _write_static_files(output_dir)
        _write_barrel(output_dir, entities)

    print(f'\n[e2e] ✓ done — output: {output_dir}')


# ══════════════════════════════════════════════════════════════════════════
# Pipeline B — generate tests from input
# ══════════════════════════════════════════════════════════════════════════

def _fix_page_imports(code: str, entity: str) -> str:
    """
    Correct two common LLM mistakes:
    1. Pluralised page class name:  CustomersPage → CustomerPage
    2. Shadowed variable name:      const CustomerPage = new CustomerPage(page)
                                 →  const customerPage = new CustomerPage(page)
    """
    import re as _re

    # Fix 1: pluralised class name in import/usage
    right_class = f'{entity}Page'
    for wrong_class in [f'{entity}sPages', f'{entity}Pages', f'{entity}sPage']:
        if wrong_class in code:
            print(f'  [fix]  corrected pluralised class: {wrong_class} → {right_class}')
            code = code.replace(wrong_class, right_class)

    # Fix 2: variable shadows imported class  →  lowercase the variable
    # Matches:  const CustomerPage = new CustomerPage(   (const/let/var)
    shadow_pattern = _re.compile(
        rf'\b(const|let|var)\s+({right_class})\s*=\s*new\s+{right_class}\s*\('
    )
    if shadow_pattern.search(code):
        var_name = right_class[0].lower() + right_class[1:]  # CustomerPage → customerPage
        print(f'  [fix]  corrected shadowed variable: {right_class} → {var_name}')
        # Replace variable declarations first
        code = shadow_pattern.sub(
            lambda m: f'{m.group(1)} {var_name} = new {right_class}(', code
        )
        # Replace all subsequent usages of the variable (not the class in import lines)
        # Only replace  <PageClass>.method  that appear after "= new PageClass(" context
        # Use a line-by-line approach: skip import lines
        lines = []
        for line in code.splitlines():
            if line.strip().startswith('import ') and right_class in line:
                lines.append(line)
            else:
                lines.append(line.replace(f'{right_class}.', f'{var_name}.'))
        code = '\n'.join(lines)

    return code


def cmd_tests(args) -> None:
    output_dir = os.path.abspath(args.output)
    os.makedirs(output_dir, exist_ok=True)

    print(f'[tests] output: {output_dir}')

    # Load from staging file or parse fresh input
    if args.from_staging:
        staging_path = os.path.abspath(args.from_staging)
        print(f'[tests] loading from staging file: {staging_path}')
        with open(staging_path, encoding='utf-8') as f:
            test_cases = json.load(f)
        print(f'[tests] loaded {len(test_cases)} test case(s) from staging')
    else:
        if not args.input:
            print('[tests] error: --input or --from-staging is required')
            return
        print(f'[tests] input:  {args.input}')
        test_cases = input_parser.parse(args.input, args.type or '')
        if not test_cases:
            print('[tests] no test cases parsed — check your input')
            return
        print(f'[tests] parsed {len(test_cases)} test case(s)')

        # Save intermediary JSON before generation so it can be reviewed / re-used
        staging_path = os.path.join(output_dir, 'parsed_test_cases.json')
        with open(staging_path, 'w', encoding='utf-8') as f:
            json.dump(test_cases, f, indent=2, ensure_ascii=False)
        print(f'[tests] staging file saved -> {staging_path}')

    # Load manifest (for validation)
    try:
        manifest = extractor.load()
    except FileNotFoundError:
        print('[tests] selector_manifest.json not found — run `python main.py e2e --only locators` first')
        print('[tests] continuing without manifest validation...')
        manifest = {}

    if getattr(args, 'dry_run', False):
        client = None
    else:
        client = create_client(provider=_resolve_provider(args))

    # Group by entity, then by spec file within each entity
    groups = input_parser.group_by_entity(test_cases)

    for entity, tcs in groups.items():
        clean_entity = entity.encode("ascii", "ignore").decode()
        print(f'\n[tests] entity: {clean_entity} ({len(tcs)} test case(s))')

        # Load page object for context
        page_code = _load_page_code(entity, output_dir)

        # Sub-group by spec_file; TCs without one get their own file each
        spec_groups: dict[str, list[dict]] = {}
        for tc in tcs:
            key = tc.get('spec_file', '').strip() or writer.tc_filename(tc['id'])
            spec_groups.setdefault(key, []).append(tc)

        for fname, group_tcs in spec_groups.items():
            ids_label = ', '.join(t['id'] for t in group_tcs)
            print(f'  -> {fname}  ({len(group_tcs)} tc: {ids_label})')

            system, user = prompt_builder.build_test_prompt(group_tcs, entity, page_code)
            
            # Save the prompt to a text file
            prompt_fname = fname.replace('.spec.js', '') + '_prompt.txt'
            prompt_out_path = os.path.join(output_dir, prompt_fname)
            writer.write_file(prompt_out_path, f"=== SYSTEM ===\n{system}\n\n=== USER ===\n{user}\n")
            
            if getattr(args, 'dry_run', False):
                print(f'    [dry-run] saved prompt to {prompt_fname}, skipping LLM')
                continue

            code = client.generate(system, user, label=fname)

            # Fix LLM hallucination: pluralised page class/import names
            code = _fix_page_imports(code, entity)

            out_path = os.path.join(output_dir, fname)
            writer.write_file(out_path, code)

            # Validate
            passed, msgs = validator.validate(out_path, manifest)
            for m in msgs:
                print(f'    {m}')
            if not passed:
                print(f'  [!] syntax error in {fname} — review manually')

    print(f'\n[tests] OK - {len(test_cases)} spec file(s) written to {output_dir}')


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
        '--src', '-s',
        default=extractor.DEFAULT_SRC,
        help=(
            'Path to the React app src/ directory containing .jsx/.tsx files\n'
            f'(default: {extractor.DEFAULT_SRC})'
        ),
    )
    e2e_p.add_argument(
        '--only',
        choices=['locators', 'pages'],
        default=None,
        help='Generate only locators or only pages (default: both)',
    )
    e2e_p.add_argument(
        '--provider', '-p',
        choices=['anthropic', 'sdk', 'gemini', 'vertexai'],
        default=None,
        help=(
            'LLM provider to use (default: anthropic):\n'
            '  anthropic — Anthropic API        (needs ANTHROPIC_API_KEY in .env)\n'
            '  sdk       — Claude Code CLI      (needs `claude` on PATH)\n'
            '  gemini    — Google Gemini API    (needs GEMINI_API_KEY in .env)\n'
            '  vertexai  — Google Vertex AI     (needs GCP_CREDENTIALS_PATH, GCP_PROJECT in .env)'
        ),
    )
    e2e_p.add_argument(
        '--sdk',
        action='store_true',
        default=False,
        help='[legacy] Alias for --provider sdk',
    )

    # ── tests subcommand ──────────────────────────────────────────────────
    tests_p = sub.add_parser(
        'tests',
        help='Generate test spec files from Excel/CSV/JSON/text input',
    )
    tests_p.add_argument(
        '--input', '-i',
        required=False,
        default=None,
        help=(
            'Input source:\n'
            '  path/to/test_cases.xlsx\n'
            '  path/to/test_cases.csv\n'
            '  \'{"id":"TC-01","name":"...","scenario":"...","expected":"...","type":"positive"}\'\n'
            '  "TC-01: Customer creation with valid data"'
        ),
    )
    tests_p.add_argument(
        '--from-staging',
        metavar='FILE',
        default=None,
        help=(
            'Skip parsing and load test cases directly from a previously saved\n'
            'parsed_test_cases.json staging file (e.g. after manual review/edits).'
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
        '--provider', '-p',
        choices=['anthropic', 'sdk', 'gemini', 'vertexai'],
        default=None,
        help=(
            'LLM provider to use (default: anthropic):\n'
            '  anthropic — Anthropic API        (needs ANTHROPIC_API_KEY in .env)\n'
            '  sdk       — Claude Code CLI      (needs `claude` on PATH)\n'
            '  gemini    — Google Gemini API    (needs GEMINI_API_KEY in .env)\n'
            '  vertexai  — Google Vertex AI     (needs GCP_CREDENTIALS_PATH, GCP_PROJECT in .env)'
        ),
    )
    tests_p.add_argument(
        '--sdk',
        action='store_true',
        default=False,
        help='[legacy] Alias for --provider sdk',
    )
    tests_p.add_argument(
        '--dry-run',
        action='store_true',
        default=False,
        help='Skip LLM calls and only generate the prompt text files',
    )

    args = parser.parse_args()

    if args.command == 'e2e':
        cmd_e2e(args)
    elif args.command == 'tests':
        cmd_tests(args)


if __name__ == '__main__':
    main()
