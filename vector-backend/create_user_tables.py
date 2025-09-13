# vector-backend/fix_user_tables.py - Fix Authentication Tables
import sys
from pathlib import Path
from sqlalchemy import text

# Add current directory to path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from database import SessionLocal

def fix_auth_tables():
    """Fix and recreate authentication tables properly"""
    try:
        db = SessionLocal()
        
        # Drop existing incomplete tables if they exist
        print("🧹 Cleaning up existing tables...")
        cleanup_sql = [
            "DROP TABLE IF EXISTS user_favorites CASCADE;",
            "DROP TABLE IF EXISTS user_searches CASCADE;", 
            "DROP TABLE IF EXISTS users CASCADE;"
        ]
        
        for sql in cleanup_sql:
            try:
                db.execute(text(sql))
            except:
                pass  # Ignore errors if tables don't exist
        
        db.commit()
        
        # Create users table with all columns
        print("👤 Creating users table...")
        users_table = """
        CREATE TABLE users (
            id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            email VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(255),
            profile_picture VARCHAR(500),
            google_id VARCHAR(100) UNIQUE,
            is_google_user BOOLEAN DEFAULT FALSE,
            hashed_password VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            subscription_tier VARCHAR(20) DEFAULT 'free',
            search_count INTEGER DEFAULT 0,
            monthly_searches INTEGER DEFAULT 0,
            search_limit INTEGER DEFAULT 50
        );
        """
        
        # Create user searches table
        print("🔍 Creating user searches table...")
        searches_table = """
        CREATE TABLE user_searches (
            id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            user_id VARCHAR(50) NOT NULL,
            query VARCHAR(500) NOT NULL,
            filters TEXT,
            results_count INTEGER DEFAULT 0,
            search_time_ms INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """
        
        # Create user favorites table
        print("⭐ Creating user favorites table...")
        favorites_table = """
        CREATE TABLE user_favorites (
            id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            user_id VARCHAR(50) NOT NULL,
            influencer_id VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, influencer_id)
        );
        """
        
        # Execute table creation
        db.execute(text(users_table))
        print("✅ Users table created")
        
        db.execute(text(searches_table))
        print("✅ User searches table created")
        
        db.execute(text(favorites_table))
        print("✅ User favorites table created")
        
        # Create indexes for performance
        print("📊 Creating indexes...")
        indexes = [
            "CREATE INDEX idx_users_email ON users(email);",
            "CREATE INDEX idx_users_google_id ON users(google_id);", 
            "CREATE INDEX idx_searches_user_id ON user_searches(user_id);",
            "CREATE INDEX idx_searches_created_at ON user_searches(created_at);",
            "CREATE INDEX idx_favorites_user_id ON user_favorites(user_id);",
            "CREATE INDEX idx_favorites_influencer_id ON user_favorites(influencer_id);"
        ]
        
        for index_sql in indexes:
            db.execute(text(index_sql))
        
        print("✅ Indexes created")
        
        db.commit()
        db.close()
        
        print("\n🎉 Authentication system database setup complete!")
        print("📊 Tables created:")
        print("   - users (for Google OAuth login)")
        print("   - user_searches (for search tracking)")
        print("   - user_favorites (for favorites system)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Setting up authentication database tables...")
    success = fix_auth_tables()
    if success:
        print("\n✅ Database ready! Now fix the auth.py import issue...")
    else:
        print("\n❌ Setup failed.")