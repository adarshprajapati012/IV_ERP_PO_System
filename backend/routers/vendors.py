from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend import models, schemas
from fastapi.security import OAuth2PasswordBearer
from backend.auth.jwt_handler import verify_token

router = APIRouter(
    prefix="/vendors",
    tags=["vendors"]
)

# Use simple dependency injection for protected routes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    return verify_token(token)

@router.get("/", response_model=List[schemas.Vendor])
def get_vendors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    vendors = db.query(models.Vendor).offset(skip).limit(limit).all()
    return vendors

@router.post("/", response_model=schemas.Vendor)
def create_vendor(vendor: schemas.VendorCreate, db: Session = Depends(get_db)):
    db_vendor = models.Vendor(**vendor.model_dump())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor
