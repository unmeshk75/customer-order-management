"""
TC-MAN-06: Create a New Customer with Unique Information
Module: Customer Creation - CustomerForm.jsx
Type: Positive | Priority: Critical
"""

import time
import pytest
from playwright.sync_api import sync_playwright, expect
from tests.ui_config import FRONTEND_URL, launch_browser


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def browser_page():
    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.new_page()
        yield page
        browser.close()


@pytest.fixture(scope="module")
def unique_customer():
    """Generate unique customer data using a timestamp suffix to avoid conflicts."""
    ts = int(time.time())
    return {
        "name":    f"Jane Smith {ts}",
        "type":    "Consumer",
        "email":   f"jane.smith.{ts}@example.com",
        "phone":   "555-9876",
        "street":  "742 Evergreen Terrace",
        "city":    "Springfield",
        "country": "US",
        "state":   "IL",
        "zip":     "62701",
    }


# ── Test ──────────────────────────────────────────────────────────────────────

def test_tc_man_06_create_customer_with_unique_information(browser_page, unique_customer):
    """
    TC-MAN-06: Filling in all customer form fields with unique data and
    submitting the form creates a new customer that appears in the customer
    table with the correct name, type, and email.
    """
    page = browser_page
    c = unique_customer

    # Step 1: Navigate to the Customers tab
    page.goto(FRONTEND_URL)
    page.locator("#nav-customers").click()
    expect(page.get_by_test_id("customer-list")).to_be_visible()
    page.pause()  # VERIFY: Customers page loaded; the customer table is visible

    # Step 2: Open the Create Customer form
    page.locator("#create-customer-btn").click()
    expect(page.locator("#customer-form")).to_be_visible()
    page.pause()  # VERIFY: Customer form is open and all fields are empty

    # Step 3: Fill in the customer name
    name_input = page.get_by_test_id("customer-name-input")
    name_input.fill(c["name"])
    expect(name_input).to_have_value(c["name"])
    page.pause()  # VERIFY: Name field contains the unique customer name

    # Step 4: Select the customer type
    type_select = page.get_by_test_id("customer-type-select")
    type_select.select_option(c["type"])
    expect(type_select).to_have_value(c["type"])
    page.pause()  # VERIFY: Customer type is set to 'Consumer'

    # Step 5: Fill in the email address
    email_input = page.get_by_test_id("customer-email-input")
    email_input.fill(c["email"])
    expect(email_input).to_have_value(c["email"])
    page.pause()  # VERIFY: Email field contains the unique timestamped email address

    # Step 6: Fill in the phone number
    phone_input = page.get_by_test_id("customer-phone-input")
    phone_input.fill(c["phone"])
    expect(phone_input).to_have_value(c["phone"])
    page.pause()  # VERIFY: Phone field shows '555-9876'

    # Step 7: Fill in the street address
    street_input = page.get_by_test_id("customer-street-input")
    street_input.fill(c["street"])
    expect(street_input).to_have_value(c["street"])
    page.pause()  # VERIFY: Street field shows '742 Evergreen Terrace'

    # Step 8: Fill in the city
    city_input = page.get_by_test_id("customer-city-input")
    city_input.fill(c["city"])
    expect(city_input).to_have_value(c["city"])
    page.pause()  # VERIFY: City field shows 'Springfield'

    # Step 9: Set country to 'US' — this should swap the state field to a dropdown
    country_input = page.get_by_test_id("customer-country-input")
    country_input.fill(c["country"])
    expect(country_input).to_have_value(c["country"])
    country_input.blur()

    # Disabled state input must disappear; the <select> must appear
    expect(page.locator("input[placeholder='Only for US addresses']")).not_to_be_visible()
    state_select = page.get_by_test_id("customer-state-select")
    expect(state_select).to_be_visible()
    expect(state_select).to_be_enabled()
    page.pause()  # VERIFY: Country is 'US'; state input replaced by an enabled <select> dropdown

    # Step 10: Select state 'IL' from the dropdown
    state_select.select_option(c["state"])
    expect(state_select).to_have_value(c["state"])
    page.pause()  # VERIFY: State dropdown shows 'IL' selected

    # Step 11: Fill in the ZIP code
    zip_input = page.get_by_test_id("customer-zip-input")
    zip_input.fill(c["zip"])
    expect(zip_input).to_have_value(c["zip"])
    page.pause()  # VERIFY: ZIP field shows '62701'

    # Step 12: Submit the form
    page.locator("#submit-customer-btn").click()
    page.pause()  # VERIFY: Form submitted; no error banner visible, form dismissed

    # Step 13: Customer list is visible again (form closed after successful creation)
    expect(page.get_by_test_id("customer-list")).to_be_visible()
    expect(page.locator("#customer-form")).not_to_be_visible()
    page.pause()  # VERIFY: Form closed and customer list is shown

    # Step 14: The new customer appears in the table with the correct name
    expect(page.locator("#customers-table")).to_contain_text(c["name"])
    page.pause()  # VERIFY: Customer name visible in the customers table

    # Step 15: The new customer row shows the correct type and email
    expect(page.locator("#customers-table")).to_contain_text(c["type"])
    expect(page.locator("#customers-table")).to_contain_text(c["email"])
    page.pause()  # VERIFY: Customer row also shows 'Consumer' and the unique email address