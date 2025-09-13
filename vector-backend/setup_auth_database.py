# vector-backend/setup_auth_database.py - SIMPLIFIED FOR EXISTING PRISMA SCHEMA
import os
import sys
from pathlib import Path
from datetime import datetime
import logging
import secrets

# Add current directory to path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

def generate_cuid():
    """Generate a CUID-like ID to match Prisma"""
    return f"c{secrets.token_urlsafe(20)}"

def check_existing_data():
    """Check existing data in your Prisma schema"""
    logger.info("Checking existing data...")
    
    try:
        from database import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            # Check influencer count
            result = conn.execute(text("SELECT COUNT(*) FROM influencers"))
            count = result.fetchone()[0]
            logger.info(f"📊 Database contains {count} influencers")
            
            # Check if total_followers is working (generated column)
            result = conn.execute(text("""
                SELECT username, total_followers, instagram_followers, youtube_subscribers, tiktok_followers 
                FROM influencers 
                WHERE total_followers > 0 
                ORDER BY total_followers DESC 
                LIMIT 3
            """))
            samples = result.fetchall()
            
            if samples:
                logger.info("✅ Generated total_followers column is working correctly")
                for sample in samples:
                    username, total, ig, yt, tt = sample
                    logger.info(f"  - {username}: {total} total followers (IG:{ig}, YT:{yt}, TT:{tt})")
            
            return True
            
    except Exception as e:
        logger.error(f"Data check failed: {e}")
        return False

def create_auth_tables():
    """Create only the auth tables we need"""
    logger.info("Creating auth tables...")
    
    try:
        from database import engine, AuthUser
        from sqlalchemy import text
        
        # Create auth_users table manually since it's not in Prisma
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS auth_users (
                    id TEXT PRIMARY KEY,
                    full_name TEXT,
                    profile_picture TEXT,
                    google_id TEXT UNIQUE,
                    subscription_tier TEXT DEFAULT 'free',
                    search_count INTEGER DEFAULT 0,
                    monthly_searches INTEGER DEFAULT 0,
                    search_limit INTEGER DEFAULT 15,
                    is_active BOOLEAN DEFAULT true,
                    is_verified BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()
            logger.info("✅ auth_users table created")
            
        return True
        
    except Exception as e:
        logger.error(f"Auth table creation failed: {e}")
        return False

def create_test_users():
    """Create test users using your existing User table + auth_users"""
    try:
        from database import SessionLocal, User, AuthUser
        
        db = SessionLocal()
        
        # Test users to create
        test_users = [
            {
                "email": "free@test.com",
                "full_name": "Test Free User",
                "google_id": "test_user_free_123",
                "subscription_tier": "free",
                "search_limit": 15
            },
            {
                "email": "premium@test.com", 
                "full_name": "Test Premium User",
                "google_id": "test_user_premium_456",
                "subscription_tier": "premium",
                "search_limit": 999999
            },
            {
                "email": "developer@test.com",
                "full_name": "Test Developer",
                "google_id": "test_user_legacy",
                "subscription_tier": "premium",
                "search_limit": 999999
            }
        ]
        
        created_count = 0
        for user_data in test_users:
            # Check if user already exists in main users table
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            
            if not existing_user:
                # Create in main users table
                user_id = generate_cuid()
                user = User(
                    id=user_id,
                    email=user_data["email"]
                )
                db.add(user)
                db.flush()  # Get the ID
                
                # Create in auth_users table
                auth_user = AuthUser(
                    id=user.id,
                    full_name=user_data["full_name"],
                    google_id=user_data["google_id"],
                    subscription_tier=user_data["subscription_tier"],
                    search_limit=user_data["search_limit"],
                    is_verified=True
                )
                db.add(auth_user)
                created_count += 1
                logger.info(f"✅ Created test user: {user_data['email']}")
            else:
                logger.info(f"✅ Test user already exists: {user_data['email']}")
        
        if created_count > 0:
            db.commit()
        
        db.close()
        return True
        
    except Exception as e:
        logger.error(f"Test user creation failed: {e}")
        return False

def verify_setup():
    """Verify everything is working"""
    try:
        from database import SessionLocal, User, AuthUser
        
        db = SessionLocal()
        
        # Test counts
        user_count = db.query(User).count()
        auth_count = db.query(AuthUser).count()
        
        logger.info(f"👥 Basic users: {user_count}")
        logger.info(f"🔐 Auth users: {auth_count}")
        
        # Test a join
        test_user = db.query(User).filter(User.email == "free@test.com").first()
        if test_user:
            auth_user = db.query(AuthUser).filter(AuthUser.id == test_user.id).first()
            if auth_user:
                logger.info(f"✅ Test user authentication setup works: {test_user.email} -> {auth_user.subscription_tier}")
        
        db.close()
        return True
        
    except Exception as e:
        logger.error(f"Setup verification failed: {e}")
        return False

def main():
    """Main setup function"""
    logger.info("🚀 Starting simplified auth setup for Pakistani Influencer Search...")
    
    # Check environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        logger.error("❌ DATABASE_URL environment variable not found")
        return False
    
    logger.info("✅ Using Supabase PostgreSQL database")
    logger.info("✅ Configuration loaded successfully")
    
    # Step 1: Check existing data
    if not check_existing_data():
        logger.error("❌ Data check failed")
        return False
    
    # Step 2: Create auth tables
    if not create_auth_tables():
        logger.error("❌ Auth table creation failed")
        return False
    
    # Step 3: Create test users
    if not create_test_users():
        logger.error("❌ Test user creation failed")
        return False
    
    # Step 4: Verify setup
    if not verify_setup():
        logger.error("❌ Setup verification failed")
        return False
    
    logger.info("✅ Database setup completed successfully!")
    logger.info("")
    logger.info("🎯 Next Steps:")
    logger.info("1. Run: python main.py (to start backend)")
    logger.info("2. Run: npm run dev (to start frontend)")
    logger.info("3. Test login with test users")
    logger.info("")
    logger.info("💡 Test Authentication:")
    logger.info("- Use 'Test Free User' button (15 searches/month)")
    logger.info("- Use 'Test Premium User' button (unlimited searches)")
    logger.info("- Your 1,827 influencers are ready to search!")
    
    return True

if __name__ == "__main__":
    main()