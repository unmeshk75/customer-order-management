# Customer Order Management Application

A full-stack application for managing customers, products, and orders. Built for QA automation testing with clear DOM structure and predictable element IDs.

## Tech Stack

**Backend:**
- Python 3.11+
- FastAPI
- SQLAlchemy (ORM)
- SQLite (Database)
- Pydantic (Validation)

**Frontend:**
- React 18
- Vite
- Axios

## Business Rules

### Customer Types
- **Consumer**: Can purchase Basic, Professional products
- **SMB**: Can purchase Professional, Teams products
- **Enterprise**: Can purchase Basic, Teams, Ultra-Enterprise products

### Product Types
- Basic (Free)
- Professional
- Teams
- Ultra-Enterprise

### Order Rules
- One order belongs to one customer
- One order can have multiple products
- Each product has a number of "seats"
- Product availability is validated based on customer type

## Project Structure

```
sample-application/
├── backend/              # FastAPI backend
│   ├── main.py          # Application entry point
│   ├── models.py        # Database models
│   ├── schemas.py       # Pydantic schemas
│   ├── crud.py          # CRUD operations
│   ├── business_rules.py # Business logic
│   └── database.py      # Database configuration
├── frontend/            # React frontend
│   └── src/
│       ├── components/  # React components
│       ├── api.js       # API client
│       └── styles/      # CSS styles
├── tests/               # Backend tests
└── docs/                # Documentation
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
```bash
venv\Scripts\activate
```
- Mac/Linux:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at: http://localhost:8000

API Documentation (Swagger UI): http://localhost:8000/docs

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at: http://localhost:5173

## Running Tests

### Backend Tests

1. Navigate to the tests directory:
```bash
cd tests
```

2. Run pytest:
```bash
pytest -v
```

This will run:
- API endpoint tests
- Business rule validation tests
- Database operation tests

## API Endpoints

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/{id}` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

### Products
- `GET /api/products` - List all products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/{id}` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/{id}` - Update order
- `DELETE /api/orders/{id}` - Delete order

### Utility
- `GET /api/products/available/{customer_type}` - Get available products for customer type
- `GET /api/health` - Health check

## Usage Guide

### Creating a Customer

1. Navigate to the Customers page
2. Click "Create Customer"
3. Fill in the form:
   - Name (required)
   - Customer Type (required): Consumer, SMB, or Enterprise
   - Email (required)
   - Phone (optional)
   - Address fields (optional):
     - Street Address
     - City
     - Country
     - State (dropdown for US addresses only)
     - ZIP Code
4. Click "Create Customer"

### Creating a Product

1. Navigate to the Products page
2. Click "Create Product"
3. Fill in the form:
   - Name (required)
   - Product Type (required): Basic, Professional, Teams, or Ultra-Enterprise
   - Description (optional)
   - Price per Seat (required)
4. Click "Create Product"

### Creating an Order

1. Navigate to the Orders page
2. Click "Create Order"
3. Select a customer from the dropdown
   - Products will be filtered based on customer type
4. Add products:
   - Select a product from the dropdown
   - Enter number of seats (minimum 1)
   - Click "Add Another Product" to add more products
5. Optionally add notes
6. Click "Create Order"

The order total is automatically calculated based on product prices and seat counts.

## Features

### Dynamic Product Filtering
When creating an order, the available products are dynamically filtered based on the selected customer's type. The backend also validates this to ensure data integrity.

### Address Validation
The customer form includes smart address handling:
- When country is "US", a state dropdown with US states is enabled
- When country is not "US", the state field is disabled

### Cascade Deletes
- Deleting a customer will also delete all associated orders
- Products cannot be deleted if they are referenced in existing orders

### Data Validation
- Email uniqueness is enforced
- Required fields are validated
- Business rules are validated (product-customer compatibility)
- Duplicate products in the same order are prevented

## QA Automation

This application is designed for QA automation testing. All interactive elements have:
- Unique element IDs following the pattern: `{action}-{entity}-{optional-id}`
- `data-testid` attributes for reliable element selection
- Consistent DOM structure across components

See [TESTING.md](docs/TESTING.md) for detailed QA automation guide.

## Development Notes

- The application uses SQLite for the database, stored as `app.db` in the backend directory
- The database is automatically created on first run
- CORS is configured to allow requests from the Vite dev server (localhost:5173)
- All API responses follow a consistent JSON structure

## Troubleshooting

### Backend won't start
- Ensure Python 3.11+ is installed
- Check that the virtual environment is activated
- Verify all dependencies are installed: `pip install -r requirements.txt`

### Frontend won't start
- Ensure Node.js is installed
- Delete `node_modules` and run `npm install` again
- Check that the backend is running on port 8000

### Database errors
- Delete `app.db` file to reset the database
- The database will be recreated automatically

### CORS errors
- Ensure the backend is running on port 8000
- Ensure the frontend is running on port 5173
- Check CORS settings in `backend/main.py`
