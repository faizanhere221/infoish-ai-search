"""
Fixed Database Migration Script
Handles dependent views properly and safely updates the influencers table
"""

import psycopg2
import os
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

def run_fixed_migration():
    """Run the database migration with proper handling of dependent objects"""
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    if not DATABASE_URL:
        logger.error("❌ DATABASE_URL not found in environment variables")
        return False
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        logger.info("✅ Connected to database")
        
        # Start transaction
        conn.autocommit = False
        
        logger.info("🚀 Starting fixed migration...")
        
        # Step 1: Check for dependent views
        cursor.execute("""
            SELECT DISTINCT dependent_view.relname as view_name
            FROM pg_depend 
            JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
            JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
            JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid 
            JOIN pg_attribute ON pg_depend.refobjid = pg_attribute.attrelid 
                AND pg_depend.refobjsubid = pg_attribute.attnum 
            WHERE source_table.relname = 'influencers'
                AND pg_attribute.attname IN ('gender', 'location_city')
        """)
        
        dependent_views = cursor.fetchall()
        
        if dependent_views:
            logger.info(f"🔍 Found dependent views: {[view[0] for view in dependent_views]}")
            
            # Drop dependent views first
            for view in dependent_views:
                view_name = view[0]
                try:
                    cursor.execute(f"DROP VIEW IF EXISTS {view_name} CASCADE")
                    logger.info(f"🗑️ Dropped dependent view: {view_name}")
                except Exception as e:
                    logger.warning(f"⚠️  Could not drop view {view_name}: {e}")
        
        # Step 2: Check current table structure
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'influencers'
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        logger.info(f"📋 Current columns: {existing_columns}")
        
        # Step 3: Add new columns if they don't exist
        new_columns = [
            ("video_count", "INTEGER DEFAULT 0"),
            ("total_views", "BIGINT DEFAULT 0"),
            ("youtube_url", "TEXT"),
            ("last_updated", "TIMESTAMP")
        ]
        
        for col_name, col_definition in new_columns:
            if col_name not in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE influencers ADD COLUMN {col_name} {col_definition}")
                    logger.info(f"✅ Added column: {col_name}")
                except Exception as e:
                    logger.warning(f"⚠️  Column {col_name} might already exist: {e}")
        
        # Step 4: Now remove old columns (after dropping dependent views)
        old_columns = ["gender", "location_city"]
        
        for col_name in old_columns:
            if col_name in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE influencers DROP COLUMN IF EXISTS {col_name} CASCADE")
                    logger.info(f"🗑️ Removed column: {col_name}")
                except Exception as e:
                    logger.warning(f"⚠️  Could not remove column {col_name}: {e}")
        
        # Step 5: Update existing records with default values for new fields
        cursor.execute("""
            UPDATE influencers 
            SET video_count = COALESCE(video_count, 0),
                total_views = COALESCE(total_views, 0),
                updated_at = CURRENT_TIMESTAMP
            WHERE video_count IS NULL OR total_views IS NULL
        """)
        
        updated_rows = cursor.rowcount
        logger.info(f"📊 Updated {updated_rows} existing records with default values")
        
        # Step 6: Check final count
        cursor.execute("SELECT COUNT(*) FROM influencers")
        total_count = cursor.fetchone()[0]
        logger.info(f"📈 Total influencers in database: {total_count}")
        
        # Step 7: Verify new structure
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'influencers'
            ORDER BY ordinal_position
        """)
        
        final_columns = cursor.fetchall()
        logger.info("📋 Final table structure:")
        for col_name, col_type in final_columns:
            logger.info(f"  - {col_name}: {col_type}")
        
        # Step 8: Create a simple view for compatibility (optional)
        try:
            cursor.execute("""
                CREATE OR REPLACE VIEW influencer_summary AS 
                SELECT 
                    id,
                    username,
                    full_name,
                    category,
                    total_followers,
                    engagement_rate,
                    verified,
                    instagram_followers,
                    youtube_subscribers,
                    tiktok_followers,
                    video_count,
                    total_views,
                    created_at
                FROM influencers
                WHERE total_followers > 0
                ORDER BY total_followers DESC
            """)
            logger.info("✅ Created new influencer_summary view")
        except Exception as e:
            logger.warning(f"⚠️  Could not create summary view: {e}")
        
        # Commit the transaction
        conn.commit()
        logger.info("🎉 Migration completed successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

def check_migration_status():
    """Check if migration is needed and current status"""
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Check current columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'influencers'
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        # Check what needs to be done
        new_fields = ['video_count', 'total_views', 'youtube_url', 'last_updated']
        old_fields = ['gender', 'location_city']
        
        needs_new_fields = [field for field in new_fields if field not in existing_columns]
        has_old_fields = [field for field in old_fields if field in existing_columns]
        
        logger.info("📊 Migration Status:")
        logger.info(f"  - New fields needed: {needs_new_fields}")
        logger.info(f"  - Old fields to remove: {has_old_fields}")
        
        # Check for dependent views
        cursor.execute("""
            SELECT DISTINCT dependent_view.relname as view_name
            FROM pg_depend 
            JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
            JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
            JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid 
            JOIN pg_attribute ON pg_depend.refobjid = pg_attribute.attrelid 
                AND pg_depend.refobjsubid = pg_attribute.attnum 
            WHERE source_table.relname = 'influencers'
                AND pg_attribute.attname IN ('gender', 'location_city')
        """)
        
        dependent_views = [view[0] for view in cursor.fetchall()]
        if dependent_views:
            logger.info(f"  - Dependent views to handle: {dependent_views}")
        
        cursor.execute("SELECT COUNT(*) FROM influencers")
        count = cursor.fetchone()[0]
        logger.info(f"  - Current influencer count: {count}")
        
        cursor.close()
        conn.close()
        
        return len(needs_new_fields) > 0 or len(has_old_fields) > 0
        
    except Exception as e:
        logger.error(f"❌ Status check failed: {e}")
        return None

if __name__ == "__main__":
    print("🔄 Fixed Database Migration Tool")
    print("=" * 50)
    
    # Check status first
    logger.info("🔍 Checking migration status...")
    needs_migration = check_migration_status()
    
    if needs_migration is None:
        logger.error("❌ Could not check migration status")
        exit(1)
    
    if not needs_migration:
        logger.info("✅ Database is already up to date!")
        exit(0)
    
    # Confirm migration
    confirm = input("\nProceed with fixed migration? (y/n): ").lower().strip()
    
    if confirm == 'y':
        success = run_fixed_migration()
        if success:
            logger.info("✅ Fixed migration completed successfully!")
            logger.info("🚀 You can now update your code and import new data!")
        else:
            logger.error("❌ Migration failed. Check the logs above.")
    else:
        logger.info("Migration cancelled by user.")