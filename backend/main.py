"""
FastAPI application for Customer/Product/Order management.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from typing import List
import uvicorn

import models
import schemas
import crud
import business_rules
from database import engine, get_db, init_db

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Customer Order Management API",
    description="API for managing customers, products, and orders",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def build_order_response(db_order, db: Session) -> schemas.OrderResponse:
    """Build a full OrderResponse from a db Order object."""
    products = []
    for op in db_order.order_products:
        products.append(schemas.OrderProductResponse(
            id=op.id,
            product_id=op.product_id,
            product_name=op.product.name,
            product_type=op.product.product_type,
            seats=op.seats,
            unit_price=op.unit_price,
            subtotal=op.subtotal
        ))

    discount_pct = db_order.discount_percentage if db_order.discount_percentage is not None else 0.0
    total = db_order.total_amount if db_order.total_amount is not None else 0.0
    discounted_total = total * (1 - discount_pct / 100)

    return schemas.OrderResponse(
        id=db_order.id,
        customer_id=db_order.customer_id,
        customer_name=db_order.customer.name,
        customer_type=db_order.customer.customer_type,
        order_date=db_order.order_date,
        status=db_order.status,
        total_amount=total,
        discounted_total=discounted_total,
        notes=db_order.notes,
        priority=db_order.priority if db_order.priority else 'Medium',
        discount_percentage=discount_pct,
        products=products,
        created_at=db_order.created_at,
        updated_at=db_order.updated_at
    )


# ==================== Customer Endpoints ====================

@app.get("/api/customers", response_model=List[schemas.CustomerResponse])
async def list_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all customers"""
    customers = crud.get_customers(db, skip=skip, limit=limit)
    return customers


