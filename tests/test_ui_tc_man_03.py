"""
TC-MAN-03: Selecting a Customer Dynamically Loads the Products Section
Module: Dynamic Loading - OrderForm.jsx
Type: Positive | Priority: Critical
"""

import requests
import pytest
from playwright.sync_api import sync_playwright, expect
from tests.ui_config import FRONTEND_URL, BACKEND_URL, launch_browser

API_URL = f"{BACKEND_URL}/api"


# ── API helpers ───────────────────────────────────────────────────────────────

def _create_consumer_customer() -> dict:
    payload = {
        "name": "Alice Consumer",
        "customer_type": "Consumer",
        "email": "alice.tc03@example.com",
    }
    r = requests.post(f"{API_URL}/customers", json=payload)
    # 400 means duplicate email — fetch instead
    if r.status_code == 400 and "already registered" in r.text:
        customers = requests.get(f"{API_URL}/customers").json()
        return next(c for c in customers if c["email"] == payload["email"])
    r.raise_for_status()
    return r.json()


def _create_product(name: str, product_type: str, price: float) -> dict:
    payload = {"name": name, "product_type": product_type, "price_per_seat": price}
    r = requests.post(f"{API_URL}/products", json=payload)
    if r.status_code == 400:
        products = requests.get(f"{API_URL}/products").json()
        return next(p for p in products if p["name"] == name)
    r.raise_for_status()
    return r.json()


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def seeded_data():
    """
    PRE-CONDITIONS:
      1. At least one Consumer customer exists.
      2. At least one Basic and one Professional product exist.
    Created via API so the test is not dependent on manual data setup.
    """
    customer = _create_consumer_customer()
    basic    = _create_product("Basic Plan TC03",        "Basic",        9.99)
    pro      = _create_product("Professional Plan TC03", "Professional", 19.99)
    return {"customer": customer, "basic": basic, "pro": pro}


@pytest.fixture(scope="module")
def browser_page():
    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.new_page()
        yield page
        browser.close()


# ── Test ──────────────────────────────────────────────────────────────────────

def test_tc_man_03_customer_selection_loads_products_section(browser_page, seeded_data):
    """
    TC-MAN-03: Selecting a customer in the Order form dynamically renders
    #order-products-section and enables the Submit button.
    """
    page = browser_page
    customer = seeded_data["customer"]
    customer_label = f"{customer['name']} (Consumer)"

    # Navigate to Orders tab
    page.goto(FRONTEND_URL)
    page.get_by_test_id("nav-orders").click()
    expect(page.get_by_test_id("order-list")).to_be_visible()

    # Step 1: Open Create Order form
    page.get_by_test_id("create-order-btn").click()
    expect(page.locator("#order-form")).to_be_visible()

    # #order-products-section must be ABSENT from DOM (not just hidden)
    expect(page.locator("#order-products-section")).not_to_be_attached()
    page.pause()  # VERIFY: Order form open. Customer dropdown visible. Products section NOT in DOM at all.

    # Step 2: Submit button must be DISABLED before customer is selected
    submit_btn = page.get_by_test_id("submit-order-btn")
    expect(submit_btn).to_be_disabled()
    page.pause()  # VERIFY: Submit button is greyed out / disabled

    # Step 3: Customer dropdown lists all customers in 'Name (Type)' format
    customer_select = page.get_by_test_id("order-customer-select")
    expect(customer_select).to_be_visible()
    options = customer_select.locator("option").all_text_contents()
    assert any("Consumer" in opt for opt in options), (
        f"No Consumer customer option found. Options: {options}"
    )
    page.pause()  # VERIFY: Dropdown shows customers in 'Name (CustomerType)' format

    # Step 4: Select the Consumer customer
    customer_select.select_option(label=customer_label)
    expect(customer_select).to_have_value(str(customer["id"]))
    page.pause()  # VERIFY: Consumer customer selected from dropdown

    # Step 5: #order-products-section is now rendered in the DOM
    products_section = page.locator("#order-products-section")
    expect(products_section).to_be_attached()
    expect(products_section).to_be_visible()

    # Product row 0 with select + seats input + 'Add Another Product' button
    expect(page.get_by_test_id("order-product-0")).to_be_visible()
    expect(page.get_by_test_id("order-seats-0")).to_be_visible()
    expect(page.get_by_test_id("add-product-btn")).to_be_visible()
    page.pause()  # VERIFY: Products section appeared with row 0 and 'Add Another Product' button

    # Step 6: Info text banner shows allowed product types for Consumer
    info_text = products_section.locator("text=Available products for Consumer").first
    expect(info_text).to_be_visible()
    banner_text = info_text.text_content()
    assert "Basic" in banner_text, f"'Basic' missing from info banner: {banner_text}"
    assert "Professional" in banner_text, f"'Professional' missing from info banner: {banner_text}"
    page.pause()  # VERIFY: Info banner shows 'Available products for Consumer customers: Basic, Professional'

    # Step 7: Submit button is now ENABLED
    expect(submit_btn).to_be_enabled()
    page.pause()  # VERIFY: Submit button is now enabled (no longer disabled)
