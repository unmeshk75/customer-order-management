"""
writer.py
────────────────────────────────────────────────────────────────────────────
Utilities for writing generated files to disk.
────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import shutil

_HERE = os.path.dirname(os.path.abspath(__file__))
_E2E_REF = os.path.normpath(os.path.join(_HERE, '..', 'e2e'))

# Regex to strip outermost markdown fences
_FENCE_RE = re.compile(r'^```[a-zA-Z]*\s*\n?(.*?)\n?```\s*$', re.DOTALL)


def strip_fences(code: str) -> str:
    """Remove surrounding markdown code fences if present."""
    m = _FENCE_RE.match(code.strip())
    return m.group(1).strip() if m else code.strip()


def write_file(path: str, content: str) -> None:
    """
    Create parent directories if needed, then write content.
    Always strips markdown fences before writing.
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)
    clean = strip_fences(content)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(clean)
        if not clean.endswith('\n'):
            f.write('\n')
    print(f'  [write] {path}')


def copy_reference_file(rel_path: str, output_dir: str) -> None:
    """
    Copy a reference file from automation/e2e/ to the output directory.
    rel_path is relative to automation/e2e/  e.g. 'pages/BasePage.js'
    """
    src  = os.path.join(_E2E_REF, rel_path)
    dest = os.path.join(output_dir, rel_path)
    if not os.path.exists(src):
        print(f'  [copy]  WARNING: reference file not found: {src}')
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy2(src, dest)
    print(f'  [copy]  {dest}  (from reference)')


def scaffold_output_dir(output_dir: str) -> None:
    """Create the standard e2e directory structure."""
    for sub in ('locators', 'pages', 'utils', 'tests'):
        os.makedirs(os.path.join(output_dir, sub), exist_ok=True)
    print(f'  [mkdir] {output_dir}/')


def tc_filename(tc_id: str) -> str:
    """
    Convert a test case ID to a spec filename.
    e.g.  'TC-CUST-01' → 'tc_cust_01.spec.js'
         'TC-MAN-03'  → 'tc_man_03.spec.js'
    """
    sanitised = re.sub(r'[^a-zA-Z0-9]', '_', tc_id).lower()
    sanitised = re.sub(r'_+', '_', sanitised).strip('_')
    if not sanitised.endswith('.spec'):
        sanitised += '.spec'
    return f'{sanitised}.js'
