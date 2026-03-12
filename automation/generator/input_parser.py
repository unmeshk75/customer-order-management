"""
input_parser.py
────────────────────────────────────────────────────────────────────────────
Parse test case definitions from multiple input formats.

All formats return a list of dicts with keys:
  id        str   e.g. "TC-CUST-01"
  name      str   short test case title
  scenario  str   description of what to do
  expected  str   expected outcome
  type      str   "positive" | "negative"
  steps     str   optional step-by-step instructions
  entity    str   e.g. "Customer" | "Product" | "Order" | "Dashboard"

Supported inputs:
  1. .xlsx / .xls  — openpyxl, first sheet
  2. .csv file     — csv.DictReader
  3. JSON string   — json.loads (single dict or list)
  4. plain text    — treated as scenario, type inferred from keywords
────────────────────────────────────────────────────────────────────────────
"""

import csv
import json
import os
import re
import io
from datetime import datetime

# ── entity detection keywords ──────────────────────────────────────────────
_ENTITY_KEYWORDS = {
    'Customer':   ['customer', 'contact', 'company', 'account', 'consumer', 'smb', 'enterprise'],
    'Product':    ['product', 'stock', 'price', 'inventory', 'item', 'professional', 'basic'],
    'Order':      ['order', 'wizard', 'checkout', 'seat', 'discount', 'purchase'],
    'Dashboard':  ['dashboard', 'revenue', 'stat', 'metric', 'low.?stock'],
}

# ── negative type keywords ─────────────────────────────────────────────────
_NEGATIVE_KEYWORDS = [
    'invalid', 'fail', 'should not', 'cannot', 'missing', 'required',
    'error', 'reject', 'negative', 'without', 'empty', 'no ', 'not ',
]

# ── column header aliases ─────────────────────────────────────────────────
_COL_ALIASES = {
    'id':        ['id', 'tc id', 'test id', 'test case id', 'tc_id', 'case id', 'suite id', 'suite_id'],
    'name':      ['name', 'title', 'test case', 'test name', 'tc name', 'test_name', 'test case name', 'testcase name'],
    'scenario':  ['scenario', 'description', 'test description', 'desc', 'steps to test', 'scenario description'],
    'expected':  ['expected', 'expected result', 'expected outcome', 'result', 'expected_result'],
    'type':      ['type', 'test type', 'positive/negative', 'test_type', 'category'],
    'steps':     ['steps', 'test steps', 'steps to reproduce', 'test_steps', 'procedure'],
    'entity':    ['entity', 'page', 'module', 'component', 'feature'],
    'spec_file': ['spec file', 'spec_file', 'spec', 'filename', 'file name', 'output file'],
}


def _normalise_headers(headers: list[str]) -> dict[str, str]:
    """Map raw header strings to canonical field names."""
    mapping: dict[str, str] = {}
    for raw in headers:
        clean = raw.strip().lower()
        for canonical, aliases in _COL_ALIASES.items():
            if clean in aliases:
                mapping[raw] = canonical
                break
    return mapping


def _infer_type(text: str) -> str:
    low = text.lower()
    for kw in _NEGATIVE_KEYWORDS:
        if re.search(kw, low):
            return 'negative'
    return 'positive'


def _infer_entity(text: str) -> str:
    low = text.lower()
    for entity, keywords in _ENTITY_KEYWORDS.items():
        for kw in keywords:
            if re.search(kw, low):
                return entity
    return 'Customer'


def _auto_id() -> str:
    return f'TC-{datetime.now().strftime("%H%M%S")}'


def _normalise_type(raw: str) -> str:
    low = raw.strip().lower()
    if low in ('positive', 'pos', '+', 'p'):
        return 'positive'
    if low in ('negative', 'neg', '-', 'n'):
        return 'negative'
    return _infer_type(raw)


def _row_to_dict(raw: dict, header_map: dict[str, str], row_num: int) -> dict:
    """Convert a raw CSV/Excel row dict → canonical test case dict."""
    mapped: dict[str, str] = {}
    for raw_key, value in raw.items():
        canonical = header_map.get(raw_key)
        if canonical:
            mapped[canonical] = str(value).strip() if value else ''

    combined_text = ' '.join(filter(None, [
        mapped.get('name', ''), mapped.get('scenario', ''), mapped.get('expected', '')
    ]))

    tc_id     = mapped.get('id') or f'TC-{row_num:03d}'
    name      = mapped.get('name') or tc_id
    scenario  = mapped.get('scenario') or ''
    expected  = mapped.get('expected') or ''
    tc_type   = _normalise_type(mapped.get('type', '')) if mapped.get('type') else _infer_type(combined_text)
    steps     = mapped.get('steps', '')
    entity    = mapped.get('entity', '') or _infer_entity(combined_text)
    spec_file = mapped.get('spec_file', '')

    return {
        'id':        tc_id,
        'name':      name,
        'scenario':  scenario,
        'expected':  expected,
        'type':      tc_type,
        'steps':     steps,
        'entity':    entity,
        'spec_file': spec_file,
    }


# ══════════════════════════════════════════════════════════════════════════
# Public parsers
# ══════════════════════════════════════════════════════════════════════════

