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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")

    # Check constraint for customer_type
    __table_args__ = (
        CheckConstraint(
            customer_type.in_(['Consumer', 'SMB', 'Enterprise']),
            name='check_customer_type'
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    order_products = relationship("OrderProduct", back_populates="product")

    # Check constraint for product_type
    __table_args__ = (
        CheckConstraint(
            product_type.in_(['Basic', 'Professional', 'Teams', 'Ultra-Enterprise']),
            name='check_product_type'
        ),
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    order_products = relationship("OrderProduct", back_populates="order", cascade="all, delete-orphan")

    # Check constraint for status
    __table_args__ = (
        CheckConstraint(
            status.in_(['Active', 'Cancelled', 'Completed']),
            name='check_order_status'
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

    # Check constraints
    __table_args__ = (
        CheckConstraint(seats > 0, name='check_seats_positive'),
        # Unique constraint to prevent duplicate products in same order
        # This is handled by unique index below
    )

    # Create unique index on (order_id, product_id)
    from sqlalchemy import Index
    __table_args__ = (
        CheckConstraint(seats > 0, name='check_seats_positive'),
        Index('idx_unique_order_product', 'order_id', 'product_id', unique=True),
    )
