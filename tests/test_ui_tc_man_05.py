"""
TC-MAN-05: SMB Customer Sees ONLY Professional & Teams Products
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
      2. An SMB customer exists.
    """
    customer     = _create_customer("Bob SMB TC05", "bob.tc05@example.com", "SMB")
    basic        = _create_product("Basic TC05",         "Basic",            9.99)
    professional = _create_product("Professional TC05",  "Professional",    19.99)
    teams        = _create_product("Teams TC05",         "Teams",           29.99)
    ultra        = _create_product("Ultra TC05",         "Ultra-Enterprise", 99.99)
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

def test_tc_man_05_smb_product_filter(browser_page, seeded_data):
    """
    TC-MAN-05: SMB customers must only see Professional and Teams products
    in the order form. Basic and Ultra-Enterprise must be completely absent.
    Also verifies order creation succeeds for an allowed product (Teams), and
    that the backend rejects a Basic product order for an SMB customer.
    """
    page     = browser_page
    customer = seeded_data["customer"]
    teams_id = seeded_data["teams"]["id"]
    basic_id = seeded_data["basic"]["id"]

    customer_label = f"{customer['name']} (SMB)"

    # Navigate to Orders tab and open Create Order form
    page.goto(FRONTEND_URL)
    page.get_by_test_id("nav-orders").click()
    expect(page.get_by_test_id("order-list")).to_be_visible()
    page.get_by_test_id("create-order-btn").click()
    expect(page.locator("#order-form")).to_be_visible()

    # Step 1: Select SMB customer → products section appears
    customer_select = page.get_by_test_id("order-customer-select")
    customer_select.select_option(label=customer_label)
    expect(page.locator("#order-products-section")).to_be_visible()
    page.pause()  # VERIFY: Products section appeared after selecting SMB customer

    # Step 2: Info banner shows allowed types for SMB
    info_text = page.locator("#order-products-section").locator(
        "text=Available products for SMB"
    ).first
    expect(info_text).to_be_visible()
    banner = info_text.text_content()
    assert "Professional" in banner and "Teams" in banner, (
        f"Info banner missing expected types for SMB: {banner}"
    )
    page.pause()  # VERIFY: Info banner shows 'Available products for SMB customers: Professional, Teams'

    # Step 3: Collect all non-placeholder options from product dropdown row 0
    product_select = page.get_by_test_id("order-product-0")
    expect(product_select).to_be_visible()
    all_options = product_select.locator("option").all()
    option_texts = [
        opt.text_content().strip()
        for opt in all_options
        if opt.get_attribute("value")  # skip blank placeholder
    ]
    page.pause()  # VERIFY: Dropdown shows only Professional and Teams products

    # Step 4: At least one Professional product IS present
    pro_options = [t for t in option_texts if "(Professional)" in t]
    assert len(pro_options) >= 1, f"No Professional product found. Options: {option_texts}"
    page.pause()  # VERIFY: At least one option with '(Professional)' is shown

    # Step 5: At least one Teams product IS present
    teams_options = [t for t in option_texts if "(Teams)" in t]
    assert len(teams_options) >= 1, f"No Teams product found. Options: {option_texts}"
    page.pause()  # VERIFY: At least one option with '(Teams)' is shown

    # Step 6: Basic products are NOT present
    basic_options = [t for t in option_texts if "(Basic)" in t]
    assert len(basic_options) == 0, (
        f"Basic products should be absent for SMB, but found: {basic_options}"
    )
    page.pause()  # VERIFY: No option with '(Basic)' exists in the dropdown

    # Step 7: Ultra-Enterprise products are NOT present
    ultra_options = [t for t in option_texts if "(Ultra-Enterprise)" in t]
    assert len(ultra_options) == 0, (
        f"Ultra-Enterprise products should be absent for SMB, but found: {ultra_options}"
    )
    page.pause()  # VERIFY: No option with '(Ultra-Enterprise)' exists in the dropdown

    # Step 8: Select a Teams product, set seats=1, submit the order successfully
    product_select.select_option(str(teams_id))
    page.get_by_test_id("order-seats-0").fill("1")
    page.get_by_test_id("submit-order-btn").click()

    # Order should appear in the orders table
    expect(page.get_by_test_id("order-list")).to_be_visible()
    expect(page.locator("#orders-table")).to_contain_text(customer["name"])
    page.pause()  # VERIFY: Order created successfully and appears in the Orders list

    # ── Backend enforcement (API-level negative test) ─────────────────────────
    # Verify the backend also rejects a Basic product for an SMB customer
    invalid_order = {
        "customer_id": customer["id"],
        "products": [{"product_id": basic_id, "seats": 1}],
    }
    api_response = requests.post(f"{API_URL}/orders", json=invalid_order)
    assert api_response.status_code in (400, 422), (
        f"Expected 400/422 for SMB+Basic order, got {api_response.status_code}"
    )
    assert "not available" in api_response.json().get("detail", "").lower(), (
        f"Expected 'not available' in error detail: {api_response.json()}"
    )
