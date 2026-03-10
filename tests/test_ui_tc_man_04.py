"""
TC-MAN-04: Consumer Customer Sees ONLY Basic & Professional Products
Module: Dynamic Loading - OrderForm.jsx
Type: Positive + Negative | Priority: Critical
"""

import requests
import pytest
from playwright.sync_api import sync_playwright, expect
from tests.ui_config import FRONTEND_URL, BACKEND_URL, launch_browser

API_URL = f"{BACKEND_URL}/api"


# ── API helpers ───────────────────────────────────────────────────────────────

def _create_customer(name: str, email: str, customer_type: str) -> dict:
    r = requests.post(f"{API_URL}/customers", json={
        "name": name, "customer_type": customer_type, "email": email
    })
    if r.status_code == 400 and "already registered" in r.text:
        return next(c for c in requests.get(f"{API_URL}/customers").json()
                    if c["email"] == email)
    r.raise_for_status()
    return r.json()


def _create_product(name: str, product_type: str, price: float) -> dict:
    r = requests.post(f"{API_URL}/products", json={
        "name": name, "product_type": product_type, "price_per_seat": price
    })
    if r.status_code == 400:
        return next(p for p in requests.get(f"{API_URL}/products").json()
                    if p["name"] == name)
    r.raise_for_status()
    return r.json()


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def seeded_data():
    """
    PRE-CONDITIONS:
      1. Products exist for ALL 4 types: Basic, Professional, Teams, Ultra-Enterprise.
      2. A Consumer customer exists.
    """
    customer      = _create_customer("Alice TC04", "alice.tc04@example.com", "Consumer")
    basic         = _create_product("Basic TC04",         "Basic",            9.99)
    professional  = _create_product("Professional TC04",  "Professional",    19.99)
    teams         = _create_product("Teams TC04",         "Teams",           29.99)
    ultra         = _create_product("Ultra TC04",         "Ultra-Enterprise", 99.99)
    return {
        "customer":     customer,
        "basic":        basic,
        "professional": professional,
        "teams":        teams,
        "ultra":        ultra,
    }


@pytest.fixture(scope="module")
def browser_page():
    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.new_page()
        yield page
        browser.close()


# ── Test ──────────────────────────────────────────────────────────────────────

def test_tc_man_04_consumer_product_filter(browser_page, seeded_data):
    """
    TC-MAN-04: Consumer customers must only see Basic and Professional products
    in the order form. Teams and Ultra-Enterprise must be completely absent.
    Also verifies order creation succeeds for an allowed product, and that the
    backend rejects an order with a disallowed product (Teams) for a Consumer.
    """
    page     = browser_page
    customer = seeded_data["customer"]
    teams_id = seeded_data["teams"]["id"]
    basic_id = seeded_data["basic"]["id"]

    customer_label = f"{customer['name']} (Consumer)"

    # Navigate to Orders tab and open the Create Order form
    page.goto(FRONTEND_URL)
    page.get_by_test_id("nav-orders").click()
    expect(page.get_by_test_id("order-list")).to_be_visible()
    page.get_by_test_id("create-order-btn").click()
    expect(page.locator("#order-form")).to_be_visible()

    # Step 1: Select Consumer customer → products section appears
    customer_select = page.get_by_test_id("order-customer-select")
    customer_select.select_option(label=customer_label)
    expect(page.locator("#order-products-section")).to_be_visible()

    # Info banner confirms allowed types for Consumer
    info_text = page.locator("#order-products-section").locator(
        "text=Available products for Consumer"
    ).first
    expect(info_text).to_be_visible()
    banner = info_text.text_content()
    assert "Basic" in banner and "Professional" in banner, (
        f"Info banner missing expected types: {banner}"
    )
    page.pause()  # VERIFY: Products section visible; info banner shows 'Basic, Professional' for Consumer

    # Step 2: Open product dropdown in row 0
    product_select = page.get_by_test_id("order-product-0")
    expect(product_select).to_be_visible()
    page.pause()  # VERIFY: Product dropdown in row 0 is visible and clickable

    # Step 3: Collect all options (excluding blank placeholder)
    all_options = product_select.locator("option").all()
    option_texts = [
        opt.text_content().strip()
        for opt in all_options
        if opt.get_attribute("value")  # skip blank placeholder
    ]
    page.pause()  # VERIFY: Inspect the dropdown — only Basic and Professional products should be listed

    # Step 4: At least one Basic product IS present
    basic_options = [t for t in option_texts if "(Basic)" in t]
    assert len(basic_options) >= 1, f"No Basic product found. Options: {option_texts}"
    page.pause()  # VERIFY: At least one option with '(Basic)' is shown

    # Step 5: At least one Professional product IS present
    pro_options = [t for t in option_texts if "(Professional)" in t]
    assert len(pro_options) >= 1, f"No Professional product found. Options: {option_texts}"
    page.pause()  # VERIFY: At least one option with '(Professional)' is shown

    # Step 6: Teams products are NOT present
    teams_options = [t for t in option_texts if "(Teams)" in t]
    assert len(teams_options) == 0, (
        f"Teams products should be absent for Consumer, but found: {teams_options}"
    )
    page.pause()  # VERIFY: No option with '(Teams)' exists in the dropdown

    # Step 7: Ultra-Enterprise products are NOT present
    ultra_options = [t for t in option_texts if "(Ultra-Enterprise)" in t]
    assert len(ultra_options) == 0, (
        f"Ultra-Enterprise products should be absent for Consumer, but found: {ultra_options}"
    )
    page.pause()  # VERIFY: No option with '(Ultra-Enterprise)' exists in the dropdown

    # Step 8: Select a Basic product, set seats=2, submit the order successfully
    product_select.select_option(str(basic_id))
    page.get_by_test_id("order-seats-0").fill("2")
    page.get_by_test_id("submit-order-btn").click()

    # Order should appear in the orders table
    expect(page.get_by_test_id("order-list")).to_be_visible()
    expect(page.locator("#orders-table")).to_contain_text(customer["name"])
    page.pause()  # VERIFY: Order created successfully and appears in the Orders list

    # ── Backend enforcement (API-level negative test) ─────────────────────────
    # Verify the backend also rejects a Teams product for a Consumer customer
    invalid_order = {
        "customer_id": customer["id"],
        "products": [{"product_id": teams_id, "seats": 1}],
    }
    api_response = requests.post(f"{API_URL}/orders", json=invalid_order)
    assert api_response.status_code in (400, 422), (
        f"Expected 400/422 for Consumer+Teams order, got {api_response.status_code}"
    )
    assert "not available" in api_response.json().get("detail", "").lower(), (
        f"Expected 'not available' in error detail: {api_response.json()}"
    )
