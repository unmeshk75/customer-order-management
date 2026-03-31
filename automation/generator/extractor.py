"""
extractor.py
────────────────────────────────────────────────────────────────────────────
Scan frontend JSX/TSX source files and build a selector manifest.

For every data-testid and id attribute found, records:
  - the file it came from
  - the HTML element type (button, input, select, div, …)
  - any condition expression guarding it (e.g. "country === 'US'")
  - the entity group (derived from the selector prefix, e.g. "customer",
    "product", "navigation", "modal")

Entity classification is fully automatic — it reads the first hyphen-separated
token of the selector name as the entity, with special handling for navigation
and modal patterns so this works with any React app without configuration.

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

# ── utility entity detection ───────────────────────────────────────────────
# Selectors whose prefix (or any token) matches these are classified as
# cross-cutting utility entities rather than domain entities.  Utility
# entities get locator files but NOT page-object files.
_NAV_TOKENS   = {'nav', 'navigation', 'navbar', 'sidebar', 'menu'}
_MODAL_TOKENS = {'modal', 'dialog', 'confirm', 'overlay', 'popup', 'drawer'}

# Tokens that appear as selector prefixes but are NOT entity names.
# When the first token is one of these, we look at the second token instead.
_NON_ENTITY_TOKENS = {
    # Action verbs
    'add', 'create', 'edit', 'update', 'delete', 'remove', 'cancel',
    'submit', 'save', 'open', 'close', 'toggle', 'show', 'hide',
    'view', 'expand', 'collapse', 'filter', 'search', 'sort', 'clear',
    'review', 'select', 'check', 'uncheck', 'reset', 'refresh',
    # UI structural words
    'btn', 'button', 'form', 'list', 'table', 'row', 'col', 'column',
    'input', 'label', 'text', 'title', 'header', 'footer', 'card',
    'panel', 'section', 'container', 'wrapper', 'item', 'tab',
    # Generic descriptors / sub-component words
    'detail', 'info', 'count', 'total', 'subtotal', 'low', 'high',
    'all', 'new', 'is', 'has', 'can', 'should', 'no',
    'wizard', 'step', 'chip', 'badge', 'tag', 'icon', 'avatar',
    'revenue', 'stat', 'metric', 'summary', 'stock',
    # Navigation direction words
    'back', 'next', 'prev', 'previous', 'forward',
    # Common field/attribute names that are NOT entity names
    'name', 'type', 'value', 'status', 'code', 'date', 'time',
    'price', 'qty', 'quantity', 'amount', 'email', 'phone',
    'address', 'city', 'state', 'country', 'zip', 'indicator',
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


def _normalize_entity(token: str) -> str:
    """Strip a common English plural suffix so 'customers' → 'customer'."""
    if len(token) > 4 and token.endswith('s') and not token.endswith('ss'):
        return token[:-1]
    return token


def _classify_entity(value: str) -> str:
    """
    Derive the entity group from a selector string.

    Rules (applied in order):
    1. If the first token is a navigation keyword → 'navigation'
    2. If any token is a modal keyword → 'modal'
    3. Otherwise scan tokens left-to-right, skip action verbs and structural
       UI words, and return the first meaningful token (de-pluralised).

    This works for any React app that follows the common convention
    {entity}-{element}  or  {verb}-{entity}-{element}
    (e.g. "product-price-input" → "product",
          "add-customer-btn"    → "customer").
    """
    low = value.lower()
    # Strip the "id:" prefix used for id="" entries
    if low.startswith('id:'):
        low = low[3:]
    parts = [p for p in low.split('-') if p]
    if not parts:
        return 'general'
    if parts[0] in _NAV_TOKENS:
        return 'navigation'
    if any(t in _MODAL_TOKENS for t in parts):
        return 'modal'
    # Find the first meaningful token: skip action verbs, UI-structural words,
    # template expression fragments (${...}), and skip after normalizing plurals.
    for token in parts:
        if token.startswith('$'):          # template expression fragment, e.g. ${id}
            continue
        normalized = _normalize_entity(token)
        if (normalized not in _NON_ENTITY_TOKENS
                and normalized not in _NAV_TOKENS
                and normalized not in _MODAL_TOKENS):
            return normalized
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
    jsx_files = (
        glob.glob(os.path.join(src_dir, '**', '*.jsx'), recursive=True)
        + glob.glob(os.path.join(src_dir, '**', '*.tsx'), recursive=True)
    )

    if not jsx_files:
        print(f'[extractor] WARNING: no .jsx/.tsx files found under {src_dir}')
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
            # Skip purely-dynamic template literals (e.g. `${customer.id}`)
            # that have no static prefix — they cannot be used as selectors.
            if value.startswith('${'):
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


def get_all_entities(manifest: dict) -> list[str]:
    """
    Return the sorted list of unique entity names found in the manifest,
    excluding the catch-all 'general' bucket.

    Entity names are Title-cased so they can be used directly as JS class
    name prefixes (e.g. 'customer' → 'Customer').
    """
    raw = {v['entity'] for v in manifest.values() if v.get('entity') != 'general'}
    return sorted(e.capitalize() for e in raw)


def get_page_entities(manifest: dict) -> list[str]:
    """
    Return Title-cased entity names that should receive a Page object file.

    Utility entities (navigation, modal) get locator files only.
    """
    utility = {e.capitalize() for e in (_NAV_TOKENS | _MODAL_TOKENS)}
    return [e for e in get_all_entities(manifest) if e not in utility]


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
