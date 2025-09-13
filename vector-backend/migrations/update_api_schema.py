# vector-backend/migrations/fix_api_schema_with_data.py
"""
Fixed migration that properly handles existing data in api_keys table
"""

import os
import sys
from pathlib import Path
import secrets
import string

# Add the parent directory to the path
sys.path.append(str(Path(__file__).parent.parent))

from database import engine
from sqlalchemy import text

def generate_api_credentials():
    """Generate API key and secret pair"""
    api_key = 'pk_' + ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    api_secret = 'sk_' + ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(48))
    return api_key, api_secret

def fix_api_keys_table():
    """Fix api_keys table by handling existing data properly"""
    
    with engine.connect() as connection:
        print("1. Checking and fixing api_keys table...")
        
        # First, check what columns already exist
        columns_result = connection.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'api_keys' AND table_schema = 'public'
        """)).fetchall()
        
        existing_columns = [row[0] for row in columns_result]
        print(f"   Current columns: {', '.join(existing_columns)}")
        
        # Step 1: Add nullable columns first
        nullable_columns = {
            'user_id': 'VARCHAR REFERENCES users(id) ON DELETE SET NULL',
            'key_name': 'VARCHAR(100)',
            'api_key': 'VARCHAR(64)',
            'api_secret': 'VARCHAR(128)',
            'requests_made': 'INTEGER DEFAULT 0',
            'monthly_requests': 'INTEGER DEFAULT 0',
            'rate_limit_per_minute': 'INTEGER DEFAULT 100',
            'monthly_limit': 'INTEGER DEFAULT 50000',
            'expires_at': 'TIMESTAMP WITH TIME ZONE',
            'last_request_ip': 'VARCHAR(45)'
        }
        
        for column, definition in nullable_columns.items():
            if column not in existing_columns:
                try:
                    # Add as nullable first
                    alter_sql = f"ALTER TABLE api_keys ADD COLUMN {column} {definition};"
                    connection.execute(text(alter_sql))
                    connection.commit()
                    print(f"   ✅ Added column: {column}")
                except Exception as e:
                    print(f"   ❌ Error adding column {column}: {e}")
                    return False
        
        # Step 2: Update existing records with generated values
        print("\n2. Updating existing records with generated API credentials...")
        
        # Get existing records that need updating
        existing_records = connection.execute(text("""
            SELECT id, name, email FROM api_keys 
            WHERE api_key IS NULL OR api_secret IS NULL
        """)).fetchall()
        
        print(f"   Found {len(existing_records)} records to update")
        
        for record in existing_records:
            record_id, name, email = record
            api_key, api_secret = generate_api_credentials()
            
            try:
                update_sql = text("""
                    UPDATE api_keys 
                    SET 
                        api_key = :api_key,
                        api_secret = :api_secret,
                        key_name = COALESCE(:name, 'Legacy Key'),
                        requests_made = COALESCE(requests_made, 0),
                        monthly_requests = COALESCE(monthly_requests, 0),
                        rate_limit_per_minute = COALESCE(rate_limit_per_minute, 100),
                        monthly_limit = COALESCE(monthly_limit, 50000)
                    WHERE id = :record_id
                """)
                
                connection.execute(update_sql, {
                    'api_key': api_key,
                    'api_secret': api_secret,
                    'name': name or 'Legacy Key',
                    'record_id': record_id
                })
                connection.commit()
                print(f"   ✅ Updated record {record_id} with API key: {api_key[:12]}...")
                
            except Exception as e:
                print(f"   ❌ Error updating record {record_id}: {e}")
                return False
        
        # Step 3: Now make required columns NOT NULL
        print("\n3. Setting constraints on required columns...")
        
        try:
            # Add unique constraint on api_key
            connection.execute(text("""
                ALTER TABLE api_keys 
                ADD CONSTRAINT uk_api_keys_api_key UNIQUE (api_key)
            """))
            connection.commit()
            print("   ✅ Added unique constraint on api_key")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("   ⚠️ Unique constraint already exists")
            else:
                print(f"   ❌ Error adding unique constraint: {e}")
        
        # Step 4: Set NOT NULL constraints where needed
        required_not_null = ['api_key', 'api_secret', 'key_name']
        
        for column in required_not_null:
            try:
                connection.execute(text(f"""
                    ALTER TABLE api_keys 
                    ALTER COLUMN {column} SET NOT NULL
                """))
                connection.commit()
                print(f"   ✅ Set {column} as NOT NULL")
            except Exception as e:
                print(f"   ⚠️ Could not set {column} as NOT NULL: {e}")
        
        return True

def create_api_usage_table():
    """Create api_usage table if it doesn't exist"""
    
    with engine.connect() as connection:
        print("\n4. Creating/checking api_usage table...")
        
        # Check if table exists
        table_exists = connection.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'api_usage'
            );
        """)).scalar()
        
        if table_exists:
            print("   ✅ api_usage table already exists")
            return True
        
        try:
            create_sql = """
            CREATE TABLE api_usage (
                id SERIAL PRIMARY KEY,
                api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
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
            """
            
            connection.execute(text(create_sql))
            connection.commit()
            print("   ✅ Created api_usage table")
            return True
            
        except Exception as e:
            print(f"   ❌ Error creating api_usage table: {e}")
            return False

def create_indexes():
    """Create performance indexes"""
    
    with engine.connect() as connection:
        print("\n5. Creating indexes...")
        
        indexes = [
            ("idx_api_keys_user_id", "api_keys", "user_id"),
            ("idx_api_keys_api_key", "api_keys", "api_key"),
            ("idx_api_keys_active", "api_keys", "is_active"),
            ("idx_api_usage_key_id", "api_usage", "api_key_id"),
            ("idx_api_usage_timestamp", "api_usage", "timestamp"),
        ]
        
        for index_name, table_name, column_name in indexes:
            try:
                connection.execute(text(f"""
                    CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({column_name})
                """))
                connection.commit()
                print(f"   ✅ Created index {index_name}")
            except Exception as e:
                print(f"   ⚠️ Index {index_name}: {e}")

def verify_final_setup():
    """Verify everything is working"""
    
    with engine.connect() as connection:
        print("\n6. Final verification...")
        
        # Check api_keys structure
        api_keys_columns = connection.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'api_keys' AND table_schema = 'public'
            ORDER BY ordinal_position
        """)).fetchall()
        
        print("   api_keys table structure:")
        for col_name, data_type, nullable in api_keys_columns:
            print(f"     {col_name}: {data_type} ({'NULL' if nullable == 'YES' else 'NOT NULL'})")
        
        # Check data integrity
        try:
            result = connection.execute(text("""
                SELECT COUNT(*) as total_keys,
                       COUNT(api_key) as keys_with_api_key,
                       COUNT(api_secret) as keys_with_secret
                FROM api_keys
            """)).fetchone()
            
            total, with_key, with_secret = result
            print(f"\n   Data integrity check:")
            print(f"     Total API keys: {total}")
            print(f"     With api_key: {with_key}")
            print(f"     With api_secret: {with_secret}")
            
            if total == with_key == with_secret:
                print("   ✅ All records have required fields")
                return True
            else:
                print("   ❌ Some records missing required fields")
                return False
                
        except Exception as e:
            print(f"   ❌ Data verification failed: {e}")
            return False

def main():
    """Run the complete fixed migration"""
    print("🚀 Starting Fixed API Schema Migration...")
    print("=" * 60)
    
    try:
        # Step 1: Fix api_keys table
        if not fix_api_keys_table():
            print("❌ Failed to fix api_keys table")
            return
        
        # Step 2: Create api_usage table
        if not create_api_usage_table():
            print("❌ Failed to create api_usage table")
            return
        
        # Step 3: Create indexes
        create_indexes()
        
        # Step 4: Verify everything
        if verify_final_setup():
            print("\n🎉 API Schema Migration Completed Successfully!")
            print("\nYour API system is now ready with:")
            print("✅ Enhanced api_keys table with all required fields")
            print("✅ api_usage table for tracking requests")
            print("✅ Existing data preserved and updated")
            print("✅ Proper indexes for performance")
            
            print("\nNext steps:")
            print("1. Update your Python models to use the new schema")
            print("2. Test API key creation and validation")
            print("3. Implement the frontend API management dashboard")
        else:
            print("\n⚠️ Migration completed but with some data issues")
            print("Check the verification results above")
            
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        print("Please check your database connection and try again")

if __name__ == "__main__":
    main()