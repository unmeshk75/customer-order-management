# QA Automation Testing Guide

This document provides comprehensive information for QA automation testing of the Customer Order Management application.

## Overview

This application has been designed with QA automation as a primary focus. All interactive elements have predictable IDs and data attributes for reliable element selection in automated tests.

## Element ID Patterns

All interactive elements follow a consistent naming pattern:

```
{action}-{entity}-{optional-id}
```

Examples:
- `create-customer-btn` - Button to create a new customer
- `edit-customer-123` - Button to edit customer with ID 123
- `order-product-0` - Product dropdown in order form at index 0

## DOM Structure

### Navigation
```html
<nav class="navigation">
  <button id="nav-customers">Customers</button>
  <button id="nav-products">Products</button>
  <button id="nav-orders">Orders</button>
</nav>
```

### Customer Page Elements

#### Customer List
```html
<div data-testid="customer-list">
  <button id="create-customer-btn">Create Customer</button>

  <table id="customers-table">
    <tr data-customer-id="123">
      <td data-testid="customer-id-123">123</td>
      <td data-testid="customer-name-123">John Doe</td>
      <td data-testid="customer-type-123">Consumer</td>
      <td data-testid="customer-email-123">john@example.com</td>
      <td>
        <button id="edit-customer-123">Edit</button>
        <button id="delete-customer-123">Delete</button>
      </td>
    </tr>
  </table>
</div>
```

#### Customer Form
```html
<form id="customer-form">
  <input id="customer-name" data-testid="customer-name-input" />
  <select id="customer-type" data-testid="customer-type-select">
    <option value="Consumer">Consumer</option>
    <option value="SMB">SMB</option>
    <option value="Enterprise">Enterprise</option>
  </select>
  <input id="customer-email" data-testid="customer-email-input" />
  <input id="customer-phone" data-testid="customer-phone-input" />
  <input id="customer-street" data-testid="customer-street-input" />
  <input id="customer-city" data-testid="customer-city-input" />
  <input id="customer-country" data-testid="customer-country-input" />

  <!-- If country is "US", state is a dropdown; otherwise disabled input -->
  <select id="customer-state" data-testid="customer-state-select">
    <option value="AL">AL</option>
    <!-- ...all 50 US states... -->
  </select>

  <input id="customer-zip" data-testid="customer-zip-input" />
  <button id="submit-customer-btn" data-testid="submit-customer-btn">Create Customer</button>
  <button id="cancel-customer-btn" data-testid="cancel-customer-btn">Cancel</button>

  <div id="customer-form-error" class="error">Error message here</div>
</form>
```

### Product Page Elements

#### Product List
```html
<div data-testid="product-list">
  <button id="create-product-btn">Create Product</button>

  <table id="products-table">
    <tr data-product-id="456">
      <td data-testid="product-id-456">456</td>
      <td data-testid="product-name-456">Basic Plan</td>
      <td data-testid="product-type-456">Basic</td>
      <td data-testid="product-price-456">$9.99</td>
      <td>
        <button id="edit-product-456">Edit</button>
        <button id="delete-product-456">Delete</button>
      </td>
    </tr>
  </table>
</div>
```

#### Product Form
```html
<form id="product-form">
  <input id="product-name" data-testid="product-name-input" />
  <select id="product-type" data-testid="product-type-select">
    <option value="Basic">Basic</option>
    <option value="Professional">Professional</option>
    <option value="Teams">Teams</option>
    <option value="Ultra-Enterprise">Ultra-Enterprise</option>
  </select>
  <textarea id="product-description" data-testid="product-description-input"></textarea>
  <input id="product-price" data-testid="product-price-input" type="number" />
  <button id="submit-product-btn" data-testid="submit-product-btn">Create Product</button>
  <button id="cancel-product-btn" data-testid="cancel-product-btn">Cancel</button>

  <div id="product-form-error" class="error">Error message here</div>
</form>
```

### Order Page Elements

#### Order List
```html
<div data-testid="order-list">
  <button id="create-order-btn">Create Order</button>

  <table id="orders-table">
    <tr data-order-id="789">
      <td data-testid="order-id-789">789</td>
      <td data-testid="order-customer-789">John Doe</td>
      <td data-testid="order-customer-type-789">Consumer</td>
      <td data-testid="order-total-789">$49.95</td>
      <td data-testid="order-products-789">Basic Plan (5 seats)</td>
      <td>
        <button id="delete-order-789">Delete</button>
      </td>
    </tr>
  </table>
</div>
```

