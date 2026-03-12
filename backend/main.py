import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.database import engine, Base
from backend.routers import vendors, products, purchase_orders
from backend.schemas import LoginRequest, Token
from backend.auth.oauth import verify_google_token
from backend.auth.jwt_handler import create_access_token

from fastapi.openapi.docs import get_swagger_ui_html

app = FastAPI(title="ERP Purchase Order API", docs_url=None, redoc_url=None)

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js",
        swagger_css_url="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css",
    )

@app.on_event("startup")
def startup_event():
    # Create tables if not exists on startup
    Base.metadata.create_all(bind=engine)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vendors.router)
app.include_router(products.router)
app.include_router(purchase_orders.router)


@app.post("/auth/login", response_model=Token)
async def login(request: LoginRequest):
    """
    Login endpoint handling Google OAuth.
    The frontend gets the JWT from Google and sends it here to be verified.
    If valid, issue our own API access token.
    """
    google_token = request.token
    user_info = verify_google_token(google_token)
    
    if "email" not in user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google Auth."
        )

    # Issue an access token bridging frontend and API
    access_token = create_access_token(data={"sub": user_info["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/")
def read_root():
    return {"message": "Welcome to ERP Purchase Order System API."}

# Serve frontend static files (CSS, JS, HTML) — must be last so API routes take priority
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.isdir(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
