#!/usr/bin/env python3
# vector-backend/create_api_key.py
import sys
import os
from pathlib import Path

# Add the parent directory to Python path
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

from sqlalchemy.orm import sessionmaker
from database import engine, Base  # Import from your database.py
from models.api_keys import APIKey  # Absolute import
from api_key_service import APIKeyService  # Absolute import

# Use your existing engine
SessionLocal = sessionmaker(bind=engine)

def create_api_key_cli():
    if len(sys.argv) < 3:
        print("Usage: python create_api_key.py 'Customer Name' 'plan_type'")
        print("Plans: free, basic, pro, enterprise")
        return

    name = sys.argv[1]
    plan_type = sys.argv[2] if len(sys.argv) > 2 else "free"

    # Validate plan type
    valid_plans = ["free", "basic", "pro", "enterprise"]
    if plan_type not in valid_plans:
        print(f"❌ Invalid plan type. Choose from: {', '.join(valid_plans)}")
        return

    # Create tables if they don't exist
    Base.metadata.create_all(engine)

    db = SessionLocal()
    try:
        api_service = APIKeyService(db)
        new_key = api_service.create_api_key(name, plan_type)

        print("✅ API Key created successfully!")
        print(f"Name: {name}")
        print(f"Plan: {plan_type}")
        print(f"Key: {new_key}")
        print("⚠️ Save this key securely - it won't be shown again!")
        
        # Also show the rate limits for this plan
        plan_limits = {
            "free": 50,
            "basic": 1000,
            "pro": 10000,
            "enterprise": 100000
        }
        print(f"Daily Request Limit: {plan_limits.get(plan_type, 50)}")
        
    except Exception as e:
        print(f"❌ Error creating API key: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    create_api_key_cli()