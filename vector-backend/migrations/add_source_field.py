# vector-backend/migrations/add_source_field.py

"""
Migration to add 'source' field to influencers table
This tracks whether influencer was scraped or self-registered
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

def run_migration():
    """Add source field to influencers table"""
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in environment variables")
        return False
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Check if column already exists
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'influencers' 
                AND column_name = 'source'
            """)
            
            result = conn.execute(check_query).fetchone()
            
            if result:
                print("✅ 'source' column already exists in influencers table")
                return True
            
            # Add source column
            print("Adding 'source' column to influencers table...")
            
            add_column_query = text("""
                ALTER TABLE influencers 
                ADD COLUMN source VARCHAR(50) DEFAULT 'web_scrape'
            """)
            
            conn.execute(add_column_query)
            conn.commit()
            
            # Update existing records to mark them as web_scrape
            update_query = text("""
                UPDATE influencers 
                SET source = 'web_scrape' 
                WHERE source IS NULL
            """)
            
            conn.execute(update_query)
            conn.commit()
            
            print("✅ Successfully added 'source' column to influencers table")
            print("✅ All existing influencers marked as 'web_scrape'")
            
            # Verify the change
            verify_query = text("""
                SELECT source, COUNT(*) as count 
                FROM influencers 
                GROUP BY source
            """)
            
            results = conn.execute(verify_query).fetchall()
            
            print("\n📊 Source distribution:")
            for row in results:
                print(f"   - {row[0]}: {row[1]} influencers")
            
            return True
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Running migration: Add source field to influencers table")
    print("=" * 60)
    
    success = run_migration()
    
    if success:
        print("\n✅ Migration completed successfully!")
    else:
        print("\n❌ Migration failed!")
    
    print("=" * 60)