#### Order Form
```html
<form id="order-form">
  <select id="order-customer" data-testid="order-customer-select">
    <option value="123">John Doe (Consumer)</option>
  </select>

  <div id="order-products-section">
    <!-- First product row (index 0) -->
    <div class="product-row" data-product-index="0">
      <select id="order-product-0" data-testid="order-product-0">
        <!-- Products filtered based on customer type -->
      </select>
      <input id="order-seats-0" data-testid="order-seats-0" type="number" />
      <button id="remove-product-0" data-testid="remove-product-0">Remove</button>
    </div>

    <!-- Second product row (index 1) -->
    <div class="product-row" data-product-index="1">
      <select id="order-product-1" data-testid="order-product-1"></select>
      <input id="order-seats-1" data-testid="order-seats-1" type="number" />
      <button id="remove-product-1" data-testid="remove-product-1">Remove</button>
    </div>

    <button id="add-product-btn" data-testid="add-product-btn">Add Another Product</button>
  </div>

  <textarea id="order-notes" data-testid="order-notes-input"></textarea>
  <button id="submit-order-btn" data-testid="submit-order-btn">Create Order</button>
  <button id="cancel-order-btn" data-testid="cancel-order-btn">Cancel</button>

  <div id="order-form-error" class="error">Error message here</div>
</form>
```

## XPath Examples

### Navigation
```xpath
# Navigate to Customers page
//button[@id='nav-customers']

# Navigate to Products page
//button[@id='nav-products']

# Navigate to Orders page
//button[@id='nav-orders']
```

### Customer Operations
```xpath
# Create customer button
//button[@id='create-customer-btn']

# Edit specific customer
//button[@id='edit-customer-123']

# Delete specific customer
//button[@id='delete-customer-123']

# Customer form inputs
//input[@id='customer-name']
//select[@id='customer-type']
//input[@id='customer-email']
```

### Product Operations
```xpath
# Create product button
//button[@id='create-product-btn']

# Product form inputs
//input[@id='product-name']
//select[@id='product-type']
//input[@id='product-price']
```

### Order Operations
```xpath
# Create order button
//button[@id='create-order-btn']

# Select customer
//select[@id='order-customer']

# First product dropdown
//select[@id='order-product-0']

# First product seats input
//input[@id='order-seats-0']

# Add another product
//button[@id='add-product-btn']

# Submit order
//button[@id='submit-order-btn']
```

## CSS Selector Examples

```css
/* Navigation */
button#nav-customers
button#nav-products
button#nav-orders

/* Customer operations */
button#create-customer-btn
input#customer-name
select#customer-type
button#submit-customer-btn

/* Product operations */
button#create-product-btn
input#product-name
select#product-type

/* Order operations */
button#create-order-btn
select#order-customer
select#order-product-0
input#order-seats-0
button#add-product-btn
button#submit-order-btn

/* Error messages */
div#customer-form-error
div#product-form-error
div#order-form-error
```

## Test Scenarios

### Scenario 1: Create Consumer Customer and Order

```python
# Navigate to Customers
driver.find_element(By.ID, "nav-customers").click()

# Create customer
driver.find_element(By.ID, "create-customer-btn").click()
driver.find_element(By.ID, "customer-name").send_keys("John Doe")
driver.find_element(By.ID, "customer-type").send_keys("Consumer")
driver.find_element(By.ID, "customer-email").send_keys("john@example.com")
driver.find_element(By.ID, "customer-phone").send_keys("555-1234")
driver.find_element(By.ID, "customer-country").send_keys("US")
driver.find_element(By.ID, "customer-state").send_keys("CA")
driver.find_element(By.ID, "submit-customer-btn").click()

# Navigate to Products
driver.find_element(By.ID, "nav-products").click()

# Create Basic product
driver.find_element(By.ID, "create-product-btn").click()
driver.find_element(By.ID, "product-name").send_keys("Basic Plan")
driver.find_element(By.ID, "product-type").send_keys("Basic")
driver.find_element(By.ID, "product-price").send_keys("9.99")
driver.find_element(By.ID, "submit-product-btn").click()

# Navigate to Orders
driver.find_element(By.ID, "nav-orders").click()

# Create order
driver.find_element(By.ID, "create-order-btn").click()
Select(driver.find_element(By.ID, "order-customer")).select_by_visible_text("John Doe (Consumer)")

# Verify only Basic and Professional products are shown
product_select = driver.find_element(By.ID, "order-product-0")
options = [opt.text for opt in product_select.find_elements(By.TAG_NAME, "option")]
assert "Basic Plan (Basic)" in options
assert "Teams" not in options  # Teams not available for Consumer

# Add product
driver.find_element(By.ID, "order-product-0").send_keys("Basic Plan")
driver.find_element(By.ID, "order-seats-0").send_keys("5")
driver.find_element(By.ID, "submit-order-btn").click()

# Verify order in table
assert driver.find_element(By.XPATH, "//td[@data-testid='order-customer-789']").text == "John Doe"
```

### Scenario 2: Verify Business Rule Validation

