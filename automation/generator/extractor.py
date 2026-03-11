"""
extractor.py
────────────────────────────────────────────────────────────────────────────
Scan frontend JSX source files and build a selector manifest.

For every data-testid and id attribute found, records:
  - the file it came from
  - the HTML element type (button, input, select, div, …)
  - any condition expression guarding it (e.g. "country === 'US'")
  - the entity group (customer / product / order / dashboard / navigation / modal)

Outputs selector_manifest.json in the same directory as this script.
────────────────────────────────────────────────────────────────────────────
"""

import re
import glob
import json
import os

# ── paths ──────────────────────────────────────────────────────────────────
_HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SRC = os.path.normpath(os.path.join(_HERE, '..', '..', 'frontend', 'src'))
MANIFEST_PATH = os.path.join(_HERE, 'selector_manifest.json')

# ── entity keywords ────────────────────────────────────────────────────────
ENTITY_KEYWORDS = {
    'customer':   ['customer', 'contact', 'company', 'state', 'country'],
    'product':    ['product', 'stock', 'price', 'inventory'],
    'order':      ['order', 'wizard', 'checkout', 'seat', 'discount'],
    'dashboard':  ['dashboard', 'revenue', 'stat', 'low-stock', 'lowstock'],
    'navigation': ['nav', 'navigation'],
    'modal':      ['modal', 'confirm', 'overlay', 'dialog'],
}

# ── regex patterns ─────────────────────────────────────────────────────────
# Matches:  data-testid="some-value"  or  data-testid={"some-value"}
_TESTID_RE = re.compile(r'data-testid=(?:"([^"]+)"|{`([^`]+)`}|{\'([^\']+)\'})')

# Matches:  id="some-value"  (skip numeric-only IDs)
_ID_RE = re.compile(r'\bid="([a-zA-Z][^"]*)"')

# Matches the JSX element tag on the same or previous line: <button, <input, …
_ELEMENT_RE = re.compile(r'<(\w+)')

# Matches a JSX conditional guard on the line(s) just before the element:
#   {someCondition &&   or   {isEdit &&
_CONDITION_RE = re.compile(r'\{([^{}]+?)\s*&&\s*$')


def _classify_entity(value: str) -> str:
    """Return the entity group for a testid/id string."""
    low = value.lower()
    for entity, keywords in ENTITY_KEYWORDS.items():
        if any(kw in low for kw in keywords):
            return entity
    return 'general'


def _find_element_type(lines: list[str], line_idx: int) -> str:
    """
    Search backward from line_idx for the nearest opening JSX tag.
    Returns the tag name (button, input, select, div, …) or 'element'.
    """
    for i in range(line_idx, max(line_idx - 6, -1), -1):
        m = _ELEMENT_RE.search(lines[i])
        if m:
            tag = m.group(1).lower()
            if tag not in ('import', 'export', 'const', 'let', 'var', 'return', 'if'):
                return tag
    return 'element'


def _find_condition(lines: list[str], line_idx: int) -> str:
    """
    Look at the preceding lines for a JSX conditional guard expression.
    Returns the condition string or 'always'.
    """
    for i in range(line_idx, max(line_idx - 4, -1), -1):
        m = _CONDITION_RE.search(lines[i])
        if m:
            return m.group(1).strip()
    return 'always'


def extract(src_dir: str = DEFAULT_SRC) -> dict:
    """
    Walk src_dir for *.jsx files, extract all data-testid and id attributes.
    Returns the manifest dict and also writes selector_manifest.json.
    """
    manifest: dict[str, dict] = {}
    jsx_files = glob.glob(os.path.join(src_dir, '**', '*.jsx'), recursive=True)

    if not jsx_files:
        print(f'[extractor] WARNING: no .jsx files found under {src_dir}')
        return manifest

    for filepath in jsx_files:
        filename = os.path.basename(filepath)
        with open(filepath, encoding='utf-8') as f:
            content = f.read()
        lines = content.splitlines()

        # ── data-testid attributes ──────────────────────────────────────────
        for m in _TESTID_RE.finditer(content):
            # group 1 = double-quoted, group 2 = template literal, group 3 = single-quoted
            value = m.group(1) or m.group(2) or m.group(3)
            if not value:
                continue
            line_idx = content[:m.start()].count('\n')
            element  = _find_element_type(lines, line_idx)
            condition = _find_condition(lines, line_idx)
            entity   = _classify_entity(value)

            if value not in manifest:
                manifest[value] = {
                    'file':      filename,
                    'element':   element,
                    'condition': condition,
                    'entity':    entity,
                    'type':      'testid',
                }

        # ── id attributes (form fields) ─────────────────────────────────────
        for m in _ID_RE.finditer(content):
            value = m.group(1)
            # skip values that look like internal React/HTML ids (e.g. "root")
            if value in ('root', 'app') or value.startswith('__'):
                continue
            line_idx = content[:m.start()].count('\n')
            element  = _find_element_type(lines, line_idx)
            condition = _find_condition(lines, line_idx)
            entity   = _classify_entity(value)

            key = f'id:{value}'
            if key not in manifest:
                manifest[key] = {
                    'file':      filename,
                    'element':   element,
                    'condition': condition,
                    'entity':    entity,
                    'type':      'id',
                    'id':        value,
                }

    # write manifest
    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    print(f'[extractor] wrote {len(manifest)} entries -> {MANIFEST_PATH}')
    return manifest


def load() -> dict:
    """Load the manifest from disk (must have been extracted first)."""
    if not os.path.exists(MANIFEST_PATH):
        raise FileNotFoundError(
            f'selector_manifest.json not found at {MANIFEST_PATH}. '
            'Run extractor.extract() first.'
        )
    with open(MANIFEST_PATH, encoding='utf-8') as f:
        return json.load(f)


def get_entity_entries(manifest: dict, entity: str) -> dict:
    """Return only the manifest entries belonging to a given entity group."""
    return {k: v for k, v in manifest.items() if v.get('entity') == entity}


if __name__ == '__main__':
    result = extract()
    print(f'[extractor] done — {len(result)} selectors extracted')
