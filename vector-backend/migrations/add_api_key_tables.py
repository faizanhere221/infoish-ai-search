# vector-backend/migrations/add_api_key_tables.py - FIXED VERSION
"""
Database Migration: Add API Key Management Tables
Run this script to add API key functionality to your database
"""

import os
import sys
from pathlib import Path

# Add the parent directory to the path so we can import from the project
sys.path.append(str(Path(__file__).parent.parent))

# Now import your existing database configuration
try:
    from database import engine, SessionLocal
    print("✅ Using existing database configuration")
except ImportError:
    print("❌ Could not import database configuration")
    print("Make sure you're running this from the vector-backend directory")
    sys.exit(1)

from sqlalchemy import text

def run_migration():
    """Run the API key tables migration using your existing database connection"""
    
    # SQL commands to create the tables
    migration_sql = """
    -- Create API Keys table
    CREATE TABLE IF NOT EXISTS api_keys (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key_name VARCHAR(100) NOT NULL,
        api_key VARCHAR(64) UNIQUE NOT NULL,
        api_secret VARCHAR(128) NOT NULL,
        
        -- Usage tracking
        requests_made INTEGER DEFAULT 0,
        monthly_requests INTEGER DEFAULT 0,
        last_used TIMESTAMP WITH TIME ZONE,
        
        -- Status and limits
        is_active BOOLEAN DEFAULT true,
        rate_limit_per_minute INTEGER DEFAULT 60,
        monthly_limit INTEGER DEFAULT 10000,
        
        -- Metadata
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        last_request_ip VARCHAR(45),
        
        UNIQUE(user_id, key_name)
    );

    -- Create API Usage table
    CREATE TABLE IF NOT EXISTS api_usage (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        api_key_id VARCHAR NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
        endpoint VARCHAR(100) NOT NULL,
        method VARCHAR(10) NOT NULL,
        
        -- Request details
        query_params TEXT,
        response_time_ms INTEGER,
        status_code INTEGER NOT NULL,
        results_count INTEGER DEFAULT 0,
        
        -- Tracking
        ip_address VARCHAR(45),
        user_agent TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
    CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
    CREATE INDEX IF NOT EXISTS idx_api_usage_key_id ON api_usage(api_key_id);
    CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);
    
    -- Add monthly reset function (optional)
    CREATE OR REPLACE FUNCTION reset_monthly_api_usage()
    RETURNS void AS $$
    BEGIN
        UPDATE api_keys SET monthly_requests = 0;
    END;
    $$ LANGUAGE plpgsql;
    """
    
    try:
        # Test the connection first
        with engine.connect() as connection:
            # Test query
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            
            # Check if users table exists
            users_check = connection.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'users'
                );
            """)).scalar()
            
            if not users_check:
                print("❌ Users table not found. Make sure your main database is set up first.")
                return False
            
            print("✅ Users table found")
            
            # Execute the migration in smaller chunks
            statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
            
            for i, statement in enumerate(statements):
                try:
                    if statement:
                        connection.execute(text(statement))
                        connection.commit()
                        print(f"✅ Executed statement {i+1}/{len(statements)}")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"⚠️ Statement {i+1} - Table/function already exists (skipping)")
                    else:
                        print(f"❌ Error in statement {i+1}: {e}")
                        return False
        
        print("\n🎉 API Key tables created successfully!")
        print("📊 Tables created:")
        print("   - api_keys (stores user API credentials)")
        print("   - api_usage (tracks API request analytics)")
        print("🔧 Indexes and functions added for performance")
        
        # Verify tables were created
        with engine.connect() as connection:
            api_keys_exists = connection.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'api_keys'
                );
            """)).scalar()
            
            api_usage_exists = connection.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'api_usage'
                );
            """)).scalar()
            
            if api_keys_exists and api_usage_exists:
                print("✅ Verification passed - Both tables exist")
                return True
            else:
                print("❌ Verification failed - Tables not found")
                return False
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print(f"Error type: {type(e).__name__}")
        return False

def check_current_setup():
    """Check what's currently in the database"""
    try:
        with engine.connect() as connection:
            # Check existing tables
            tables_result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            
            existing_tables = [row[0] for row in tables_result]
            print(f"📋 Existing tables: {', '.join(existing_tables)}")
            
            # Check if API tables already exist
            if 'api_keys' in existing_tables:
                print("⚠️ api_keys table already exists")
                
                # Count existing API keys
                count_result = connection.execute(text("SELECT COUNT(*) FROM api_keys"))
                api_key_count = count_result.scalar()
                print(f"🔑 Existing API keys: {api_key_count}")
                
            if 'api_usage' in existing_tables:
                print("⚠️ api_usage table already exists")
                
            return existing_tables
            
    except Exception as e:
        print(f"❌ Could not check current setup: {e}")
        return []

if __name__ == "__main__":
    print("🚀 Starting API Key Tables Migration...")
    print("=" * 50)
    
    # Check current setup
    print("1. Checking current database setup...")
    existing_tables = check_current_setup()
    
    if 'api_keys' in existing_tables and 'api_usage' in existing_tables:
        print("\n✅ API key tables already exist!")
        print("Migration not needed. Your API system is ready to use.")
    else:
        print("\n2. Running migration...")
        success = run_migration()
        
        if success:
            print("\n🚀 Your API key system is ready!")
            print("Next steps:")
            print("1. Update your main.py to include the new models")
            print("2. Add the API endpoints to your frontend")
            print("3. Test API key creation with a Pro user")
        else:
            print("\n🔧 Migration failed. Please check the errors above.")
            print("You may need to:")
            print("1. Check your database connection")
            print("2. Ensure you have proper permissions")
            print("3. Verify your users table exists")