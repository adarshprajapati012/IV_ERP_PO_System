import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend import models, schemas
from backend.routers.vendors import get_current_user

router = APIRouter(
    prefix="/products",
    tags=["products"]
)

# OpenRouter AI will grab the key dynamically in the endpoint.

@router.get("/", response_model=List[schemas.Product])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(models.Product).offset(skip).limit(limit).all()
    return products

@router.post("/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.post("/generate-description", response_model=schemas.GenerateDescriptionResponse)
def generate_product_description(request: schemas.GenerateDescriptionRequest, user = Depends(get_current_user)):
    """
    Generate product marketing description using OpenRouter API (Nemotron model).
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key or api_key == "your_openrouter_api_key_here":
        # Mock description if API key is not set
        return {"description": f"Experience the best with {request.product_name}. Quality guaranteed."}

    prompt = f"Write a professional 2 sentence marketing description for a product named {request.product_name}."
    
    try:
        import requests
        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost:3000", # Required by OpenRouter
            "X-Title": "ERP PO System", # Optional by OpenRouter
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "nvidia/nemotron-3-super-120b-a12b:free",
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        description = data["choices"][0]["message"]["content"].strip()
        
        return {"description": description}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Generation Failed: {str(e)}")