def parse_excel(path: str) -> list[dict]:
    """Parse .xlsx/.xls — reads first sheet.

    Skips leading title/banner rows and locates the real header row by finding
    the first row where at least one cell matches a known column alias.
    """
    try:
        import openpyxl
    except ImportError:
        raise ImportError('openpyxl is required for Excel parsing. pip install openpyxl')

    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []

    # Find the first row that contains recognised column headers
    header_row_idx = None
    header_map = {}
    for idx, row in enumerate(rows):
        candidate = [str(h).strip() if h is not None else '' for h in row]
        mapping = _normalise_headers(candidate)
        if mapping:
            header_row_idx = idx
            raw_headers = candidate
            header_map = mapping
            break

    if header_row_idx is None:
        return []

    result = []
    for i, row in enumerate(rows[header_row_idx + 1:], start=1):
        raw = dict(zip(raw_headers, [str(c).strip() if c is not None else '' for c in row]))
        # skip completely empty rows and section-divider rows (only one non-empty cell)
        non_empty = [v for v in raw.values() if v]
        if len(non_empty) <= 1:
            continue
        result.append(_row_to_dict(raw, header_map, i))

    wb.close()
    return result


def parse_csv(source: str) -> list[dict]:
    """
    Parse CSV from a file path or a multi-line CSV string.
    Falls back to cp1252 (Windows) encoding if UTF-8 decoding fails.
    """
    if os.path.isfile(source):
        for enc in ('utf-8-sig', 'utf-8', 'cp1252', 'latin-1'):
            try:
                with open(source, newline='', encoding=enc) as f:
                    text = f.read()
                break
            except UnicodeDecodeError:
                continue
        else:
            raise ValueError(f'Cannot decode CSV file: {source}')
    else:
        text = source

    # Scan rows to find the first line where at least one cell matches a known alias
    # (handles title/banner rows before the real header)
    lines = list(csv.reader(io.StringIO(text)))
    header_row_idx = None
    header_map: dict[str, str] = {}
    raw_headers: list[str] = []
    for idx, line in enumerate(lines):
        candidate = [c.strip() for c in line]
        mapping = _normalise_headers(candidate)
        if mapping:
            header_row_idx = idx
            raw_headers = candidate
            header_map = mapping
            break

    if header_row_idx is None:
        return []

    result = []
    for i, line in enumerate(lines[header_row_idx + 1:], start=1):
        if not any(c.strip() for c in line):
            continue
        row = dict(zip(raw_headers, [c.strip() for c in line]))
        result.append(_row_to_dict(row, header_map, i))
    return result


def parse_json(source: str) -> list[dict]:
    """
    Parse JSON — accepts a JSON string, a path to a .json file,
    or a single dict / list of dicts.
    """
    if os.path.isfile(source):
        with open(source, encoding='utf-8') as f:
            data = json.load(f)
    else:
        data = json.loads(source)

    if isinstance(data, dict):
        data = [data]

    result = []
    for i, item in enumerate(data, start=1):
        tc_id    = str(item.get('id', '') or f'TC-{i:03d}')
        name     = str(item.get('name', '') or tc_id)
        scenario = str(item.get('scenario', '') or item.get('description', ''))
        expected = str(item.get('expected', '') or item.get('expected_result', ''))
        raw_type = str(item.get('type', ''))
        tc_type  = _normalise_type(raw_type) if raw_type else _infer_type(f'{scenario} {expected}')
        steps    = str(item.get('steps', '') or item.get('test_steps', ''))
        entity   = str(item.get('entity', '') or item.get('page', '')) or _infer_entity(f'{name} {scenario}')

        result.append({
            'id':        tc_id,
            'name':      name,
            'scenario':  scenario,
            'expected':  expected,
            'type':      tc_type,
            'steps':     steps,
            'entity':    entity,
            'spec_file': str(item.get('spec_file', '') or ''),
        })
    return result


def parse_text(text: str, explicit_type: str = '') -> list[dict]:
    """
    Parse a plain text description as a single test case.
    explicit_type: 'positive' | 'negative' | '' (auto-infer)
    """
    tc_type = explicit_type.lower() if explicit_type else _infer_type(text)
    entity  = _infer_entity(text)
    return [{
        'id':       _auto_id(),
        'name':     text[:80].strip(),
        'scenario': text.strip(),
        'expected': '',
        'type':     tc_type,
        'steps':    '',
        'entity':   entity,
    }]


# ══════════════════════════════════════════════════════════════════════════
# Main dispatcher
# ══════════════════════════════════════════════════════════════════════════

def parse(source: str, explicit_type: str = '') -> list[dict]:
    """
    Auto-detect input format and return list of test case dicts.

    :param source:        file path (.xlsx/.xls/.csv/.json) or raw string
    :param explicit_type: optional 'positive'|'negative' override for text input
    """
    if not source:
        raise ValueError('No input source provided.')

    # File-based detection
    if os.path.isfile(source):
        ext = os.path.splitext(source)[1].lower()
        if ext in ('.xlsx', '.xls'):
            return parse_excel(source)
        if ext == '.csv':
            return parse_csv(source)
        if ext == '.json':
            return parse_json(source)

    # String-based detection
    stripped = source.strip()
    if stripped.startswith('{') or stripped.startswith('['):
        return parse_json(stripped)
    if ',' in stripped and '\n' in stripped:
        return parse_csv(stripped)

    # Fallback: plain text
    return parse_text(stripped, explicit_type)


def group_by_entity(test_cases: list[dict]) -> dict[str, list[dict]]:
    """Group test cases by their entity field."""
    groups: dict[str, list[dict]] = {}
    for tc in test_cases:
        entity = tc.get('entity', 'Customer')
        groups.setdefault(entity, []).append(tc)
    return groups
