from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

# --- Vendor Schemas ---
class VendorBase(BaseModel):
    name: str
    contact: Optional[str] = None
    rating: Optional[Decimal] = Field(default=0.0)

class VendorCreate(VendorBase):
    pass

class Vendor(VendorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    sku: str
    unit_price: Decimal
    stock_level: int = 0
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class GenerateDescriptionRequest(BaseModel):
    product_name: str

class GenerateDescriptionResponse(BaseModel):
    description: str

# --- Purchase Order Item Schemas ---
class PurchaseOrderItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: Decimal

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItem(PurchaseOrderItemBase):
    id: int
    po_id: int
    line_total: Decimal
    model_config = ConfigDict(from_attributes=True)

# --- Purchase Order Schemas ---
class PurchaseOrderBase(BaseModel):
    vendor_id: int
    reference_no: str

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderStatusUpdate(BaseModel):
    status: str

class PurchaseOrder(PurchaseOrderBase):
    id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    items: List[PurchaseOrderItem] = []
    
    # We can also include vendor info if needed
    vendor: Vendor
    
    model_config = ConfigDict(from_attributes=True)

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    token: str # Google JWT token from the frontend
