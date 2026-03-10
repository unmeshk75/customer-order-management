"""
ui_config.py
Shared configuration for all Playwright UI tests.

To override defaults, set environment variables before running pytest:
  FRONTEND_URL   - default: http://localhost:5173
  BACKEND_URL    - default: http://localhost:8000
  CHROME_PATH    - default: C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe
                   Only used as fallback if Playwright's built-in Chromium is unavailable.
"""

import os
from playwright.sync_api import Playwright, Browser

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL  = os.environ.get("BACKEND_URL",  "http://localhost:8000")
CHROME_PATH  = os.environ.get(
    "CHROME_PATH",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
)


def launch_browser(playwright: Playwright, headless: bool = False) -> Browser:
    """
    Launch Chromium for Playwright UI tests.

    Priority:
      1. Playwright's built-in Chromium (installed via `playwright install chromium`)
      2. System Chrome at CHROME_PATH (fallback for environments where the
         built-in browser could not be downloaded, e.g. corporate proxies)
    """
    try:
        return playwright.chromium.launch(headless=headless)
    except Exception:
        return playwright.chromium.launch(
            headless=headless,
            executable_path=CHROME_PATH,
        )
