# vector-backend/expanded_pakistani_scraper.py
# Enhanced scraper to reach 300 Pakistani influencers with diverse categories

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

class ExpandedPakistaniScraper:
    """Enhanced scraper to reach 300 Pakistani influencers"""
    
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
            
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                
            logger.info("Connected to Supabase PostgreSQL database")
            
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            self.db = SessionLocal()
            
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
        
        self.openai_requests_used = 0
        self.openai_limit = 100
        
        # EXPANDED categories to reach 300 influencers
        self.expanded_categories = {
            "Sports & Fitness": [
                "Pakistani cricket players social media",
                "Pakistani fitness trainers influencers", 
                "Sports journalists Pakistan",
                "Pakistani athletes Instagram verified"
            ],
            
            "News & Current Affairs": [
                "Pakistani news anchors social media",
                "Political commentators Pakistan",
                "Journalists Pakistan verified accounts",
                "Pakistani media personalities"
            ],
            
            "Education & Academia": [
                "Pakistani teachers social media educators",
                "Educational YouTubers Pakistan Urdu English",
                "Pakistani professors academics influencers",
                "Online learning Pakistan content creators"
            ],
            
            "Health & Medical": [
                "Pakistani doctors social media presence",
                "Health influencers Pakistan wellness",
                "Medical professionals Pakistan verified",
                "Fitness nutrition experts Pakistan"
            ],
            
            "Business & Finance": [
                "Pakistani entrepreneurs social media",
                "Business coaches Pakistan motivational",
                "Pakistani CEOs founders Instagram",
                "Investment advisors Pakistan financial"
            ],
            
            "Photography & Art": [
                "Pakistani photographers Instagram verified",
                "Visual artists Pakistan creative",
                "Pakistani designers social media",
                "Art influencers Pakistan creative content"
            ],
            
            "Parenting & Family": [
                "Pakistani parenting bloggers mothers",
                "Family content creators Pakistan",
                "Pakistani moms Instagram influencers",
                "Child care experts Pakistan social media"
            ],
            
            "Regional Content": [
                "Punjabi content creators Pakistan",
                "Sindhi influencers Pakistan regional",
                "Pashto YouTubers content creators",
                "Urdu poetry influencers Pakistan"
            ],
            
            "Gaming & Technology": [
                "Pakistani gamers streamers esports",
                "Gaming content creators Pakistan Urdu",
                "Pakistani tech reviewers emerging",
                "Mobile gaming influencers Pakistan"
            ],
            
            "Automotive": [
                "Pakistani car reviewers automotive",
                "Bike enthusiasts Pakistan motorcycles",
                "Auto bloggers Pakistan vehicles",
                "Pakistani automotive YouTubers"
            ]
        }

    def check_current_data(self):
        """Check existing data and show statistics"""
        try:
            count = self.db.query(Influencer).count()
            logger.info(f"Current Supabase database: {count} influencers")
            
            if count > 0:
                # Show category breakdown
                query = """
                SELECT category, COUNT(*) as count 
                FROM influencers 
                WHERE category IS NOT NULL 
                GROUP BY category 
                ORDER BY count DESC
                """
                with self.engine.connect() as conn:
                    result = conn.execute(text(query))
                    categories = dict(result.fetchall())
                
                logger.info("Current category breakdown:")
                for cat, cnt in categories.items():
                    logger.info(f"  - {cat}: {cnt} influencers")
            
            return count
        except Exception as e:
            logger.error(f"Error checking data: {e}")
            return 0

    def generate_influencers_for_category(self, category: str, category_queries: List[str]) -> List[InfluencerData]:
        """Generate Pakistani influencers for expanded categories"""
        
        system_prompt = f"""You are an expert on Pakistani social media influencers across all niches. Generate Pakistani influencers in the {category} category.

REQUIREMENTS:
1. REAL Pakistani influencers (not internationally famous unless Pakistani origin)
2. Minimum 15,000+ followers on at least one platform
3. Currently active (2023-2024)
4. Include emerging/rising influencers, not just mega-celebrities
5. Diverse Pakistani cities and backgrounds
6. Focus on niche experts and specialists in {category}

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
        "engagement_rate": 2.0_to_6.0,
        "category": "{category}",
        "bio": "Brief description of their expertise/content",
        "verified": true_if_verified_or_famous
    }}
]

Generate 15-25 Pakistani {category} influencers, including both established and emerging creators."""

        # Create detailed prompt with category context
        category_context = "\n".join(f"- {query}" for query in category_queries)
        user_prompt = f"""Generate Pakistani {category} influencers based on these areas:

{category_context}

Include both well-known and emerging Pakistani {category} influencers. Focus on authentic Pakistani content creators with growing audiences. Return only JSON array with 15-25 influencers."""

        try:
            self.openai_requests_used += 1
            logger.info(f"AI request {self.openai_requests_used}/{self.openai_limit} - {category}")
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,  # Slightly higher for more variety
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
                    logger.info(f"Parsed {len(data_list)} influencers from AI")
                    
                    influencers = []
                    for data in data_list:
                        try:
                            username = str(data.get('username', '')).strip().replace('@', '').lower()
                            if not username:
                                continue
                            
                            # Lower threshold for niche categories
                            instagram_followers = int(data.get('instagram_followers', 0))
                            youtube_subscribers = int(data.get('youtube_subscribers', 0))
                            tiktok_followers = int(data.get('tiktok_followers', 0))
                            total = instagram_followers + youtube_subscribers + tiktok_followers
                            
                            if total < 15000:  # Lower threshold for specialized niches
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
                                engagement_rate=float(data.get('engagement_rate', 3.0)),
                                category=category,
                                bio=str(data.get('bio', '')).strip() or None,
                                verified=bool(data.get('verified', False))
                            )
                            
                            influencers.append(influencer)
                            
                        except Exception as e:
                            logger.warning(f"Skipped invalid influencer: {e}")
                            continue
                    
                    logger.info(f"Generated {len(influencers)} valid {category} influencers")
                    return influencers
                    
                except json.JSONDecodeError as e:
                    logger.error(f"JSON parsing failed: {e}")
                    return []
            else:
                logger.error("No JSON found in AI response")
                return []
                
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            return []

    def save_to_supabase(self, influencer_data: InfluencerData) -> bool:
        """Save influencer to Supabase - handles duplicates"""
        try:
            # Check duplicates
            existing = self.db.query(Influencer).filter_by(username=influencer_data.username).first()
            if existing:
                return False
            
            total_followers = (
                influencer_data.instagram_followers + 
                influencer_data.youtube_subscribers + 
                influencer_data.tiktok_followers
            )
            
            content_str = f"{influencer_data.username}_{influencer_data.full_name}_{total_followers}"
            content_hash = hashlib.md5(content_str.encode()).hexdigest()
            
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
                engagement_rate=influencer_data.engagement_rate,
                category=influencer_data.category,
                bio=influencer_data.bio,
                profile_image_url=influencer_data.profile_image_url,
                verified=influencer_data.verified,
                content_hash=content_hash
            )
            
            self.db.add(influencer)
            self.db.commit()
            
            logger.info(f"Saved: {influencer_data.username} ({total_followers:,} followers)")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save {influencer_data.username}: {e}")
            self.db.rollback()
            return False

    def expand_to_300_influencers(self, target_count: int = 300) -> Dict:
        """Generate influencers across expanded categories to reach 300"""
        
        logger.info(f"EXPANDING to {target_count} Pakistani influencers")
        
        # Check current count
        current_count = self.check_current_data()
        remaining = target_count - current_count
        
        if remaining <= 0:
            logger.info(f"Already have {current_count} influencers (target: {target_count})")
            return {"message": "Target already reached", "current_count": current_count}
        
        logger.info(f"Need {remaining} more influencers to reach {target_count}")
        
        results = {
            "starting_count": current_count,
            "successfully_added": 0,
            "duplicates_skipped": 0,
            "ai_requests_used": 0,
            "by_category": {},
            "start_time": datetime.now().isoformat()
        }
        
        # Process expanded categories
        for category, queries in self.expanded_categories.items():
            if results["successfully_added"] + current_count >= target_count:
                logger.info(f"Target reached: {target_count} total influencers!")
                break
            
            if self.openai_requests_used >= self.openai_limit:
                logger.warning("OpenAI limit reached")
                break
            
            logger.info(f"Processing: {category}")
            
            # Generate influencers for this category
            influencers = self.generate_influencers_for_category(category, queries)
            results["ai_requests_used"] = self.openai_requests_used
            
            if not influencers:
                logger.warning(f"No influencers generated for {category}")
                continue
            
            # Save each influencer
            category_added = 0
            for influencer in influencers:
                if results["successfully_added"] + current_count >= target_count:
                    break
                
                if self.save_to_supabase(influencer):
                    results["successfully_added"] += 1
                    category_added += 1
                else:
                    results["duplicates_skipped"] += 1
            
            results["by_category"][category] = category_added
            logger.info(f"Added {category_added} {category} influencers")
            logger.info(f"Progress: {current_count + results['successfully_added']}/{target_count}")
            
            time.sleep(3)
        
        results["final_count"] = current_count + results["successfully_added"]
        results["end_time"] = datetime.now().isoformat()
        
        logger.info(f"\nExpansion Complete!")
        logger.info(f"Added: {results['successfully_added']} new influencers")
        logger.info(f"Total now: {results['final_count']}/{target_count}")
        logger.info(f"AI requests used: {results['ai_requests_used']}/{self.openai_limit}")
        
        return results

    def export_all_to_csv(self) -> str:
        """Export complete database to CSV"""
        try:
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
            filename = f"all_pakistani_influencers_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
            df.to_csv(filename, index=False)
            
            logger.info(f"Exported {len(data)} total influencers to {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"Export failed: {e}")
            return f"Export failed: {e}"

def main():
    """Main function"""
    
    logger.info("EXPANDED PAKISTANI INFLUENCER SCRAPER")
    logger.info("Target: 300 Pakistani influencers across diverse niches")
    
    try:
        scraper = ExpandedPakistaniScraper()
        
        # Expand to 300 influencers
        results = scraper.expand_to_300_influencers(300)
        
        # Export complete database
        csv_file = scraper.export_all_to_csv()
        
        print(f"\nEXPANSION COMPLETE!")
        print(f"Added: {results.get('successfully_added', 0)} new Pakistani influencers")
        print(f"Total database: {results.get('final_count', 0)}/300")
        print(f"AI requests: {results.get('ai_requests_used', 0)}/100")
        print(f"Complete export: {csv_file}")
        
        if results.get('final_count', 0) >= 250:
            print(f"\nSUCCESS! You now have {results.get('final_count', 0)} Pakistani influencers!")
            print("Your comprehensive influencer database is ready!")
        
    except Exception as e:
        logger.error(f"Scraper failed: {e}")

if __name__ == "__main__":
    main()