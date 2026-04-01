from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Customer(Base):
    """Customer model with three types: Consumer, SMB, Enterprise"""
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    customer_type = Column(String(20), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(20))
    street_address = Column(String(200))
    city = Column(String(100))
    state = Column(String(2))  # Optional, only for US addresses
    zip_code = Column(String(20))
    country = Column(String(100))
    company_name = Column(String(200))
    account_status = Column(String(20), nullable=False, default='Active')
    contact_preference = Column(String(20), nullable=False, default='Email')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")

    # Check constraints
    __table_args__ = (
        CheckConstraint(
            customer_type.in_(['Consumer', 'SMB', 'Enterprise']),
            name='check_customer_type'
        ),
        CheckConstraint(
            account_status.in_(['Active', 'Inactive', 'Suspended']),
            name='check_account_status'
        ),
        CheckConstraint(
            contact_preference.in_(['Email', 'Phone', 'Both']),
            name='check_contact_preference'
        ),
    )


class Product(Base):
    """Product model with four types: Basic, Professional, Teams, Ultra-Enterprise"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    product_type = Column(String(30), nullable=False)
    description = Column(String(500))
    price_per_seat = Column(Float, nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    order_products = relationship("OrderProduct", back_populates="product")

    # Check constraints
    __table_args__ = (
        CheckConstraint(
            product_type.in_(['Basic', 'Professional', 'Teams', 'Ultra-Enterprise']),
            name='check_product_type'
        ),
        CheckConstraint(stock_quantity >= 0, name='check_stock_non_negative'),
    )


class Order(Base):
    """Order model - belongs to one customer, contains multiple products"""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="Active")
    total_amount = Column(Float)
    notes = Column(String(500))
    priority = Column(String(20), nullable=False, default='Medium')
    discount_percentage = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    order_products = relationship("OrderProduct", back_populates="order", cascade="all, delete-orphan")

    # Check constraints
    __table_args__ = (
        CheckConstraint(
            status.in_(['Active', 'Cancelled', 'Completed']),
            name='check_order_status'
        ),
        CheckConstraint(
            priority.in_(['Low', 'Medium', 'High', 'Critical']),
            name='check_order_priority'
        ),
        CheckConstraint(
            (discount_percentage >= 0) & (discount_percentage <= 100),
            name='check_discount_range'
        ),
    )


class OrderProduct(Base):
    """Junction table for Order-Product many-to-many relationship"""
    __tablename__ = "order_products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    seats = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)  # Price snapshot at order time
    subtotal = Column(Float, nullable=False)  # seats * unit_price

    # Relationships
    order = relationship("Order", back_populates="order_products")
    product = relationship("Product", back_populates="order_products")

    # Create unique index on (order_id, product_id)
    from sqlalchemy import Index
    __table_args__ = (
        CheckConstraint(seats > 0, name='check_seats_positive'),
        Index('idx_unique_order_product', 'order_id', 'product_id', unique=True),
    )
