"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime


# ==================== Customer Schemas ====================

class CustomerBase(BaseModel):
    """Base customer schema with common fields"""
    name: str = Field(..., min_length=1, max_length=100)
    customer_type: str = Field(..., pattern="^(Consumer|SMB|Enterprise)$")
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    street_address: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=2)
    zip_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)


class CustomerCreate(CustomerBase):
    """Schema for creating a new customer"""
    pass


class CustomerUpdate(CustomerBase):
    """Schema for updating an existing customer"""
    pass


class CustomerResponse(CustomerBase):
    """Schema for customer response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Product Schemas ====================

class ProductBase(BaseModel):
    """Base product schema with common fields"""
    name: str = Field(..., min_length=1, max_length=100)
    product_type: str = Field(..., pattern="^(Basic|Professional|Teams|Ultra-Enterprise)$")
    description: Optional[str] = Field(None, max_length=500)
    price_per_seat: float = Field(..., gt=0)


class ProductCreate(ProductBase):
    """Schema for creating a new product"""
    pass


class ProductUpdate(ProductBase):
    """Schema for updating an existing product"""
    pass


class ProductResponse(ProductBase):
    """Schema for product response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Order Schemas ====================

class OrderProductItem(BaseModel):
    """Schema for product item in an order"""
    product_id: int = Field(..., gt=0)
    seats: int = Field(..., gt=0)


class OrderProductResponse(BaseModel):
    """Schema for order product response with product details"""
    id: int
    product_id: int
    product_name: str
    product_type: str
    seats: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    """Base order schema"""
    notes: Optional[str] = Field(None, max_length=500)


class OrderCreate(OrderBase):
    """Schema for creating a new order"""
    customer_id: int = Field(..., gt=0)
    products: List[OrderProductItem] = Field(..., min_length=1)


class OrderUpdate(BaseModel):
    """Schema for updating an existing order"""
    status: Optional[str] = Field(None, pattern="^(Active|Cancelled|Completed)$")
    notes: Optional[str] = Field(None, max_length=500)


class OrderResponse(OrderBase):
    """Schema for order response with full details"""
    id: int
    customer_id: int
    customer_name: str
    customer_type: str
    order_date: datetime
    status: str
    total_amount: float
    products: List[OrderProductResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Utility Schemas ====================

class HealthResponse(BaseModel):
    """Schema for health check response"""
    status: str
    message: str
