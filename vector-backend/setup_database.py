#!/usr/bin/env python3
# setup_database.py - Put this in your vector-backend folder
import sys
import os
from pathlib import Path

# Add current directory to Python path FIRST
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# NOW import the models after path is set
def setup_database():
    """Setup database and create tables"""
    try:
        print("🔄 Setting up database...")
        
        # Import after adding to path
        from database import init_database, User, UserFavorite, UserSearch
        
        # Initialize database
        success = init_database()
        
        if success:
            print("✅ Database setup completed successfully!")
            
            # Test the models by trying to count existing records
            from database import SessionLocal
            db = SessionLocal()
            try:
                user_count = db.query(User).count()
                print(f"👥 Users in database: {user_count}")
                
                influencer_count = db.execute("SELECT COUNT(*) FROM influencers").scalar()
                print(f"🎭 Influencers in database: {influencer_count}")
                
            except Exception as e:
                print(f"⚠️ Could not count records: {e}")
            finally:
                db.close()
            
            return True
        else:
            print("❌ Database setup failed!")
            return False
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you have all required packages installed:")
        print("pip install sqlalchemy psycopg2-binary python-dotenv")
        return False
    except Exception as e:
        print(f"❌ Setup error: {e}")
        return False

def create_test_user():
    """Create a test user for development"""
    try:
        print("🔄 Creating test user...")
        
        from database import SessionLocal, User
        
        db = SessionLocal()
        
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "developer@test.com").first()
        
        if not existing_user:
            test_user = User(
                email="developer@test.com",
                full_name="Test Developer",
                google_id="test_user_123",
                subscription_tier="premium",  # Give premium for testing
                search_limit=999999,  # Unlimited for testing
                is_verified=True
            )
            db.add(test_user)
            db.commit()
            print("✅ Test user created: developer@test.com")
        else:
            print("✅ Test user already exists: developer@test.com")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Test user creation failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 AI Influencer Search Tool - Database Setup")
    print("=" * 50)
    
    # Setup database
    if setup_database():
        # Create test user
        create_test_user()
        print("\n🎉 Setup completed! You can now test your authentication.")
        print("\n📋 Next steps:")
        print("1. Run: python main.py")
        print("2. Visit: http://localhost:3000")
        print("3. Click 'Test Free User' to test without Google OAuth")
    else:
        print("\n💥 Setup failed. Check your database configuration.")
        sys.exit(1)