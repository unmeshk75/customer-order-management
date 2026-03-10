"""
TC-MAN-01: US Country Entry Dynamically Renders State Dropdown
Module: State Dropdown - CustomerForm.jsx
Type: Positive | Priority: Critical
"""

import pytest
from playwright.sync_api import sync_playwright, expect
from tests.ui_config import FRONTEND_URL, launch_browser

ALL_US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]


@pytest.fixture(scope="module")
def browser_page():
    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.new_page()
        yield page
        browser.close()


def test_tc_man_01_state_dropdown_renders_for_us(browser_page):
    """
    TC-MAN-01: Typing 'US' in the Country field replaces the disabled state
    input with a <select> dropdown containing all 50 US state abbreviations.
    """
    page = browser_page

    # Step 1: Navigate to the Customers tab
    page.goto(FRONTEND_URL)
    page.get_by_test_id("nav-customers").click()
    expect(page.get_by_test_id("customer-list")).to_be_visible()
    page.pause()  # VERIFY: Customer list page loaded

    # Step 2: Open the Create Customer form
    page.get_by_test_id("create-customer-btn").click()
    expect(page.locator("#customer-form")).to_be_visible()
    page.pause()  # VERIFY: Customer form is open, all fields empty

    # Step 3: Verify state field is a DISABLED input before country is set
    state_input = page.locator("[data-testid='customer-state-input'], #customer-state[disabled]").first
    expect(state_input).to_be_disabled()
    expect(state_input).to_have_attribute("placeholder", "Only for US addresses")
    page.pause()  # VERIFY: State field is greyed out with placeholder 'Only for US addresses'

    # Step 4: Type 'US' in the Country field
    country_input = page.get_by_test_id("customer-country-input")
    country_input.click()
    country_input.fill("US")
    expect(country_input).to_have_value("US")
    page.pause()  # VERIFY: 'US' appears in the Country input

    # Step 5: Blur the country field to trigger handleCountryChange
    country_input.blur()

    # Disabled input should no longer be visible
    expect(page.locator("input[placeholder='Only for US addresses']")).not_to_be_visible()

    # State <select> dropdown should now appear
    state_select = page.get_by_test_id("customer-state-select")
    expect(state_select).to_be_visible()
    expect(state_select).to_be_enabled()
    page.pause()  # VERIFY: Disabled input gone, State <select> dropdown is now visible

    # Step 6: Verify dropdown contains exactly 50 US state options
    options = state_select.locator("option").all()
    option_values = [opt.get_attribute("value") for opt in options]

    # Filter out any blank placeholder option
    option_values = [v for v in option_values if v]

    assert len(option_values) == 50, (
        f"Expected 50 US states, got {len(option_values)}: {option_values}"
    )
    for state in ALL_US_STATES:
        assert state in option_values, f"Missing state: {state}"
    page.pause()  # VERIFY: Click the State dropdown and confirm all 50 states are listed

    # Step 7: Select 'CA' from the state dropdown
    state_select.select_option("CA")
    expect(state_select).to_have_value("CA")

    # State label should show asterisk (*) indicating required field
    state_label = page.locator("label[for='customer-state'], label:has-text('State')")
    expect(state_label).to_contain_text("*")
    page.pause()  # VERIFY: Dropdown shows 'CA' selected, label shows asterisk (*)
