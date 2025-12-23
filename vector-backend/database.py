# vector-backend/database.py - UPDATED TO MATCH PRISMA SCHEMA
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, Boolean, JSON, DECIMAL, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import mapped_column
from datetime import datetime
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Create database engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """Initialize database and create tables"""
    try:
        Base.metadata.create_all(bind=engine)
        return True
    except Exception as e:
        logging.error(f"Database initialization failed: {e}")
        return False

# Influencer Model - Matches Prisma Schema Exactly
class Influencer(Base):
    __tablename__ = "influencers"
    
    # Use String for CUID instead of UUID
    id = Column(String, primary_key=True)  # @default(cuid())
    
    # Basic Info
    username = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)  # fullName in Prisma
    email = Column(String, nullable=True)
    
    # Social Media Handles
    instagram_handle = Column(String, nullable=True)
    youtube_channel = Column(String, nullable=True, index=True)
    tiktok_handle = Column(String, nullable=True, index=True)
    
    # Follower Counts
    instagram_followers = Column(Integer, default=0)
    youtube_subscribers = Column(Integer, default=0)
    tiktok_followers = Column(Integer, default=0)
    total_followers = mapped_column(Integer, insert_default=None, server_default=None, nullable=True, index=True)
    
    # NEW YOUTUBE METRICS
    video_count = Column(Integer, default=0, index=True)
    total_views = Column(BigInteger, default=0, index=True)  # BigInt in Prisma
    youtube_url = Column(String, nullable=True)
    
    # Engagement & Category
    engagement_rate = Column(DECIMAL(5,2), nullable=True, index=True)
    category = Column(String, nullable=True, index=True)
    
    # Profile Info
    bio = Column(Text, nullable=True)
    profile_image_url = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    
    # Vector Search Support
    embedding_vector = Column(JSON, nullable=True)
    content_hash = Column(String, nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_updated = Column(DateTime, nullable=True)




# Influencer Auth Model

class InfluencerAuth(Base):
    __tablename__ = "influencer_auth"
    
    id = Column(String, primary_key=True)  # Links to influencers.id
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)



# User Model - Simplified to Match Prisma
# User Model - Complete to match Supabase users table
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    google_id = Column(String, nullable=True)
    is_google_user = Column(Boolean, default=False)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Subscription fields
    subscription_tier = Column(String, default="free")
    search_count = Column(Integer, default=0)
    monthly_searches = Column(Integer, default=0)
    search_limit = Column(Integer, default=10)
    
    # ✅ NEW: Tool-specific subscriptions (JSONB in Supabase)
    humanizer_tier = Column(String, default="free")
    tool_subscriptions = Column(JSON, nullable=True)  # {"ai_humanizer": "pro", "infoishai_search": "pro"}
    
    # Subscription dates
    subscription_start_date = Column(DateTime, nullable=True)
    subscription_end_date = Column(DateTime, nullable=True)
    subscription_status = Column(String, default="inactive")
    auto_renew = Column(Boolean, default=False)
    last_payment_date = Column(DateTime, nullable=True)
    next_billing_date = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    

# Extended User model for authentication (add columns as needed)
class AuthUser(Base):
    __tablename__ = "auth_users"  # Separate table for auth-specific fields
    
    id = Column(String, primary_key=True)  # Links to users.id
    full_name = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    
    # Subscription management
    subscription_tier = Column(String, default="free")
    search_count = Column(Integer, default=0)
    monthly_searches = Column(Integer, default=0)
    search_limit = Column(Integer, default=15)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Search Logs - Matches Prisma
class SearchLog(Base):
    __tablename__ = "search_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    query = Column(String, nullable=False)
    user_email = Column(String, nullable=True)
    results_count = Column(Integer, default=0)
    filters_applied = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

# API Keys - Matches Prisma
class ApiKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    key_hash = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    plan_type = Column(String, default="free")
    requests_per_day = Column(Integer, default=100)
    requests_used_today = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)

# Platform Model - Matches Prisma
class Platform(Base):
    __tablename__ = "platforms"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    display_name = Column(String, nullable=False)