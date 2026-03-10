"""
TC-MAN-02: Switching Country FROM US TO Non-US Hides Dropdown & Clears State
Module: State Dropdown - CustomerForm.jsx
Type: Positive | Priority: Critical
"""

import pytest
from playwright.sync_api import sync_playwright, expect
from tests.ui_config import FRONTEND_URL, launch_browser


@pytest.fixture(scope="module")
def browser_page():
    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.new_page()
        yield page
        browser.close()


def test_tc_man_02_switching_country_from_us_hides_state_dropdown(browser_page):
    """
    TC-MAN-02: Changing country from 'US' to a non-US value causes the state
    <select> dropdown to disappear, the disabled input to reappear, and the
    previously selected state value ('NY') to be cleared.
    """
    page = browser_page

    # --- PRE-CONDITIONS: Open form, set country=US, select state=NY ---
    page.goto(FRONTEND_URL)
    page.get_by_test_id("nav-customers").click()
    expect(page.get_by_test_id("customer-list")).to_be_visible()

    page.get_by_test_id("create-customer-btn").click()
    expect(page.locator("#customer-form")).to_be_visible()

    country_input = page.get_by_test_id("customer-country-input")
    country_input.fill("US")
    country_input.blur()

    state_select = page.get_by_test_id("customer-state-select")
    expect(state_select).to_be_visible()
    state_select.select_option("NY")
    expect(state_select).to_have_value("NY")
    # --- END PRE-CONDITIONS ---

    # Step 1: Confirm state dropdown is visible and shows 'NY'
    expect(state_select).to_be_visible()
    expect(state_select).to_have_value("NY")
    page.pause()  # VERIFY: State <select> is present and 'NY' is selected

    # Step 2: Clear Country field and type 'Canada'
    country_input.click()
    country_input.fill("Canada")
    expect(country_input).to_have_value("Canada")
    page.pause()  # VERIFY: 'Canada' appears in the Country input

    # Step 3: Tab out to trigger handleCountryChange
    country_input.blur()

    # State <select> dropdown should disappear
    expect(state_select).not_to_be_visible()

    # Disabled text input should reappear
    state_disabled_input = page.get_by_test_id("customer-state-input")
    expect(state_disabled_input).to_be_visible()
    expect(state_disabled_input).to_be_disabled()
    page.pause()  # VERIFY: State dropdown gone, disabled input with placeholder is back

    # Step 4: Verify the disabled input is empty (state was cleared)
    expect(state_disabled_input).to_have_value("")
    page.pause()  # VERIFY: Disabled input is empty — 'NY' was auto-cleared, no stale value

    # Step 5: Attempt to click/type in the disabled state input
    state_disabled_input.click()
    expect(state_disabled_input).to_be_disabled()
    page.pause()  # VERIFY: Field remains greyed out, no cursor, cannot type
