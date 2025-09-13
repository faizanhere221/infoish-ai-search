# vector-backend/dependencies.py
from fastapi import HTTPException, Header, Depends
from sqlalchemy.orm import Session
from database import get_db, ApiKey
from datetime import datetime, date
import hashlib
import logging

logger = logging.getLogger(__name__)

def hash_api_key(api_key: str) -> str:
    """Hash API key for secure storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()

async def validate_api_key(
    x_api_key: str = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db)
) -> ApiKey:
    """Validate API key and return the key object"""
    
    # Allow test mode without API key
    if not x_api_key or x_api_key == "test_key_123":
        # Create a mock API key object for testing
        mock_key = ApiKey(
            id=0,
            key_hash="test",
            name="Test User",
            email="test@example.com",
            plan_type="free",
            requests_per_day=100,
            requests_used_today=0,
            is_active=True
        )
        return mock_key
    
    # Check prefix
    if not x_api_key.startswith("aisk_"):
        raise HTTPException(status_code=401, detail="Invalid API key format")
    
    # Hash the key
    key_hash = hash_api_key(x_api_key)
    
    # Look up in database
    api_key = db.query(ApiKey).filter(
        ApiKey.key_hash == key_hash,
        ApiKey.is_active == True
    ).first()
    
    if not api_key:
        # Try to create a new API key for demo purposes
        api_key = ApiKey(
            key_hash=key_hash,
            name="Demo User",
            email="demo@example.com",
            plan_type="free",
            requests_per_day=50,
            requests_used_today=0,
            is_active=True
        )
        db.add(api_key)
        db.commit()
        db.refresh(api_key)
        logger.info(f"Created new demo API key")
    
    # Check if rate limited
    if api_key.is_rate_limited:
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit of {api_key.requests_per_day} requests exceeded"
        )
    
    # Update usage
    api_key.requests_used_today += 1
    api_key.last_used = datetime.utcnow()
    db.commit()
    
    return api_key

def get_current_user(api_key: ApiKey = Depends(validate_api_key)) -> dict:
    """Get current user from API key"""
    return {
        "name": api_key.name,
        "email": api_key.email,
        "plan": api_key.plan_type,
        "requests_remaining": api_key.requests_remaining
    }