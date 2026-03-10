"""
CRUD operations for Customer, Product, and Order entities.
"""

from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas


# ==================== Customer CRUD ====================

def get_customers(db: Session, skip: int = 0, limit: int = 100) -> List[models.Customer]:
    """Get all customers with pagination"""
    return db.query(models.Customer).offset(skip).limit(limit).all()


def get_customer_by_id(db: Session, customer_id: int) -> Optional[models.Customer]:
    """Get customer by ID"""
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()


def get_customer_by_email(db: Session, email: str) -> Optional[models.Customer]:
    """Get customer by email"""
    return db.query(models.Customer).filter(models.Customer.email == email).first()


def create_customer(db: Session, customer: schemas.CustomerCreate) -> models.Customer:
    """Create a new customer"""
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def update_customer(db: Session, customer_id: int, customer: schemas.CustomerUpdate) -> Optional[models.Customer]:
    """Update an existing customer"""
    db_customer = get_customer_by_id(db, customer_id)
    if db_customer:
        for key, value in customer.model_dump().items():
            setattr(db_customer, key, value)
        db.commit()
        db.refresh(db_customer)
    return db_customer


def delete_customer(db: Session, customer_id: int) -> bool:
    """Delete a customer (cascade deletes orders)"""
    db_customer = get_customer_by_id(db, customer_id)
    if db_customer:
        db.delete(db_customer)
        db.commit()
        return True
    return False


# ==================== Product CRUD ====================

def get_products(db: Session, skip: int = 0, limit: int = 100) -> List[models.Product]:
    """Get all products with pagination"""
    return db.query(models.Product).offset(skip).limit(limit).all()


def get_product_by_id(db: Session, product_id: int) -> Optional[models.Product]:
    """Get product by ID"""
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def get_products_by_ids(db: Session, product_ids: List[int]) -> List[models.Product]:
    """Get multiple products by IDs"""
    return db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()


def get_products_by_type(db: Session, product_type: str) -> List[models.Product]:
    """Get products by type"""
    return db.query(models.Product).filter(models.Product.product_type == product_type).all()


def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    """Create a new product"""
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(db: Session, product_id: int, product: schemas.ProductUpdate) -> Optional[models.Product]:
    """Update an existing product"""
    db_product = get_product_by_id(db, product_id)
    if db_product:
        for key, value in product.model_dump().items():
            setattr(db_product, key, value)
        db.commit()
        db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int) -> bool:
    """Delete a product (restricted if used in orders)"""
    db_product = get_product_by_id(db, product_id)
    if db_product:
        db.delete(db_product)
        db.commit()
        return True
    return False


# ==================== Order CRUD ====================

def get_orders(db: Session, skip: int = 0, limit: int = 100) -> List[models.Order]:
    """Get all orders with pagination"""
    return db.query(models.Order).offset(skip).limit(limit).all()


def get_order_by_id(db: Session, order_id: int) -> Optional[models.Order]:
    """Get order by ID"""
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def create_order(db: Session, order: schemas.OrderCreate) -> models.Order:
    """
    Create a new order with products.
    Validates and decrements stock. Uses transaction to ensure atomicity.
    """
    # Create order
    db_order = models.Order(
        customer_id=order.customer_id,
        notes=order.notes,
        priority=order.priority,
        discount_percentage=order.discount_percentage,
        status="Active"
    )
    db.add(db_order)
    db.flush()  # Get the order ID without committing

    # Create order products and calculate total
    total_amount = 0.0
    for item in order.products:
        # Get product to get current price and check stock
        product = get_product_by_id(db, item.product_id)
        if not product:
            db.rollback()
            raise ValueError(f"Product with id {item.product_id} not found")

        # Validate stock
        if product.stock_quantity < item.seats:
            db.rollback()
            raise ValueError(
                f"Insufficient stock for '{product.name}': "
                f"{product.stock_quantity} available, {item.seats} requested"
            )

        # Decrement stock
        product.stock_quantity -= item.seats

        # Calculate subtotal
        subtotal = product.price_per_seat * item.seats

        # Create order product entry
        db_order_product = models.OrderProduct(
            order_id=db_order.id,
            product_id=item.product_id,
            seats=item.seats,
            unit_price=product.price_per_seat,
            subtotal=subtotal
        )
        db.add(db_order_product)
        total_amount += subtotal

    # Update order total
    db_order.total_amount = total_amount

    # Commit transaction
    db.commit()
    db.refresh(db_order)
    return db_order


def update_order(db: Session, order_id: int, order: schemas.OrderUpdate) -> Optional[models.Order]:
    """Update an existing order (status, notes, priority, discount)"""
    db_order = get_order_by_id(db, order_id)
    if db_order:
        if order.status is not None:
            db_order.status = order.status
        if order.notes is not None:
            db_order.notes = order.notes
        if order.priority is not None:
            db_order.priority = order.priority
        if order.discount_percentage is not None:
            db_order.discount_percentage = order.discount_percentage
        db.commit()
        db.refresh(db_order)
    return db_order


def delete_order(db: Session, order_id: int) -> bool:
    """Delete an order and restore stock for all associated products"""
    db_order = get_order_by_id(db, order_id)
    if db_order:
        # Restore stock for each product in the order
        for op in db_order.order_products:
            product = get_product_by_id(db, op.product_id)
            if product:
                product.stock_quantity += op.seats
        db.delete(db_order)
        db.commit()
        return True
    return False
