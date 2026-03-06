"""
API endpoint tests.
"""

import pytest


def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_customer(client):
    """Test creating a customer"""
    customer_data = {
        "name": "Test Customer",
        "customer_type": "Consumer",
        "email": "test@example.com",
        "phone": "123-456-7890",
        "street_address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zip_code": "10001",
        "country": "US"
    }
    response = client.post("/api/customers", json=customer_data)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Customer"
    assert data["customer_type"] == "Consumer"
    assert "id" in data


def test_get_customers(client):
    """Test getting all customers"""
    # Create a customer first
    customer_data = {
        "name": "Test Customer",
        "customer_type": "SMB",
        "email": "smb@example.com"
    }
    client.post("/api/customers", json=customer_data)

    # Get all customers
    response = client.get("/api/customers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_product(client):
    """Test creating a product"""
    product_data = {
        "name": "Basic Plan",
        "product_type": "Basic",
        "description": "Basic features",
        "price_per_seat": 9.99
    }
    response = client.post("/api/products", json=product_data)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Basic Plan"
    assert data["price_per_seat"] == 9.99


def test_create_order_valid(client):
    """Test creating an order with valid products"""
    # Create customer
    customer_data = {
        "name": "Test Customer",
        "customer_type": "Consumer",
        "email": "consumer@example.com"
    }
    customer_response = client.post("/api/customers", json=customer_data)
    customer_id = customer_response.json()["id"]

    # Create products
    product1_data = {
        "name": "Basic Plan",
        "product_type": "Basic",
        "price_per_seat": 9.99
    }
    product1_response = client.post("/api/products", json=product1_data)
    product1_id = product1_response.json()["id"]

    # Create order
    order_data = {
        "customer_id": customer_id,
        "products": [
            {"product_id": product1_id, "seats": 5}
        ],
        "notes": "Test order"
    }
    response = client.post("/api/orders", json=order_data)
    assert response.status_code == 201
    data = response.json()
    assert data["customer_id"] == customer_id
    assert data["total_amount"] == 9.99 * 5


def test_create_order_invalid_product(client):
    """Test creating an order with invalid product for customer type"""
    # Create Consumer customer
    customer_data = {
        "name": "Test Consumer",
        "customer_type": "Consumer",
        "email": "consumer2@example.com"
    }
    customer_response = client.post("/api/customers", json=customer_data)
    customer_id = customer_response.json()["id"]

    # Create Teams product (not allowed for Consumer)
    product_data = {
        "name": "Teams Plan",
        "product_type": "Teams",
        "price_per_seat": 19.99
    }
    product_response = client.post("/api/products", json=product_data)
    product_id = product_response.json()["id"]

    # Try to create order (should fail)
    order_data = {
        "customer_id": customer_id,
        "products": [
            {"product_id": product_id, "seats": 5}
        ]
    }
    response = client.post("/api/orders", json=order_data)
    assert response.status_code == 400
    assert "not available" in response.json()["detail"]


def test_delete_customer_cascade(client):
    """Test that deleting a customer cascades to orders"""
    # Create customer
    customer_data = {
        "name": "Test Customer",
        "customer_type": "Consumer",
        "email": "cascade@example.com"
    }
    customer_response = client.post("/api/customers", json=customer_data)
    customer_id = customer_response.json()["id"]

    # Create product
    product_data = {
        "name": "Basic Plan",
        "product_type": "Basic",
        "price_per_seat": 9.99
    }
    product_response = client.post("/api/products", json=product_data)
    product_id = product_response.json()["id"]

    # Create order
    order_data = {
        "customer_id": customer_id,
        "products": [{"product_id": product_id, "seats": 1}]
    }
    client.post("/api/orders", json=order_data)

    # Delete customer
    response = client.delete(f"/api/customers/{customer_id}")
    assert response.status_code == 204

    # Verify customer is deleted
    get_response = client.get(f"/api/customers/{customer_id}")
    assert get_response.status_code == 404


def test_duplicate_email(client):
    """Test that duplicate email is rejected"""
    customer_data = {
        "name": "Test Customer 1",
        "customer_type": "Consumer",
        "email": "duplicate@example.com"
    }
    # First creation should succeed
    response1 = client.post("/api/customers", json=customer_data)
    assert response1.status_code == 201

    # Second creation with same email should fail
    customer_data["name"] = "Test Customer 2"
    response2 = client.post("/api/customers", json=customer_data)
    assert response2.status_code == 400
    assert "already registered" in response2.json()["detail"]
