# vector-backend/fixed_supabase_scraper.py
# Fixed version that works with Supabase generated columns

import openai
from openai import OpenAI
import json
import time
import logging
import hashlib
from typing import Dict, List, Optional
from dataclasses import dataclass
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, JSON, DECIMAL, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from datetime import datetime
import pandas as pd

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create Base
Base = declarative_base()

class Influencer(Base):
    __tablename__ = "influencers"
    
    id = Column(Text, primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    username = Column(String(100), nullable=False, unique=True)
    full_name = Column(Text)
    email = Column(Text)
    gender = Column(Text)
    location_city = Column(Text, default='Pakistan')
    instagram_handle = Column(Text)
    youtube_channel = Column(Text)
    tiktok_handle = Column(Text)
    instagram_followers = Column(Integer, default=0)
    youtube_subscribers = Column(Integer, default=0)
    tiktok_followers = Column(Integer, default=0)
    # total_followers is auto-generated in Supabase - don't include it
    engagement_rate = Column(DECIMAL(5,2), default=0.00)
    category = Column(Text)
    bio = Column(Text)
    profile_image_url = Column(Text)
    verified = Column(Boolean, default=False)
    embedding_vector = Column(JSON)
    content_hash = Column(String(64))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

@dataclass
class InfluencerData:
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    gender: str = 'not_specified'
    location_city: str = 'Pakistan'
    instagram_handle: Optional[str] = None
    youtube_channel: Optional[str] = None
    tiktok_handle: Optional[str] = None
    instagram_followers: int = 0
    youtube_subscribers: int = 0
    tiktok_followers: int = 0
    engagement_rate: float = 0.0
    category: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    verified: bool = False

class FixedPakistaniScraper:
    """Fixed scraper that works with Supabase generated columns"""
    
    def __init__(self):
        # Get credentials from environment
        openai_key = os.getenv('OPENAI_API_KEY')
        database_url = os.getenv('DATABASE_URL')
        
        if not openai_key:
            raise Exception("OPENAI_API_KEY not found in .env")
        if not database_url:
            raise Exception("DATABASE_URL not found in .env")
        
        self.openai_client = OpenAI(api_key=openai_key)
        
        # Connect to Supabase
        try:
            self.engine = create_engine(
                database_url,
                pool_pre_ping=True,
                pool_recycle=300,
                echo=False
            )
            
            # Test connection
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                
            logger.info("✅ Connected to Supabase PostgreSQL database")
            
            # Create session
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            self.db = SessionLocal()
            
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
        
        # Rate limiting
        self.openai_requests_used = 0
        self.openai_limit = 100
        
        # Pakistani influencer categories
        self.categories = [
            "Beauty & Fashion",
            "Food & Cooking", 
            "Tech & Reviews",
            "Comedy & Entertainment",
            "Lifestyle & Travel",
            "Music & Arts"
        ]

    def check_current_data(self):
        """Check existing data in Supabase"""
        try:
            count = self.db.query(Influencer).count()
            logger.info(f"Current Supabase database: {count} influencers")
            return count
        except Exception as e:
            logger.error(f"Error checking data: {e}")
            return 0

    def clear_database(self) -> int:
        """Clear all influencers from Supabase"""
        try:
            count = self.db.query(Influencer).count()
            if count > 0:
                confirm = input(f"Delete all {count} influencers from Supabase? (y/n): ")
                if confirm.lower() in ['y', 'yes']:
                    deleted = self.db.query(Influencer).delete()
                    self.db.commit()
                    logger.info(f"✅ Cleared {deleted} influencers from Supabase")
                    return deleted
                else:
                    logger.info("Deletion cancelled")
                    return 0
            else:
                logger.info("Database already empty")
                return 0
        except Exception as e:
            logger.error(f"Error clearing database: {e}")
            self.db.rollback()
            return 0

    def generate_influencers_for_category(self, category: str) -> List[InfluencerData]:
        """Generate Pakistani influencers for a specific category"""
        
        system_prompt = f"""You are an expert on Pakistani social media influencers. Generate a list of REAL, currently popular Pakistani influencers in the {category} category.

REQUIREMENTS:
1. Only REAL Pakistani influencers with actual social media presence
2. Minimum 30,000+ followers on at least one platform  
3. Currently active (2023-2024)
4. Include accurate follower estimates based on your knowledge
5. Diverse Pakistani cities (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar)

Return ONLY a JSON array:
[
    {{
        "username": "handle_without_@",
        "full_name": "Real Full Name",
        "gender": "male/female/not_specified",
        "location_city": "Pakistani_City",
        "instagram_handle": "instagram_username",
        "youtube_channel": "youtube_channel_name", 
        "tiktok_handle": "tiktok_username",
        "instagram_followers": realistic_count,
        "youtube_subscribers": realistic_count,
        "tiktok_followers": realistic_count,
        "engagement_rate": 2.5,
        "category": "{category}",
        "bio": "Brief content description",
        "verified": true_if_verified
    }}
]

Generate 12-18 top Pakistani {category} influencers."""

        user_prompt = f"Generate 12-18 REAL Pakistani {category} influencers with accurate social media data. Return only JSON array."

        try:
            self.openai_requests_used += 1
            logger.info(f"🤖 AI request {self.openai_requests_used}/{self.openai_limit} - {category}")
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=4000
            )
            
            content = response.choices[0].message.content.strip()
            
            # Parse JSON
            json_start = content.find('[')
            json_end = content.rfind(']') + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = content[json_start:json_end]
                try:
                    data_list = json.loads(json_str)
                    logger.info(f"📊 Parsed {len(data_list)} influencers from AI")
                    
                    influencers = []
                    for data in data_list:
                        try:
                            username = str(data.get('username', '')).strip().replace('@', '').lower()
                            if not username:
                                continue
                            
                            # Validate follower counts
                            instagram_followers = int(data.get('instagram_followers', 0))
                            youtube_subscribers = int(data.get('youtube_subscribers', 0))
                            tiktok_followers = int(data.get('tiktok_followers', 0))
                            total = instagram_followers + youtube_subscribers + tiktok_followers
                            
                            if total < 30000:  # Quality threshold
                                continue
                            
                            influencer = InfluencerData(
                                username=username,
                                full_name=str(data.get('full_name', '')).strip() or None,
                                gender=str(data.get('gender', 'not_specified')).lower(),
                                location_city=str(data.get('location_city', 'Pakistan')).strip(),
                                instagram_handle=str(data.get('instagram_handle', '')).strip().replace('@', '').lower() or None,
                                youtube_channel=str(data.get('youtube_channel', '')).strip() or None,
                                tiktok_handle=str(data.get('tiktok_handle', '')).strip().replace('@', '').lower() or None,
                                instagram_followers=instagram_followers,
                                youtube_subscribers=youtube_subscribers,
                                tiktok_followers=tiktok_followers,
                                engagement_rate=float(data.get('engagement_rate', 2.5)),
                                category=category,
                                bio=str(data.get('bio', '')).strip() or None,
                                verified=bool(data.get('verified', False))
                            )
                            
                            influencers.append(influencer)
                            
                        except Exception as e:
                            logger.warning(f"⚠️ Skipped invalid influencer: {e}")
                            continue
                    
                    logger.info(f"✅ Generated {len(influencers)} valid {category} influencers")
                    return influencers
                    
                except json.JSONDecodeError as e:
                    logger.error(f"❌ JSON parsing failed: {e}")
                    return []
            else:
                logger.error("❌ No JSON found in AI response")
                return []
                
        except Exception as e:
            logger.error(f"❌ AI generation failed: {e}")
            return []

    def save_to_supabase(self, influencer_data: InfluencerData) -> bool:
        """Save influencer to Supabase database - FIXED VERSION"""
        try:
            # Check duplicates
            existing = self.db.query(Influencer).filter_by(username=influencer_data.username).first()
            if existing:
                return False
            
            # Calculate total for logging (but don't save it)
            total_followers = (
                influencer_data.instagram_followers + 
                influencer_data.youtube_subscribers + 
                influencer_data.tiktok_followers
            )
            
            # Create hash
            content_str = f"{influencer_data.username}_{influencer_data.full_name}_{total_followers}"
            content_hash = hashlib.md5(content_str.encode()).hexdigest()
            
            # Create new record - EXCLUDING total_followers (auto-generated in Supabase)
            influencer = Influencer(
                username=influencer_data.username,
                full_name=influencer_data.full_name,
                email=influencer_data.email,
                gender=influencer_data.gender,
                location_city=influencer_data.location_city,
                instagram_handle=influencer_data.instagram_handle,
                youtube_channel=influencer_data.youtube_channel,
                tiktok_handle=influencer_data.tiktok_handle,
                instagram_followers=influencer_data.instagram_followers,
                youtube_subscribers=influencer_data.youtube_subscribers,
                tiktok_followers=influencer_data.tiktok_followers,
                # total_followers is auto-calculated in Supabase - DON'T SET IT
                engagement_rate=influencer_data.engagement_rate,
                category=influencer_data.category,
                bio=influencer_data.bio,
                profile_image_url=influencer_data.profile_image_url,
                verified=influencer_data.verified,
                content_hash=content_hash
            )
            
            self.db.add(influencer)
            self.db.commit()
            
            logger.info(f"✅ Saved: {influencer_data.username} ({total_followers:,} followers)")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save {influencer_data.username}: {e}")
            self.db.rollback()
            return False

    def generate_all_categories(self) -> Dict:
        """Generate influencers for all categories"""
        
        logger.info("🚀 Starting Pakistani influencer generation for Supabase")
        
        results = {
            "successfully_added": 0,
            "duplicates_skipped": 0,
            "ai_requests_used": 0,
            "by_category": {},
            "start_time": datetime.now().isoformat()
        }
        
        for category in self.categories:
            if self.openai_requests_used >= self.openai_limit:
                logger.warning("⚠️ OpenAI limit reached")
                break
            
            logger.info(f"🔥 Processing: {category}")
            
            # Generate influencers for this category
            influencers = self.generate_influencers_for_category(category)
            results["ai_requests_used"] = self.openai_requests_used
            
            if not influencers:
                logger.warning(f"⚠️ No influencers generated for {category}")
                continue
            
            # Save each influencer
            category_added = 0
            for influencer in influencers:
                if self.save_to_supabase(influencer):
                    results["successfully_added"] += 1
                    category_added += 1
                else:
                    results["duplicates_skipped"] += 1
            
            results["by_category"][category] = category_added
            logger.info(f"📈 Added {category_added} {category} influencers")
            
            # Small delay between categories
            time.sleep(3)
        
        results["end_time"] = datetime.now().isoformat()
        
        logger.info(f"\n🎉 Generation Complete!")
        logger.info(f"✅ Total added: {results['successfully_added']} influencers")
        logger.info(f"🤖 AI requests used: {results['ai_requests_used']}/{self.openai_limit}")
        
        return results

    def export_to_csv(self) -> str:
        """Export Supabase data to CSV"""
        try:
            # Query with total_followers calculated
            query = """
            SELECT 
                username, full_name, category, location_city,
                instagram_followers, youtube_subscribers, tiktok_followers,
                (instagram_followers + youtube_subscribers + tiktok_followers) as total_followers,
                engagement_rate, verified, bio, created_at
            FROM influencers 
            ORDER BY (instagram_followers + youtube_subscribers + tiktok_followers) DESC
            """
            
            with self.engine.connect() as conn:
                result = conn.execute(text(query))
                data = [dict(row._mapping) for row in result]
            
            df = pd.DataFrame(data)
            filename = f"fixed_supabase_influencers_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
            df.to_csv(filename, index=False)
            
            logger.info(f"📄 Exported {len(data)} influencers to {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"❌ Export failed: {e}")
            return f"Export failed: {e}"

def main():
    """Main function"""
    
    logger.info("🚀 FIXED SUPABASE PAKISTANI INFLUENCER SCRAPER")
    logger.info("✅ Works with Supabase auto-generated total_followers column")
    
    try:
        # Initialize scraper
        scraper = FixedPakistaniScraper()
        
        # Check current data
        current_count = scraper.check_current_data()
        
        if current_count > 0:
            clear = input("Clear existing data first? (y/n): ")
            if clear.lower() in ['y', 'yes']:
                cleared = scraper.clear_database()
                if cleared > 0:
                    logger.info("✅ Database cleared successfully")
        
        # Generate new influencers
        results = scraper.generate_all_categories()
        
        # Export to CSV
        csv_file = scraper.export_to_csv()
        
        print(f"\n🎉 SUCCESS!")
        print(f"✅ Added: {results['successfully_added']} Pakistani influencers to Supabase")
        print(f"🤖 AI requests: {results['ai_requests_used']}/100")
        print(f"📄 CSV exported: {csv_file}")
        
        if results['successfully_added'] >= 50:
            print(f"\n🏆 Your Supabase database now has {results['successfully_added']} Pakistani influencers!")
            print("🚀 MVP ready for production!")
        
    except Exception as e:
        logger.error(f"❌ Scraper failed: {e}")

if __name__ == "__main__":
    main()