import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# We expect DATABASE_URL from .env
# Example for Neon: postgresql://username:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/erp_system")

# SQLAlchemy 1.4+ removed support for the 'postgres://' connection scheme. 
# It must be 'postgresql://'
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True, # Recommended for serverless Postgres
    pool_size=5,
    max_overflow=10
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
