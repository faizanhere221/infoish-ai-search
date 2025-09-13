# vector-backend/api_key_service.py
import secrets
import hashlib
from datetime import datetime, date
from sqlalchemy.orm import Session
from models.api_keys import APIKey

class APIKeyService:
    def __init__(self, db: Session):
        self.db = db

    def generate_api_key(self) -> str:
        """Generate a new API key with proper prefix"""
        # Generate a secure random key
        random_part = secrets.token_urlsafe(32)
        return f"aisk_{random_part}"

    def hash_api_key(self, api_key: str) -> str:
        """Hash API key for secure storage"""
        return hashlib.sha256(api_key.encode()).hexdigest()

    def create_api_key(self, name: str, plan_type: str = "free") -> str:
        """Create a new API key"""
        # Generate the raw API key
        raw_key = self.generate_api_key()
        
        # Hash it for storage
        key_hash = self.hash_api_key(raw_key)
        
        # Set plan limits
        plan_limits = {
            "free": 50,
            "basic": 1000,
            "pro": 10000,
            "enterprise": 100000
        }
        
        # Create database record
        db_api_key = APIKey(
            key_hash=key_hash,
            name=name,
            plan_type=plan_type,
            requests_per_day=plan_limits.get(plan_type, 50),
            requests_used_today=0,
            last_used=None,
            created_at=datetime.utcnow()
        )
        
        self.db.add(db_api_key)
        self.db.commit()
        self.db.refresh(db_api_key)
        
        # Return the raw key (this is the only time it's shown)
        return raw_key

    def validate_key(self, api_key: str) -> tuple[bool, APIKey | None]:
        """Validate an API key and return the key object if valid"""
        try:
            # Hash the provided key
            key_hash = self.hash_api_key(api_key)
            
            # Look up in database
            db_api_key = self.db.query(APIKey).filter(
                APIKey.key_hash == key_hash,
                APIKey.is_active == True
            ).first()
            
            if not db_api_key:
                return False, None
            
            # Check if we need to reset daily usage
            self._reset_daily_usage_if_needed(db_api_key)
            
            return True, db_api_key
            
        except Exception as e:
            print(f"Error validating API key: {e}")
            return False, None

    def increment_usage(self, api_key: APIKey):
        """Increment the usage counter for an API key"""
        try:
            api_key.requests_used_today += 1
            api_key.last_used = datetime.utcnow()
            self.db.commit()
        except Exception as e:
            print(f"Error incrementing usage: {e}")
            self.db.rollback()

    def _reset_daily_usage_if_needed(self, api_key: APIKey):
        """Reset daily usage if it's a new day"""
        today = date.today()
        
        # If last_used is None or it's a new day, reset the counter
        if (api_key.last_used is None or 
            api_key.last_used.date() < today):
            api_key.requests_used_today = 0
            self.db.commit()

    def get_usage_stats(self, api_key: APIKey) -> dict:
        """Get usage statistics for an API key"""
        return {
            "name": api_key.name,
            "plan_type": api_key.plan_type,
            "requests_used_today": api_key.requests_used_today,
            "requests_per_day": api_key.requests_per_day,
            "requests_remaining": api_key.requests_per_day - api_key.requests_used_today,
            "last_used": api_key.last_used,
            "created_at": api_key.created_at
        }

    def deactivate_key(self, api_key: str) -> bool:
        """Deactivate an API key"""
        try:
            key_hash = self.hash_api_key(api_key)
            db_api_key = self.db.query(APIKey).filter(
                APIKey.key_hash == key_hash
            ).first()
            
            if db_api_key:
                db_api_key.is_active = False
                self.db.commit()
                return True
            return False
        except Exception as e:
            print(f"Error deactivating API key: {e}")
            return False

    def list_keys(self, limit: int = 100) -> list[dict]:
        """List all API keys (for admin purposes)"""
        keys = self.db.query(APIKey).limit(limit).all()
        return [
            {
                "id": key.id,
                "name": key.name,
                "plan_type": key.plan_type,
                "is_active": key.is_active,
                "requests_used_today": key.requests_used_today,
                "requests_per_day": key.requests_per_day,
                "last_used": key.last_used,
                "created_at": key.created_at
            }
            for key in keys
        ]