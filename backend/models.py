from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    contact = Column(String(255))
    rating = Column(Numeric(3, 2), default=0.0)

    purchase_orders = relationship("PurchaseOrder", back_populates="vendor")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    stock_level = Column(Integer, default=0, nullable=False)
    description = Column(Text)

    po_items = relationship("PurchaseOrderItem", back_populates="product")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    reference_no = Column(String(100), unique=True, index=True, nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    total_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    status = Column(String(50), default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    vendor = relationship("Vendor", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    line_total = Column(Numeric(15, 2), nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product", back_populates="po_items")
