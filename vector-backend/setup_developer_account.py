# vector-backend/setup_developer_account.py
# Run this script ONCE to set up your developer account

import os
from dotenv import load_dotenv
from database import SessionLocal, User, AuthUser
from datetime import datetime

# Load environment variables
load_dotenv()

def setup_developer_account():
    """Set up developer account directly in database"""
    db = SessionLocal()
    
    try:
        # Replace with your actual email
        DEVELOPER_EMAIL = "islam9039438@gmail.com"  # UPDATE THIS!
        
        print(f"Setting up developer account for: {DEVELOPER_EMAIL}")
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == DEVELOPER_EMAIL).first()
        
        if existing_user:
            print(f"User {DEVELOPER_EMAIL} already exists. Updating to developer tier...")
            
            # Update auth_users record
            auth_user = db.query(AuthUser).filter(AuthUser.id == existing_user.id).first()
            if auth_user:
                auth_user.subscription_tier = "developer"
                auth_user.search_limit = 999999
                auth_user.monthly_searches = 0  # Reset searches
                print(f"Updated existing user to developer tier")
            else:
                # Create auth record
                from auth import generate_cuid
                auth_user = AuthUser(
                    id=existing_user.id,
                    full_name="Developer Account",
                    subscription_tier="developer",
                    search_count=0,
                    monthly_searches=0,
                    search_limit=999999,
                    is_active=True,
                    is_verified=True,
                    created_at=datetime.utcnow()
                )
                db.add(auth_user)
                print(f"Created auth record for existing user")
        else:
            # Create new developer user
            from auth import generate_cuid
            user_id = generate_cuid()
            
            # Create basic user
            new_user = User(
                id=user_id,
                email=DEVELOPER_EMAIL
            )
            db.add(new_user)
            db.flush()
            
            # Create auth user
            auth_user = AuthUser(
                id=new_user.id,
                full_name="Developer Account",
                subscription_tier="developer", 
                search_count=0,
                monthly_searches=0,
                search_limit=999999,
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow()
            )
            db.add(auth_user)
            print(f"Created new developer user")
        
        db.commit()
        print(f"✅ Developer account setup complete!")
        print(f"Email: {DEVELOPER_EMAIL}")
        print(f"Tier: developer")
        print(f"Search Limit: unlimited")
        print(f"")
        print(f"Now you can log in with Google using this email and get unlimited access.")
        
    except Exception as e:
        print(f"❌ Error setting up developer account: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_developer_account()