```python
# Create Consumer customer
driver.find_element(By.ID, "nav-customers").click()
driver.find_element(By.ID, "create-customer-btn").click()
driver.find_element(By.ID, "customer-name").send_keys("Test Consumer")
driver.find_element(By.ID, "customer-type").send_keys("Consumer")
driver.find_element(By.ID, "customer-email").send_keys("consumer@test.com")
driver.find_element(By.ID, "submit-customer-btn").click()

# Create Teams product (not allowed for Consumer)
driver.find_element(By.ID, "nav-products").click()
driver.find_element(By.ID, "create-product-btn").click()
driver.find_element(By.ID, "product-name").send_keys("Teams Plan")
driver.find_element(By.ID, "product-type").send_keys("Teams")
driver.find_element(By.ID, "product-price").send_keys("19.99")
driver.find_element(By.ID, "submit-product-btn").click()

# Try to create order
driver.find_element(By.ID, "nav-orders").click()
driver.find_element(By.ID, "create-order-btn").click()
Select(driver.find_element(By.ID, "order-customer")).select_by_visible_text("Test Consumer (Consumer)")

# Verify Teams product is NOT in the dropdown
product_select = driver.find_element(By.ID, "order-product-0")
options = [opt.get_attribute("value") for opt in product_select.find_elements(By.TAG_NAME, "option")]
teams_product_id = "2"  # Assuming Teams product has ID 2
assert teams_product_id not in options
```

### Scenario 3: Dynamic State Field

```python
# Create customer
driver.find_element(By.ID, "nav-customers").click()
driver.find_element(By.ID, "create-customer-btn").click()

# Set country to US
driver.find_element(By.ID, "customer-country").send_keys("US")

# Verify state dropdown is enabled and has US states
state_element = driver.find_element(By.ID, "customer-state")
assert state_element.is_enabled()
assert state_element.tag_name == "select"

# Change country to Canada
driver.find_element(By.ID, "customer-country").clear()
driver.find_element(By.ID, "customer-country").send_keys("Canada")

# Verify state field is now disabled
state_element = driver.find_element(By.ID, "customer-state")
assert not state_element.is_enabled()
```

## Product Availability Rules

For automated testing of business rules:

| Customer Type | Allowed Products |
|--------------|------------------|
| Consumer | Basic, Professional |
| SMB | Professional, Teams |
| Enterprise | Basic, Teams, Ultra-Enterprise |

## Error Handling

All forms have error divs that display validation errors:

- `#customer-form-error` - Customer form errors
- `#product-form-error` - Product form errors
- `#order-form-error` - Order form errors

Example error detection:
```python
# Check for error
error_element = driver.find_element(By.ID, "order-form-error")
if error_element.is_displayed():
    error_text = error_element.text
    print(f"Error occurred: {error_text}")
```

## API Testing

The backend API can also be tested directly:

### Base URL
```
http://localhost:8000/api
```

### Example API Tests

```python
import requests

base_url = "http://localhost:8000/api"

# Create customer
customer_data = {
    "name": "Test Customer",
    "customer_type": "Consumer",
    "email": "test@example.com"
}
response = requests.post(f"{base_url}/customers", json=customer_data)
assert response.status_code == 201
customer_id = response.json()["id"]

# Create product
product_data = {
    "name": "Basic Plan",
    "product_type": "Basic",
    "price_per_seat": 9.99
}
response = requests.post(f"{base_url}/products", json=product_data)
assert response.status_code == 201
product_id = response.json()["id"]

# Create order
order_data = {
    "customer_id": customer_id,
    "products": [{"product_id": product_id, "seats": 5}]
}
response = requests.post(f"{base_url}/orders", json=order_data)
assert response.status_code == 201
assert response.json()["total_amount"] == 49.95

# Verify business rule (Consumer cannot buy Teams)
teams_product_data = {
    "name": "Teams Plan",
    "product_type": "Teams",
    "price_per_seat": 19.99
}
response = requests.post(f"{base_url}/products", json=teams_product_data)
teams_id = response.json()["id"]

invalid_order_data = {
    "customer_id": customer_id,
    "products": [{"product_id": teams_id, "seats": 5}]
}
response = requests.post(f"{base_url}/orders", json=invalid_order_data)
assert response.status_code == 400
assert "not available" in response.json()["detail"]
```

## Performance Considerations

- The application uses SQLite, suitable for testing but not for high-concurrency scenarios
- All API responses are JSON format
- Database operations are synchronous
- Frontend updates are immediate after successful API calls

## Test Data Management

For automated tests, consider:
1. Creating setup scripts to populate test data
2. Using the API directly for faster test data creation
3. Implementing teardown to clean up test data
4. Using unique identifiers (timestamps, UUIDs) in test data to avoid conflicts

## Continuous Integration

For CI/CD pipelines:

```bash
# Backend tests
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../tests
pytest -v

# Frontend tests (if added)
cd frontend
npm install
npm test
```
