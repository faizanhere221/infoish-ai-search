"""
Import 1500+ Pakistani Influencers - Transaction Safe Version
Each row is processed in its own transaction to prevent one error from stopping everything
"""

import pandas as pd
import psycopg2
from datetime import datetime
import os
from dotenv import load_dotenv
import re
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

def clean_number(value) -> int:
    """Convert string numbers to integers, handle empty values"""
    if pd.isna(value) or value == "" or value is None:
        return 0
    
    try:
        if isinstance(value, str):
            cleaned = re.sub(r'[^\d.]', '', str(value))
            return int(float(cleaned)) if cleaned else 0
        return int(float(value))
    except (ValueError, TypeError):
        return 0

def clean_decimal(value, max_value=99.99):
    """Convert string to decimal, handle empty values, cap at reasonable max"""
    if pd.isna(value) or value == "" or value is None:
        return None
    
    try:
        if isinstance(value, str):
            cleaned = re.sub(r'[^\d.]', '', str(value))
            result = float(cleaned) if cleaned else None
        else:
            result = float(value)
        
        # Cap engagement rate to reasonable maximum (99.99%)
        if result is not None and result > max_value:
            logger.warning(f"⚠️  Engagement rate {result} capped to {max_value}")
            return max_value
        
        return result
    except (ValueError, TypeError):
        return None

def clean_string(value):
    """Clean string values, handle empty values"""
    if pd.isna(value) or value == "" or value is None:
        return None
    return str(value).strip()

def clean_boolean(value) -> bool:
    """Convert various boolean representations"""
    if pd.isna(value) or value == "" or value is None:
        return False
    
    if isinstance(value, bool):
        return value
    
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'verified']
    
    return bool(value)

def parse_datetime(value):
    """Parse datetime from various formats"""
    if pd.isna(value) or value == "" or value is None:
        return None
    
    try:
        return pd.to_datetime(value)
    except:
        return None

def import_single_influencer(conn, influencer_data, existing_usernames):
    """Import a single influencer in its own transaction"""
    
    upsert_query = """
    INSERT INTO influencers (
        username, full_name, email, 
        instagram_handle, youtube_channel, tiktok_handle,
        instagram_followers, youtube_subscribers, tiktok_followers,
        video_count, total_views, youtube_url,
        engagement_rate, category, bio, profile_image_url, verified,
        last_updated, created_at, updated_at
    ) VALUES (
        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
    )
    ON CONFLICT (username) 
    DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        instagram_handle = EXCLUDED.instagram_handle,
        youtube_channel = EXCLUDED.youtube_channel,
        tiktok_handle = EXCLUDED.tiktok_handle,
        instagram_followers = EXCLUDED.instagram_followers,
        youtube_subscribers = EXCLUDED.youtube_subscribers,
        tiktok_followers = EXCLUDED.tiktok_followers,
        video_count = EXCLUDED.video_count,
        total_views = EXCLUDED.total_views,
        youtube_url = EXCLUDED.youtube_url,
        engagement_rate = EXCLUDED.engagement_rate,
        category = EXCLUDED.category,
        bio = EXCLUDED.bio,
        profile_image_url = EXCLUDED.profile_image_url,
        verified = EXCLUDED.verified,
        last_updated = EXCLUDED.last_updated,
        updated_at = EXCLUDED.updated_at
    """
    
    try:
        cursor = conn.cursor()
        cursor.execute(upsert_query, influencer_data)
        conn.commit()
        cursor.close()
        
        # Check if this was an update or insert
        username = influencer_data[0]
        is_existing = username in existing_usernames
        return True, is_existing
        
    except Exception as e:
        conn.rollback()
        if 'cursor' in locals():
            cursor.close()
        return False, False

