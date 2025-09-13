# vector-backend/models/api_models.py
"""
Updated API models to work with your existing Prisma schema
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, BigInteger, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import secrets
import string

Base = declarative_base()

class ApiKey(Base):
    """
    Updated to match your existing schema where id is INTEGER
    """
    __tablename__ = "api_keys"
    
    # Primary key - matches your Prisma schema (INTEGER)
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Core API key data
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Allow null for existing records
    key_name = Column(String(100), nullable=False, default="Default Key")
    api_key = Column(String(64), unique=True, nullable=False, index=True)
    api_secret = Column(String(128), nullable=False)
    
    # Your existing fields from Prisma schema
    key_hash = Column(String, unique=True, nullable=True)  # From your schema
    name = Column(String, nullable=True)  # From your schema
    email = Column(String, nullable=True)  # From your schema
    plan_type = Column(String, default="free")  # From your schema
    requests_per_day = Column(Integer, default=100)  # From your schema
    requests_used_today = Column(Integer, default=0)  # From your schema
    
    # Enhanced tracking fields
    requests_made = Column(Integer, default=0)
    monthly_requests = Column(Integer, default=0)
    last_used = Column(DateTime, nullable=True)
    
    # Limits and status
    is_active = Column(Boolean, default=True)
    rate_limit_per_minute = Column(Integer, default=100)
    monthly_limit = Column(Integer, default=50000)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    last_request_ip = Column(String(45), nullable=True)
    
    # Relationships
    usage_logs = relationship("ApiUsage", back_populates="api_key", cascade="all, delete-orphan")

class ApiUsage(Base):
    """
    Usage tracking table with INTEGER foreign key to match api_keys.id
    """
    __tablename__ = "api_usage"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=False, index=True)
    endpoint = Column(String(100), nullable=False)
    method = Column(String(10), nullable=False)
    
    # Request details
    query_params = Column(Text, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    status_code = Column(Integer, nullable=False)
    results_count = Column(Integer, default=0)
    
    # Tracking
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    api_key = relationship("ApiKey", back_populates="usage_logs")

# Updated API Key Service to work with your schema
class APIKeyService:
    
    @staticmethod
    def generate_api_credentials():
        """Generate API key and secret pair"""
        api_key = 'pk_' + ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        api_secret = 'sk_' + ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(48))
        return api_key, api_secret
    
    @staticmethod
    def create_api_key(db, user_id: str, key_name: str, subscription_tier: str = "pro"):
        """Create new API key compatible with your schema"""
        
        # Check existing keys for this user
        existing_keys = db.query(ApiKey).filter(
            ApiKey.user_id == user_id,
            ApiKey.is_active == True
        ).count()
        
        max_keys = {"free": 0, "starter": 0, "pro": 5}
        
        if existing_keys >= max_keys.get(subscription_tier, 0):
            raise ValueError(f"Maximum API keys reached for {subscription_tier} tier")
        
        api_key, api_secret = APIKeyService.generate_api_credentials()
        
        # Set limits based on subscription
        limits = {
            "pro": {"per_minute": 100, "monthly": 50000, "daily": 2000}
        }
        
        tier_limits = limits.get(subscription_tier, {"per_minute": 0, "monthly": 0, "daily": 0})
        
        new_key = ApiKey(
            user_id=user_id,
            key_name=key_name,
            api_key=api_key,
            api_secret=api_secret,
            
            # Set both old and new fields for compatibility
            name=key_name,  # Your existing field
            plan_type=subscription_tier,  # Your existing field
            requests_per_day=tier_limits["daily"],  # Your existing field
            
            # New enhanced fields
            rate_limit_per_minute=tier_limits["per_minute"],
            monthly_limit=tier_limits["monthly"],
            expires_at=datetime.utcnow() + timedelta(days=365) if subscription_tier == "pro" else None
        )
        
        db.add(new_key)
        db.commit()
        db.refresh(new_key)
        
        return new_key
    
    @staticmethod
    def validate_api_key(db, api_key: str, api_secret: str = None):
        """Validate API key and secret"""
        key_record = db.query(ApiKey).filter(
            ApiKey.api_key == api_key,
            ApiKey.is_active == True
        ).first()
        
        if not key_record:
            return None, "Invalid API key"
        
        # Check expiration
        if key_record.expires_at and key_record.expires_at < datetime.utcnow():
            return None, "API key expired"
        
        # Validate secret if provided
        if api_secret and key_record.api_secret != api_secret:
            return None, "Invalid API secret"
        
        # Check monthly limits
        if key_record.monthly_requests >= key_record.monthly_limit:
            return None, "Monthly limit exceeded"
        
        # Check daily limits (your existing field)
        if key_record.requests_used_today >= key_record.requests_per_day:
            return None, "Daily limit exceeded"
        
        return key_record, None
    
    @staticmethod
    def check_rate_limit(db, api_key_record: ApiKey):
        """Check if API key is within rate limits"""
        from datetime import timedelta
        
        one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
        
        recent_requests = db.query(ApiUsage).filter(
            ApiUsage.api_key_id == api_key_record.id,
            ApiUsage.timestamp >= one_minute_ago
        ).count()
        
        return recent_requests < api_key_record.rate_limit_per_minute
    
    @staticmethod
    def log_api_usage(db, api_key_record: ApiKey, endpoint: str, method: str, 
                     query_params: dict, status_code: int, results_count: int = 0,
                     response_time_ms: int = None, ip_address: str = None, user_agent: str = None):
        """Log API usage"""
        import json
        
        # Update API key usage counters
        api_key_record.requests_made += 1
        api_key_record.monthly_requests += 1
        api_key_record.requests_used_today += 1  # Your existing field
        api_key_record.last_used = datetime.utcnow()
        api_key_record.last_request_ip = ip_address
        
        # Create usage log
        usage_log = ApiUsage(
            api_key_id=api_key_record.id,
            endpoint=endpoint,
            method=method,
            query_params=json.dumps(query_params) if query_params else None,
            response_time_ms=response_time_ms,
            status_code=status_code,
            results_count=results_count,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(usage_log)
        db.commit()
    
    @staticmethod
    def get_api_usage_stats(db, user_id: str, days: int = 30):
        """Get API usage statistics"""
        from datetime import timedelta
        from sqlalchemy import func
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Get user's API keys
        api_keys = db.query(ApiKey).filter(ApiKey.user_id == user_id).all()
        key_ids = [key.id for key in api_keys]
        
        if not key_ids:
            return {"total_requests": 0, "api_keys": []}
        
        # Total usage
        total_requests = db.query(func.count(ApiUsage.id)).filter(
            ApiUsage.api_key_id.in_(key_ids),
            ApiUsage.timestamp >= cutoff_date
        ).scalar() or 0
        
        # Per-key stats
        key_stats = []
        for key in api_keys:
            key_requests = db.query(func.count(ApiUsage.id)).filter(
                ApiUsage.api_key_id == key.id,
                ApiUsage.timestamp >= cutoff_date
            ).scalar() or 0
            
            key_stats.append({
                "key_name": key.key_name,
                "api_key": key.api_key[:8] + "..." + key.api_key[-4:],
                "requests": key_requests,
                "monthly_requests": key.monthly_requests,
                "monthly_limit": key.monthly_limit,
                "daily_requests": key.requests_used_today,  # Your existing field
                "daily_limit": key.requests_per_day,  # Your existing field
                "is_active": key.is_active,
                "last_used": key.last_used.isoformat() if key.last_used else None
            })
        
        return {
            "total_requests": total_requests,
            "api_keys": key_stats,
            "period_days": days
        }