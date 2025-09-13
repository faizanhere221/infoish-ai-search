# vector-backend/config.py - Updated with Google OAuth
import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings

def find_env_file():
    current_dir = Path(__file__).parent
    for parent in [current_dir] + list(current_dir.parents):
        env_path = parent / ".env"
        if env_path.exists():
            print(f"Found .env file at: {env_path}")
            return str(env_path)
    print("No .env file found")
    return None

class Settings(BaseSettings):
    # Database - Default to SQLite for easy development
    DATABASE_URL: str = "sqlite:///./influencer.db"
    
    # Accept USE_SQLITE from .env to prevent validation errors
    USE_SQLITE: Optional[str] = None
    
    # OpenAI - Optional for basic functionality
    OPENAI_API_KEY: Optional[str] = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536
    
    # Pinecone - Optional for basic functionality
    PINECONE_API_KEY: Optional[str] = ""
    PINECONE_ENVIRONMENT: str = "us-east-1-aws"
    PINECONE_INDEX_NAME: Optional[str] = "aiinfluencersearch"
    
    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: Optional[str] = ""
    GOOGLE_CLIENT_SECRET: Optional[str] = ""
    
    # Authentication
    JWT_SECRET_KEY: Optional[str] = None
    JWT_EXPIRE_HOURS: int = 24
    
    # Batch processing
    EMBEDDING_BATCH_SIZE: int = 100
    MAX_TEXT_LENGTH: int = 8000
    
    # Rate limiting
    OPENAI_RATE_LIMIT: int = 3000
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 100
    
    # Extra keys
    NEXT_PUBLIC_SUPABASE_URL: Optional[str] = None
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Optional[str] = None
    VALID_API_KEYS: Optional[str] = None
    APIFY_TOKEN: Optional[str] = None

    class Config:
        env_file = find_env_file()
        env_file_encoding = 'utf-8'
        # Allow extra fields to prevent validation errors
        extra = 'allow'

# Get the correct database URL
try:
    # Load settings first (this loads the .env file)
    settings = Settings()
    
    # Now get DATABASE_URL from the loaded settings, not from os.getenv()
    db_url = settings.DATABASE_URL
    
    print(f"DEBUG: DATABASE_URL from settings = '{db_url}'")
    
    # Check if it's a Supabase/PostgreSQL URL
    if db_url and db_url != "sqlite:///./influencer.db":
        if db_url.startswith('postgresql://') or db_url.startswith('postgres://'):
            # Convert postgres:// to postgresql://
            if db_url.startswith('postgres://'):
                db_url = db_url.replace('postgres://', 'postgresql://')
            settings.DATABASE_URL = db_url
            print("✅ Using Supabase PostgreSQL database")
        else:
            print(f"✅ Using database: {db_url}")
    else:
        print("⚠️ Using default SQLite database")
    
    print("✅ Configuration loaded successfully")
    print(f"Database: {'SQLite' if 'sqlite' in settings.DATABASE_URL else 'PostgreSQL'}")
    
    if 'postgresql' in settings.DATABASE_URL:
        print("✅ Using Supabase PostgreSQL - your 300 influencer database")
    else:
        print("⚠️ Using local SQLite - switch to PostgreSQL for production")
    
    # Check Google OAuth configuration
    if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
        print("✅ Google OAuth credentials configured")
    else:
        print("⚠️ Google OAuth credentials missing - add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env")

except Exception as e:
    print(f"⚠️ Using default configuration due to: {e}")
    settings = Settings(
        DATABASE_URL="sqlite:///./influencer.db",
        OPENAI_API_KEY="",
        PINECONE_API_KEY="",
        PINECONE_INDEX_NAME="aiinfluencersearch",
        GOOGLE_CLIENT_ID="",
        GOOGLE_CLIENT_SECRET=""
    )
    print("Using SQLite database with default settings")