def import_influencers_from_csv(csv_file_path: str):
    """Import influencers from CSV file - Transaction safe version"""
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    if not DATABASE_URL:
        logger.error("❌ DATABASE_URL not found in environment variables")
        return False
    
    if not os.path.exists(csv_file_path):
        logger.error(f"❌ CSV file not found: {csv_file_path}")
        return False
    
    logger.info(f"🚀 Starting import from {csv_file_path}")
    
    try:
        # Read CSV file
        df = pd.read_csv(csv_file_path, encoding='utf-8')
        logger.info(f"📊 Loaded {len(df)} rows from CSV")
    except Exception as e:
        logger.error(f"❌ Error reading CSV: {e}")
        return False
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        logger.info("✅ Connected to database")
        
        # Check existing usernames
        cursor.execute("SELECT username FROM influencers")
        existing_usernames = {row[0] for row in cursor.fetchall()}
        logger.info(f"📊 Found {len(existing_usernames)} existing influencers")
        cursor.close()
        
    except Exception as e:
        logger.error(f"❌ Database connection error: {e}")
        return False
    
    # Process each row
    successful_imports = 0
    failed_imports = 0
    updated_existing = 0
    new_imports = 0
    
    for index, row in df.iterrows():
        username = clean_string(row.get('username'))
        if not username:
            logger.warning(f"⚠️  Skipping row {index + 1}: No username")
            failed_imports += 1
            continue
        
        try:
            # Handle YouTube handle (remove @ symbol if present)
            youtube_handle = clean_string(row.get('youtube_handle'))
            if youtube_handle and youtube_handle.startswith('@'):
                youtube_handle = youtube_handle[1:]
            
            # Parse last_updated
            last_updated = parse_datetime(row.get('last_updated'))
            
            # Prepare data tuple
            data = (
                username,                                    # username
                clean_string(row.get('full_name')),         # full_name
                clean_string(row.get('email')),             # email
                clean_string(row.get('instagram_handle')),  # instagram_handle
                youtube_handle,                             # youtube_channel
                clean_string(row.get('tiktok_handle')),     # tiktok_handle
                clean_number(row.get('instagram_followers')), # instagram_followers
                clean_number(row.get('youtube_subscribers')), # youtube_subscribers
                clean_number(row.get('tiktok_followers')),    # tiktok_followers
                clean_number(row.get('video_count')),         # video_count
                clean_number(row.get('total_views')),         # total_views
                clean_string(row.get('youtube_url')),         # youtube_url
                clean_decimal(row.get('engagement_rate')),    # engagement_rate (capped)
                clean_string(row.get('category')),            # category
                clean_string(row.get('bio')),                 # bio
                clean_string(row.get('profile_image')),       # profile_image_url
                clean_boolean(row.get('verified')),           # verified
                last_updated,                                 # last_updated
                datetime.now(),                               # created_at
                datetime.now()                                # updated_at
            )
            
            # Import this single influencer
            success, is_existing = import_single_influencer(conn, data, existing_usernames)
            
            if success:
                successful_imports += 1
                if is_existing:
                    updated_existing += 1
                else:
                    new_imports += 1
                    
                if successful_imports % 100 == 0:
                    logger.info(f"✅ Processed {successful_imports} influencers...")
            else:
                failed_imports += 1
                
        except Exception as e:
            logger.error(f"❌ Error processing row {index + 1} (username: {username}): {e}")
            failed_imports += 1
    
    # Final results
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM influencers")
        final_count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        logger.info(f"\n🎉 Import completed!")
        logger.info(f"✅ Total successful: {successful_imports}")
        logger.info(f"🆕 New influencers: {new_imports}")
        logger.info(f"🔄 Updated existing: {updated_existing}")
        logger.info(f"❌ Failed imports: {failed_imports}")
        logger.info(f"📊 Total processed: {successful_imports + failed_imports}")
        logger.info(f"📈 Total influencers in database: {final_count}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error getting final count: {e}")
        return False

def post_import_analysis():
    """Analyze imported data"""
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Count by category
        cursor.execute("""
            SELECT category, COUNT(*) 
            FROM influencers 
            WHERE category IS NOT NULL 
            GROUP BY category 
            ORDER BY COUNT(*) DESC
        """)
        categories = cursor.fetchall()
        
        # Top influencers
        cursor.execute("""
            SELECT username, full_name, total_followers, category
            FROM influencers 
            ORDER BY total_followers DESC 
            LIMIT 10
        """)
        top_influencers = cursor.fetchall()
        
        logger.info(f"\n📈 Top Categories:")
        for cat, count in categories[:10]:
            logger.info(f"  {cat}: {count}")
        
        logger.info(f"\n🏆 Top 10 Influencers:")
        for username, name, followers, cat in top_influencers:
            logger.info(f"  {username} ({name}) - {followers:,} followers - {cat}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")

if __name__ == "__main__":
    print("📥 Import 1500+ Pakistani Influencers - Transaction Safe")
    print("=" * 60)
    
    csv_file_path = "pakistani_influencers_1500.csv"
    
    if not os.path.exists(csv_file_path):
        logger.error(f"❌ CSV file not found: {csv_file_path}")
        exit(1)
    
    confirm = input(f"Proceed with importing from {csv_file_path}? (y/n): ").lower().strip()
    
    if confirm == 'y':
        logger.info("🚀 Starting transaction-safe import process...")
        success = import_influencers_from_csv(csv_file_path)
        
        if success:
            logger.info("✅ Import completed!")
            post_import_analysis()
        else:
            logger.error("❌ Import failed.")
    else:
        logger.info("Import cancelled.")