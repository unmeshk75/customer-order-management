"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field, model_validator
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
    company_name: Optional[str] = Field(None, max_length=200)
    account_status: str = Field('Active', pattern="^(Active|Inactive|Suspended)$")
    contact_preference: str = Field('Email', pattern="^(Email|Phone|Both)$")


class CustomerCreate(CustomerBase):
    """Schema for creating a new customer"""

    @model_validator(mode='after')
    def check_company_name_required(self):
        if self.customer_type in ('SMB', 'Enterprise') and not self.company_name:
            raise ValueError('company_name is required for SMB and Enterprise customers')
        return self


class CustomerUpdate(CustomerBase):
    """Schema for updating an existing customer"""

    @model_validator(mode='after')
    def check_company_name_required(self):
        if self.customer_type in ('SMB', 'Enterprise') and not self.company_name:
            raise ValueError('company_name is required for SMB and Enterprise customers')
        return self


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
    stock_quantity: int = Field(100, ge=0)


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
    priority: str = Field('Medium', pattern="^(Low|Medium|High|Critical)$")
    discount_percentage: float = Field(0.0, ge=0, le=100)


class OrderCreate(OrderBase):
    """Schema for creating a new order"""
    customer_id: int = Field(..., gt=0)
    products: List[OrderProductItem] = Field(..., min_length=1)


class OrderUpdate(BaseModel):
    """Schema for updating an existing order"""
    status: Optional[str] = Field(None, pattern="^(Active|Cancelled|Completed)$")
    notes: Optional[str] = Field(None, max_length=500)
    priority: Optional[str] = Field(None, pattern="^(Low|Medium|High|Critical)$")
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)


class OrderResponse(OrderBase):
    """Schema for order response with full details"""
    id: int
    customer_id: int
    customer_name: str
    customer_type: str
    order_date: datetime
    status: str
    total_amount: float
    discounted_total: float
    products: List[OrderProductResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Dashboard Schemas ====================

class LowStockProduct(BaseModel):
    id: int
    name: str
    product_type: str
    stock_quantity: int


class DashboardResponse(BaseModel):
    customers_by_type: dict
    orders_by_status: dict
    total_revenue: float
    low_stock_products: List[LowStockProduct]


# ==================== Utility Schemas ====================

class HealthResponse(BaseModel):
    """Schema for health check response"""
    status: str
    message: str
