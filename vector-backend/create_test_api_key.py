import hashlib
import secrets
from database import SessionLocal, ApiKey
from datetime import datetime

def create_proper_api_key():
    # Generate API key with correct prefix
    random_part = secrets.token_urlsafe(24)
    raw_key = f"aisk_{random_part}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    
    db = SessionLocal()
    try:
        api_key = ApiKey(
            key_hash=key_hash,
            name="Proper API Key",
            email="api@example.com",
            plan_type="free",
            requests_per_day=1000,
            requests_used_today=0,
            is_active=True,
            created_at=datetime.now()
        )
        
        db.add(api_key)
        db.commit()
        
        print(f"✅ Proper API Key created!")
        print(f"🔑 API Key: {raw_key}")
        print(f"🧪 Test command:")
        print(f"curl -H 'X-API-Key: {raw_key}' 'http://127.0.0.1:8000/search/influencers?query=tech&limit=5'")
        
        return raw_key
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_proper_api_key()