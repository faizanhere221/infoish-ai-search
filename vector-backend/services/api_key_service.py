from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, text
import secrets
import string
import json
import hashlib

class APIKeyService:
    @staticmethod
    def generate_api_credentials():
        """Generate API key and secret pair"""
        api_key = 'pk_' + ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        api_secret = 'sk_' + ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(48))
        return api_key, api_secret
    
    @staticmethod
    def create_api_key(db: Session, user_id: str, key_name: str, subscription_tier: str = "pro"):
        """Create new API key for user"""
        
        # Check existing keys
        existing_count = db.execute(text("""
            SELECT COUNT(*) FROM api_keys 
            WHERE user_id = :user_id AND is_active = true
        """), {"user_id": user_id}).scalar()
        
        max_keys = {"free": 0, "starter": 0, "pro": 5}
        
        if existing_count >= max_keys.get(subscription_tier, 0):
            raise ValueError(f"Maximum API keys reached for {subscription_tier} tier")
        
        api_key, api_secret = APIKeyService.generate_api_credentials()
        
        # Generate key_hash (required by your schema)
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # Insert new API key with ALL required fields
        db.execute(text("""
            INSERT INTO api_keys (
                user_id, key_name, name, api_key, api_secret, key_hash,
                plan_type, requests_per_day, monthly_limit, 
                rate_limit_per_minute, is_active, created_at,
                requests_made, monthly_requests, requests_used_today
            ) VALUES (
                :user_id, :key_name, :name, :api_key, :api_secret, :key_hash,
                :plan_type, :requests_per_day, :monthly_limit,
                :rate_limit_per_minute, :is_active, :created_at,
                :requests_made, :monthly_requests, :requests_used_today
            )
        """), {
            "user_id": user_id,
            "key_name": key_name,
            "name": key_name,  # Your existing field
            "api_key": api_key,
            "api_secret": api_secret,
            "key_hash": key_hash,  # Required field from your schema
            "plan_type": subscription_tier,
            "requests_per_day": 2000,
            "monthly_limit": 50000,
            "rate_limit_per_minute": 100,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "requests_made": 0,
            "monthly_requests": 0,
            "requests_used_today": 0
        })
        db.commit()
        
        # Return the created key data
        result = db.execute(text("""
            SELECT id, key_name, api_key, api_secret, monthly_limit, created_at
            FROM api_keys WHERE api_key = :api_key
        """), {"api_key": api_key}).fetchone()
        
        return {
            "id": result[0],
            "key_name": result[1],
            "api_key": result[2],
            "api_secret": result[3],
            "monthly_limit": result[4],
            "created_at": result[5]
        }
    
    @staticmethod
    def validate_api_key(db: Session, api_key: str, api_secret: str = None):
        """Validate API key and secret"""
        
        result = db.execute(text("""
            SELECT id, user_id, api_secret, is_active, monthly_requests, monthly_limit
            FROM api_keys WHERE api_key = :api_key
        """), {"api_key": api_key}).fetchone()
        
        if not result:
            return None, "Invalid API key"
        
        key_id, user_id, stored_secret, is_active, monthly_requests, monthly_limit = result
        
        if not is_active:
            return None, "API key deactivated"
        
        if api_secret and stored_secret != api_secret:
            return None, "Invalid API secret"
        
        if monthly_requests and monthly_limit and monthly_requests >= monthly_limit:
            return None, "Monthly limit exceeded"
        
        return {
            "id": key_id,
            "user_id": user_id,
            "monthly_requests": monthly_requests or 0,
            "monthly_limit": monthly_limit or 50000
        }, None
    
    @staticmethod
    def check_rate_limit(db: Session, api_key_record):
        """Check if API key is within rate limits"""
        one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
        
        count = db.execute(text("""
            SELECT COUNT(*) FROM api_usage 
            WHERE api_key_id = :key_id AND timestamp >= :one_minute_ago
        """), {
            "key_id": api_key_record["id"],
            "one_minute_ago": one_minute_ago
        }).scalar()
        
        return count < 100  # Rate limit of 100 per minute
    
    @staticmethod
    def log_api_usage(db: Session, api_key_record, endpoint: str, method: str, 
                     query_params: dict, status_code: int, results_count: int = 0,
                     response_time_ms: int = None, ip_address: str = None, user_agent: str = None):
        """Log API usage"""
        
        # Update API key usage counters
        db.execute(text("""
            UPDATE api_keys 
            SET 
                requests_made = COALESCE(requests_made, 0) + 1,
                monthly_requests = COALESCE(monthly_requests, 0) + 1,
                requests_used_today = COALESCE(requests_used_today, 0) + 1,
                last_used = :now,
                last_request_ip = :ip
            WHERE id = :key_id
        """), {
            "now": datetime.utcnow(),
            "ip": ip_address,
            "key_id": api_key_record["id"]
        })
        
        # Create usage log
        db.execute(text("""
            INSERT INTO api_usage (
                api_key_id, endpoint, method, query_params, response_time_ms,
                status_code, results_count, ip_address, user_agent, timestamp
            ) VALUES (
                :api_key_id, :endpoint, :method, :query_params, :response_time_ms,
                :status_code, :results_count, :ip_address, :user_agent, :timestamp
            )
        """), {
            "api_key_id": api_key_record["id"],
            "endpoint": endpoint,
            "method": method,
            "query_params": json.dumps(query_params) if query_params else None,
            "response_time_ms": response_time_ms,
            "status_code": status_code,
            "results_count": results_count,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": datetime.utcnow()
        })
        
        db.commit()