# Backend

FastAPI REST API backed by SQLite via SQLAlchemy. Serves the React frontend and the Playwright test suite.

## Running

```bash
# From the project root — activate the shared venv first
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac / Linux

cd backend
uvicorn main:app --reload --port 8000
```

| URL | Purpose |
|---|---|
| http://localhost:8000/api | API base |
| http://localhost:8000/docs | Swagger UI |
| http://localhost:8000/api/health | Health check |

The SQLite database (`backend/app.db`) is created automatically on first run. Delete it to reset all data.

## File Overview

| File | Purpose |
|---|---|
| `main.py` | FastAPI app, all route handlers, CORS config |
| `models.py` | SQLAlchemy ORM models |
| `schemas.py` | Pydantic request/response schemas |
| `crud.py` | Database read/write helpers |
| `business_rules.py` | Product-customer compatibility validation |
| `database.py` | Engine, session factory, declarative Base |

## Data Models

### Customer

| Field | Type | Notes |
|---|---|---|
| id | int | PK, auto |
| name | str | required |
| customer_type | enum | `Consumer` / `SMB` / `Enterprise` |
| email | str | unique, required |
| phone | str | optional |
| company_name | str | optional (SMB / Enterprise) |
| street / city / state / zip / country | str | optional address fields |
| account_status | enum | `Active` / `Inactive` / `Suspended` |
| contact_preference | enum | `Email` / `Phone` / `Mail` |

### Product

| Field | Type | Notes |
|---|---|---|
| id | int | PK, auto |
| name | str | required |
| product_type | enum | `Basic` / `Professional` / `Teams` / `Ultra-Enterprise` |
| description | str | optional |
| price_per_seat | float | required |
| stock_quantity | int | default 100 |

### Order

| Field | Type | Notes |
|---|---|---|
| id | int | PK, auto |
| customer_id | int | FK → Customer (cascade delete) |
| order_date | datetime | auto, UTC |
| status | enum | `Active` / `Cancelled` / `Completed` |
| priority | enum | `Low` / `Medium` / `High` / `Critical` |
| discount_percentage | float | 0–100 |
| total_amount | float | computed from line items |
| notes | str | optional |

### OrderProduct (junction table)

| Field | Type | Notes |
|---|---|---|
| order_id | int | FK → Order |
| product_id | int | FK → Product |
| seats | int | > 0 |
| unit_price | float | snapshot at order time |
| subtotal | float | `unit_price × seats` |

Unique constraint: `(order_id, product_id)` — no duplicate products per order.

## API Reference

### Customers

```
GET    /api/customers              List all customers
POST   /api/customers              Create customer
GET    /api/customers/{id}         Get by ID
PUT    /api/customers/{id}         Update
DELETE /api/customers/{id}         Delete (cascades to orders)
```

**POST / PUT body:**
```json
{
  "name": "Alice Smith",
  "customer_type": "Consumer",
  "email": "alice@example.com",
  "phone": "555-0100",
  "company_name": null,
  "street": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "country": "US",
  "account_status": "Active",
  "contact_preference": "Email"
}
```

### Products

```
GET    /api/products                      List all products
POST   /api/products                      Create product
GET    /api/products/{id}                 Get by ID
PUT    /api/products/{id}                 Update
DELETE /api/products/{id}                 Error 400 if product is in any order
GET    /api/products/available/{type}     Products allowed for a customer type
```

**POST / PUT body:**
```json
{
  "name": "Basic Plan",
  "product_type": "Basic",
  "description": "Entry-level plan",
  "price_per_seat": 9.99,
  "stock_quantity": 100
}
```

### Orders

```
GET    /api/orders              List all orders
POST   /api/orders              Create order
GET    /api/orders/{id}         Get by ID (includes line items)
PUT    /api/orders/{id}         Update (replaces all line items)
DELETE /api/orders/{id}         Delete
```

**POST / PUT body:**
```json
{
  "customer_id": 1,
  "status": "Active",
  "priority": "Medium",
  "discount_percentage": 10,
  "notes": "Rush delivery",
  "products": [
    { "product_id": 2, "seats": 5 },
    { "product_id": 3, "seats": 2 }
  ]
}
```

### Dashboard

```
GET    /api/dashboard
```

Returns customer counts by type, order counts by status, total revenue, and a list of low-stock products (stock < 10).

## Business Rules

Enforced in `business_rules.py` and checked in route handlers before any DB write:

| Customer Type | Allowed Product Types |
|---|---|
| Consumer | Basic, Professional |
| SMB | Professional, Teams |
| Enterprise | Basic, Teams, Ultra-Enterprise |

Adding a disallowed product to an order returns HTTP 400 with a descriptive error message.

## Running Tests

```bash
venv\Scripts\activate
cd backend
pytest -v
```
