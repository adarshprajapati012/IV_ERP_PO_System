from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from backend.database import get_db
from backend import models, schemas
from backend.routers.vendors import get_current_user
from decimal import Decimal
from datetime import datetime

router = APIRouter(
    prefix="/purchase-orders",
    tags=["purchase-orders"]
)

# TAX RATE as per assignment
TAX_RATE = Decimal("0.05")

@router.get("/", response_model=List[schemas.PurchaseOrder])
def get_purchase_orders(
    skip: int = 0,
    limit: int = 200,
    status: Optional[str] = Query(None, description="Filter by status: Pending, Approved, Rejected"),
    vendor_id: Optional[int] = Query(None, description="Filter by vendor ID"),
    search: Optional[str] = Query(None, description="Search by reference number"),
    date_from: Optional[str] = Query(None, description="Filter by created date from (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter by created date to (YYYY-MM-DD)"),
    min_amount: Optional[float] = Query(None, description="Minimum total amount"),
    max_amount: Optional[float] = Query(None, description="Maximum total amount"),
    db: Session = Depends(get_db)
):
    query = db.query(models.PurchaseOrder)

    if status:
        query = query.filter(models.PurchaseOrder.status == status)

    if vendor_id:
        query = query.filter(models.PurchaseOrder.vendor_id == vendor_id)

    if search:
        query = query.filter(models.PurchaseOrder.reference_no.ilike(f"%{search}%"))

    if date_from:
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(models.PurchaseOrder.created_at >= dt_from)
        except ValueError:
            pass

    if date_to:
        try:
            dt_to = datetime.strptime(date_to, "%Y-%m-%d")
            # include the full day
            from datetime import timedelta
            dt_to = dt_to + timedelta(days=1)
            query = query.filter(models.PurchaseOrder.created_at < dt_to)
        except ValueError:
            pass

    if min_amount is not None:
        query = query.filter(models.PurchaseOrder.total_amount >= min_amount)

    if max_amount is not None:
        query = query.filter(models.PurchaseOrder.total_amount <= max_amount)

    pos = query.order_by(models.PurchaseOrder.created_at.desc()).offset(skip).limit(limit).all()
    return pos

@router.get("/{id}", response_model=schemas.PurchaseOrder)
def get_purchase_order(id: int, db: Session = Depends(get_db)):
    po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return po

@router.post("/", response_model=schemas.PurchaseOrder)
def create_purchase_order(po: schemas.PurchaseOrderCreate, db: Session = Depends(get_db)):
    # Calculate Subtotal
    subtotal = Decimal("0.00")
    for item in po.items:
        line_total = Decimal(str(item.quantity)) * Decimal(str(item.unit_price))
        subtotal += line_total
    
    # Calculate Tax and Total
    tax = subtotal * TAX_RATE
    total_amount = subtotal + tax

    # Create PO
    db_po = models.PurchaseOrder(
        vendor_id=po.vendor_id,
        reference_no=po.reference_no,
        total_amount=total_amount,
        status="Pending"
    )
    db.add(db_po)
    db.flush() # To get po.id

    # Add items
    for item in po.items:
        line_total = Decimal(str(item.quantity)) * Decimal(str(item.unit_price))
        db_item = models.PurchaseOrderItem(
            po_id=db_po.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            line_total=line_total
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_po)
    return db_po

@router.patch("/{id}/status", response_model=schemas.PurchaseOrder)
def update_status(id: int, status_update: schemas.PurchaseOrderStatusUpdate, db: Session = Depends(get_db)):
    po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    po.status = status_update.status
    db.commit()
    db.refresh(po)
    return po
