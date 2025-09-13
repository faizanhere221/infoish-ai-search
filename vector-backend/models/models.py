from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, JSON, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
import uuid

Base = declarative_base()


class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key_hash = Column(String(64), unique=True, nullable=False)  # SHA256 hash
    name = Column(String(100), nullable=False)  # User identifier
    plan_type = Column(String(20), default="free")  # free, basic, pro, enterprise
    requests_per_day = Column(Integer, default=50)
    requests_used_today = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key_hash = Column(String(64), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    plan_type = Column(String(20), default="free")
    requests_per_day = Column(Integer, default=50)
    requests_used_today = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255))
    first_name = Column(String(100))
    last_name = Column(String(100))
    subscription_plan = Column(String(50), default='free')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Platform(Base):
    __tablename__ = "platforms"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(50), nullable=False)
    base_url = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    parent_id = Column(Integer)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Influencer(Base):
    __tablename__ = "influencers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), nullable=False)
    display_name = Column(String(150))
    email = Column(String(255))
    phone = Column(String(20))
    bio = Column(Text)
    profile_image_url = Column(Text)
    verified = Column(Boolean, default=False)
    status = Column(String(20), default='active')
    location_country = Column(String(100))
    location_city = Column(String(100))
    languages = Column(JSON)
    
    # New embedding fields
    embedding_vector = Column(JSON)  # Store as JSON array for PostgreSQL
    content_hash = Column(String(64))
    embedding_created_at = Column(DateTime)
    embedding_updated_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class InfluencerSocialAccount(Base):
    __tablename__ = "influencer_social_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    influencer_id = Column(UUID(as_uuid=True), nullable=False)
    platform_id = Column(Integer, nullable=False)
    platform_username = Column(String(100), nullable=False)
    platform_user_id = Column(String(100))
    profile_url = Column(Text)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    posts_count = Column(Integer, default=0)
    engagement_rate = Column(DECIMAL(5,2))
    avg_likes = Column(Integer, default=0)
    avg_comments = Column(Integer, default=0)
    avg_shares = Column(Integer, default=0)
    last_post_date = Column(DateTime)
    account_verified = Column(Boolean, default=False)
    is_business_account = Column(Boolean, default=False)
    last_updated = Column(DateTime, default=datetime.utcnow)

class InfluencerCategory(Base):
    __tablename__ = "influencer_categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    influencer_id = Column(UUID(as_uuid=True), nullable=False)
    category_id = Column(Integer, nullable=False)
    relevance_score = Column(DECIMAL(3,2))
    created_at = Column(DateTime, default=datetime.utcnow)

class ContentPost(Base):
    __tablename__ = "content_posts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    influencer_id = Column(UUID(as_uuid=True), nullable=False)
    social_account_id = Column(UUID(as_uuid=True))
    platform_post_id = Column(String(100))
    post_type = Column(String(50))
    caption = Column(Text)
    media_urls = Column(JSON)
    hashtags = Column(JSON)
    mentions = Column(JSON)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    post_date = Column(DateTime)
    engagement_rate = Column(DECIMAL(5,2))
    created_at = Column(DateTime, default=datetime.utcnow)

class SearchLog(Base):
    __tablename__ = "search_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query = Column(Text, nullable=False)
    user_id = Column(UUID(as_uuid=True))
    user_api_key = Column(String(100))
    results_count = Column(Integer, default=0)
    vector_score_threshold = Column(DECIMAL(3,2), default=0.0)
    filters_applied = Column(JSON)
    response_time_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class ApiKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    key_name = Column(String(100), nullable=False)
    api_key = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

# Pydantic models for API responses
class InfluencerResponse(BaseModel):
    id: str  # UUID as string
    username: str
    display_name: Optional[str]
    bio: Optional[str]
    profile_image_url: Optional[str]
    verified: bool
    location_country: Optional[str]
    location_city: Optional[str]
    languages: Optional[List[str]]
    
    # Social media stats (aggregated from accounts)
    total_followers: Optional[int] = 0
    avg_engagement_rate: Optional[float] = 0.0
    platforms: Optional[List[str]] = []
    categories: Optional[List[str]] = []
    
    # Search-specific fields
    similarity_score: Optional[float] = None
    
    class Config:
        from_attributes = True

class SocialAccountResponse(BaseModel):
    platform_name: str
    platform_username: str
    followers_count: int
    engagement_rate: Optional[float]
    verified: bool
    
    class Config:
        from_attributes = True

class SearchRequest(BaseModel):
    query: str
    limit: int = 20
    min_followers: Optional[int] = None
    max_followers: Optional[int] = None
    platforms: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    min_engagement_rate: Optional[float] = None
    countries: Optional[List[str]] = None
    verified_only: Optional[bool] = False

class SearchResponse(BaseModel):
    results: List[InfluencerResponse]
    total_found: int
    query: str
    search_time_ms: int
    filters_applied: dict