@app.get("/api/customers/{customer_id}", response_model=schemas.CustomerResponse)
async def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get customer by ID"""
    customer = crud.get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@app.post("/api/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer"""
    # Check if email already exists
    existing = crud.get_customer_by_email(db, customer.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    return crud.create_customer(db, customer)


@app.put("/api/customers/{customer_id}", response_model=schemas.CustomerResponse)
async def update_customer(
    customer_id: int,
    customer: schemas.CustomerUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing customer"""
    # Check if customer exists
    existing = crud.get_customer_by_id(db, customer_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Check if email is being changed to an existing email
    if customer.email != existing.email:
        email_check = crud.get_customer_by_email(db, customer.email)
        if email_check:
            raise HTTPException(status_code=400, detail="Email already registered")

    updated = crud.update_customer(db, customer_id, customer)
    return updated


@app.delete("/api/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """Delete a customer (cascade deletes orders)"""
    success = crud.delete_customer(db, customer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Customer not found")
    return None


# ==================== Product Endpoints ====================

@app.get("/api/products", response_model=List[schemas.ProductResponse])
async def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all products"""
    products = crud.get_products(db, skip=skip, limit=limit)
    return products


@app.get("/api/products/{product_id}", response_model=schemas.ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get product by ID"""
    product = crud.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.post("/api/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    """Create a new product"""
    return crud.create_product(db, product)


@app.put("/api/products/{product_id}", response_model=schemas.ProductResponse)
async def update_product(
    product_id: int,
    product: schemas.ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing product"""
    existing = crud.get_product_by_id(db, product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    updated = crud.update_product(db, product_id, product)
    return updated


@app.delete("/api/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product (restricted if used in orders)"""
    try:
        success = crud.delete_product(db, product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete product that is referenced in existing orders"
        )
    return None


# ==================== Order Endpoints ====================

@app.get("/api/orders", response_model=List[schemas.OrderResponse])
async def list_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all orders with customer and product details"""
    db_orders = crud.get_orders(db, skip=skip, limit=limit)
    return [build_order_response(o, db) for o in db_orders]


@app.get("/api/orders/{order_id}", response_model=schemas.OrderResponse)
async def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get order by ID with full details"""
    db_order = crud.get_order_by_id(db, order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    return build_order_response(db_order, db)


@app.post("/api/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    """
    Create a new order with business rule validation.
    Validates that products are allowed for the customer type and stock is sufficient.
    """
    # 1. Check customer exists
    customer = crud.get_customer_by_id(db, order.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # 2. Check all products exist
    product_ids = [item.product_id for item in order.products]
    products = crud.get_products_by_ids(db, product_ids)

    if len(products) != len(product_ids):
        found_ids = {p.id for p in products}
        missing_ids = [pid for pid in product_ids if pid not in found_ids]
        raise HTTPException(
            status_code=404,
            detail=f"Products not found: {missing_ids}"
        )

    # 3. Validate business rules - product availability for customer type
    product_types = [p.product_type for p in products]
    is_valid, error_msg = business_rules.validate_product_for_customer(
        customer.customer_type,
        product_types
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # 4. Check for duplicate products in order
    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(
            status_code=400,
            detail="Cannot add the same product multiple times to an order"
        )

    # 5. Create order with transaction (stock check happens inside crud.create_order)
    try:
        db_order = crud.create_order(db, order)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Return formatted response
    return await get_order(db_order.id, db)


@app.put("/api/orders/{order_id}", response_model=schemas.OrderResponse)
async def update_order(
    order_id: int,
    order: schemas.OrderUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing order (status, notes, priority, discount)"""
    existing = crud.get_order_by_id(db, order_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")

    updated = crud.update_order(db, order_id, order)
    return await get_order(updated.id, db)


@app.delete("/api/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Delete an order (cascade deletes order_products, restores stock)"""
    success = crud.delete_order(db, order_id)
    if not success:
        raise HTTPException(status_code=404, detail="Order not found")
    return None


# ==================== Utility Endpoints ====================

@app.get("/api/products/available/{customer_type}", response_model=List[str])
async def get_available_products(customer_type: str):
    """Get list of product types available for a customer type"""
    available = business_rules.get_available_products_for_customer(customer_type)
    if not available:
        raise HTTPException(status_code=400, detail=f"Invalid customer type: {customer_type}")
    return available


@app.get("/api/dashboard", response_model=schemas.DashboardResponse)
async def get_dashboard(db: Session = Depends(get_db)):
    """Get dashboard summary: customer counts, order counts, revenue, low stock alerts"""
    # Customer counts by type
    customer_counts = db.query(
        models.Customer.customer_type,
        sqlfunc.count(models.Customer.id)
    ).group_by(models.Customer.customer_type).all()
    customers_by_type = {ct: count for ct, count in customer_counts}

    # Order counts by status
    order_counts = db.query(
        models.Order.status,
        sqlfunc.count(models.Order.id)
    ).group_by(models.Order.status).all()
    orders_by_status = {s: count for s, count in order_counts}

    # Total revenue (Active + Completed orders only)
    revenue_result = db.query(
        sqlfunc.sum(models.Order.total_amount)
    ).filter(models.Order.status.in_(['Active', 'Completed'])).scalar()
    total_revenue = float(revenue_result or 0.0)

    # Low stock products (stock < 10)
    low_stock = db.query(models.Product).filter(
        models.Product.stock_quantity < 10
    ).all()
    low_stock_products = [
        schemas.LowStockProduct(
            id=p.id,
            name=p.name,
            product_type=p.product_type,
            stock_quantity=p.stock_quantity
        ) for p in low_stock
    ]

    return schemas.DashboardResponse(
        customers_by_type=customers_by_type,
        orders_by_status=orders_by_status,
        total_revenue=total_revenue,
        low_stock_products=low_stock_products
    )


@app.get("/api/health", response_model=schemas.HealthResponse)
async def health_check():
    """Health check endpoint"""
    return schemas.HealthResponse(status="healthy", message="API is running")


# Run the application
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
