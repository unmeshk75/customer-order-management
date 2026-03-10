"""
TC-MAN-03: Create a New Product Successfully
Module: Product Form - ProductForm.jsx
Type: Positive | Priority: Critical
"""

import pytest
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:5173"

PRODUCT_NAME = "Professional Plan"
PRODUCT_TYPE = "Professional"
PRODUCT_DESCRIPTION = "A professional-grade plan for growing teams that need advanced features."
PRODUCT_PRICE = "29.99"


@pytest.fixture(scope="module")
def browser_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            executable_path=r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
        )
        page = browser.new_page()
        yield page
        browser.close()


def test_tc_man_03_create_new_product(browser_page):
    """
    TC-MAN-03: Filling in all product form fields (name, type, description,
    price) and submitting creates a new product that immediately appears in
    the products table with the correct name, type, and formatted price.
    """
    page = browser_page

    # Step 1: Navigate to the Products tab
    page.goto(BASE_URL)
    page.locator("#nav-products").click()
    expect(page.get_by_test_id("product-list")).to_be_visible()
    page.pause()  # VERIFY: Products list page is loaded and the products table is visible

    # Step 2: Open the Create Product form
    page.locator("#create-product-btn").click()
    expect(page.locator("#product-form")).to_be_visible()
    page.pause()  # VERIFY: Product form modal/panel is open with all fields empty

    # Step 3: Fill in the product name
    name_input = page.get_by_test_id("product-name-input")
    name_input.click()
    name_input.fill(PRODUCT_NAME)
    expect(name_input).to_have_value(PRODUCT_NAME)
    page.pause()  # VERIFY: 'Professional Plan' appears in the Name field

    # Step 4: Select the product type
    type_select = page.get_by_test_id("product-type-select")
    type_select.select_option(PRODUCT_TYPE)
    expect(type_select).to_have_value(PRODUCT_TYPE)
    page.pause()  # VERIFY: 'Professional' is selected in the Type dropdown

    # Step 5: Fill in the product description
    description_input = page.get_by_test_id("product-description-input")
    description_input.click()
    description_input.fill(PRODUCT_DESCRIPTION)
    expect(description_input).to_have_value(PRODUCT_DESCRIPTION)
    page.pause()  # VERIFY: Description text appears in the textarea

    # Step 6: Fill in the product price
    price_input = page.get_by_test_id("product-price-input")
    price_input.click()
    price_input.fill(PRODUCT_PRICE)
    expect(price_input).to_have_value(PRODUCT_PRICE)
    page.pause()  # VERIFY: '29.99' appears in the Price field

    # Step 7: Verify the error div is not visible before submission
    error_div = page.locator("#product-form-error")
    expect(error_div).not_to_be_visible()
    page.pause()  # VERIFY: No error message is shown — form is in a clean state

    # Step 8: Submit the form
    page.get_by_test_id("submit-product-btn").click()
    expect(page.locator("#product-form")).not_to_be_visible()
    page.pause()  # VERIFY: Form closes/disappears after successful submission

    # Step 9: Verify the new product appears in the products table
    products_table = page.locator("#products-table")
    expect(products_table).to_be_visible()
    expect(products_table).to_contain_text(PRODUCT_NAME)
    page.pause()  # VERIFY: 'Professional Plan' row is visible in the products table

    # Step 10: Verify the product type is shown correctly in the table row
    product_name_cell = page.locator(
        f"[data-testid^='product-name-']"
    ).filter(has_text=PRODUCT_NAME)
    expect(product_name_cell).to_be_visible()

    # Derive the product row to scope sibling cell assertions
    product_row = product_name_cell.locator("xpath=ancestor::tr")
    expect(product_row.locator("[data-testid^='product-type-']")).to_have_text(PRODUCT_TYPE)
    page.pause()  # VERIFY: Row shows 'Professional Plan' under Name and 'Professional' under Type

    # Step 11: Verify the formatted price is shown correctly in the table row
    price_cell = product_row.locator("[data-testid^='product-price-']")
    expect(price_cell).to_have_text(f"${PRODUCT_PRICE}")
    page.pause()  # VERIFY: Price cell shows '$29.99' — correctly formatted with dollar sign