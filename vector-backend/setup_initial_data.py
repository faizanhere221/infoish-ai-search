# vector-backend/setup_initial_data.py
"""
Script to add initial Pakistani influencer data to the database
Run this after setting up your database
"""

from database import SessionLocal, Influencer, Platform, ApiKey, init_database
import hashlib
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()

def setup_initial_data():
    """Add initial data to database"""
    
    # Initialize database first
    init_database()
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_count = db.query(Influencer).count()
        if existing_count > 0:
            logger.info(f"Database already has {existing_count} influencers. Skipping...")
            return
        
        # Pakistani Influencers Data
        influencers_data = [
            # Technology
            {
                'username': 'duckybhai',
                'full_name': 'Saad Ur Rehman',
                'email': 'contact@duckybhai.com',
                'gender': 'male',
                'location_city': 'Lahore',
                'instagram_handle': 'duckybhai',
                'youtube_channel': 'duckybhai',
                'tiktok_handle': 'duckybhai',
                'instagram_followers': 890000,
                'youtube_subscribers': 7400000,
                'tiktok_followers': 1200000,
                'total_followers': 9490000,
                'engagement_rate': 6.2,
                'category': 'Technology',
                'bio': 'Pakistani tech YouTuber, content creator, and roaster. Known for tech reviews and commentary videos.',
                'verified': True
            },
            # Comedy
            {
                'username': 'sistrology',
                'full_name': 'Iqra & Fatima',
                'gender': 'female',
                'location_city': 'Karachi',
                'instagram_handle': 'sistrology',
                'youtube_channel': 'sistrology',
                'tiktok_handle': 'sistrology',
                'instagram_followers': 1200000,
                'youtube_subscribers': 850000,
                'tiktok_followers': 450000,
                'total_followers': 2500000,
                'engagement_rate': 4.8,
                'category': 'Comedy',
                'bio': 'Pakistani sister duo creating comedy content. Known for relatable family humor.',
                'verified': True
            },
            {
                'username': 'zaidalit',
                'full_name': 'Zaid Ali',
                'gender': 'male',
                'location_city': 'Karachi',
                'instagram_handle': 'zaidalit',
                'youtube_channel': None,
                'tiktok_handle': 'zaidalit',
                'instagram_followers': 3700000,
                'youtube_subscribers': 0,
                'tiktok_followers': 4800000,
                'total_followers': 8500000,
                'engagement_rate': 7.3,
                'category': 'Comedy',
                'bio': 'Pakistani-Canadian content creator. Famous for comedy sketches and vlogs.',
                'verified': True
            },
            {
                'username': 'shahveerjaay',
                'full_name': 'Shahveer Jafry',
                'gender': 'male',
                'location_city': 'Islamabad',
                'instagram_handle': 'shahveerjaay',
                'youtube_channel': 'shahveerjay',
                'tiktok_handle': 'shahveerjaay',
                'instagram_followers': 3100000,
                'youtube_subscribers': 4500000,
                'tiktok_followers': 2300000,
                'total_followers': 9900000,
                'engagement_rate': 6.8,
                'category': 'Comedy',
                'bio': 'Pakistani-Canadian comedian and content creator. Creates family-friendly comedy content.',
                'verified': True
            },
            # Travel
            {
                'username': 'irfanjunejo',
                'full_name': 'Irfan Junejo',
                'gender': 'male',
                'location_city': 'Karachi',
                'instagram_handle': 'irfanjunejo',
                'youtube_channel': 'irfanjunejo',
                'tiktok_handle': None,
                'instagram_followers': 752000,
                'youtube_subscribers': 1200000,
                'tiktok_followers': 0,
                'total_followers': 1952000,
                'engagement_rate': 4.5,
                'category': 'Travel',
                'bio': 'Pakistani travel vlogger and filmmaker. Creates cinematic travel content.',
                'verified': True
            },
            # Food
            {
                'username': 'foodfusion',
                'full_name': 'Food Fusion',
                'gender': 'not_specified',
                'location_city': 'Karachi',
                'instagram_handle': 'foodfusionpk',
                'youtube_channel': 'FoodFusionPK',
                'tiktok_handle': None,
                'instagram_followers': 245000,
                'youtube_subscribers': 3500000,
                'tiktok_followers': 0,
                'total_followers': 3745000,
                'engagement_rate': 5.2,
                'category': 'Food',
                'bio': 'Pakistans #1 food channel. Easy recipes in Urdu and English.',
                'verified': True
            },
            {
                'username': 'kitchenwithamna',
                'full_name': 'Amna',
                'gender': 'female',
                'location_city': 'Lahore',
                'instagram_handle': None,
                'youtube_channel': 'KitchenWithAmna',
                'tiktok_handle': None,
                'instagram_followers': 0,
                'youtube_subscribers': 4800000,
                'tiktok_followers': 0,
                'total_followers': 4800000,
                'engagement_rate': 4.8,
                'category': 'Food',
                'bio': 'Pakistani cooking channel with traditional and modern recipes.',
                'verified': True
            },
            # Fashion & Beauty
            {
                'username': 'ayesha.m.omar',
                'full_name': 'Ayesha Omar',
                'gender': 'female',
                'location_city': 'Karachi',
                'instagram_handle': 'ayesha.m.omar',
                'youtube_channel': None,
                'tiktok_handle': None,
                'instagram_followers': 2800000,
                'youtube_subscribers': 0,
                'tiktok_followers': 0,
                'total_followers': 2800000,
                'engagement_rate': 3.2,
                'category': 'Fashion',
                'bio': 'Pakistani actress, model, and fashion influencer.',
                'verified': True
            },
            {
                'username': 'mira.sethi',
                'full_name': 'Mira Sethi',
                'gender': 'female',
                'location_city': 'Lahore',
                'instagram_handle': 'mira.sethi',
                'youtube_channel': None,
                'tiktok_handle': None,
                'instagram_followers': 566000,
                'youtube_subscribers': 0,
                'tiktok_followers': 0,
                'total_followers': 566000,
                'engagement_rate': 4.1,
                'category': 'Lifestyle',
                'bio': 'Pakistani actress, writer, and lifestyle influencer.',
                'verified': True
            },
            # Gaming
            {
                'username': 'gamerog',
                'full_name': 'Gamer OG',
                'gender': 'male',
                'location_city': 'Karachi',
                'instagram_handle': 'gamerog',
                'youtube_channel': 'GamerOG',
                'tiktok_handle': None,
                'instagram_followers': 125000,
                'youtube_subscribers': 450000,
                'tiktok_followers': 0,
                'total_followers': 575000,
                'engagement_rate': 5.5,
                'category': 'Gaming',
                'bio': 'Pakistani gaming content creator. PUBG and Call of Duty gameplay.',
                'verified': False
            },
            # Fitness
            {
                'username': 'thefitnesstrainer',
                'full_name': 'Ahmed Ali',
                'gender': 'male',
                'location_city': 'Islamabad',
                'instagram_handle': 'thefitnesstrainer',
                'youtube_channel': None,
                'tiktok_handle': 'thefitnesstrainer',
                'instagram_followers': 89000,
                'youtube_subscribers': 0,
                'tiktok_followers': 45000,
                'total_followers': 134000,
                'engagement_rate': 6.2,
                'category': 'Fitness',
                'bio': 'Certified fitness trainer. Helping Pakistan get fit one rep at a time.',
                'verified': False
            },
            # Education
            {
                'username': 'wildlensbyabrar',
                'full_name': 'Abrar Hassan',
                'gender': 'male',
                'location_city': 'Islamabad',
                'instagram_handle': 'wildlensbyabrar',
                'youtube_channel': 'WildLensByAbrar',
                'tiktok_handle': None,
                'instagram_followers': 321000,
                'youtube_subscribers': 780000,
                'tiktok_followers': 0,
                'total_followers': 1101000,
                'engagement_rate': 4.9,
                'category': 'Education',
                'bio': 'Wildlife photographer and educator. Showcasing Pakistans natural beauty.',
                'verified': True
            }
        ]
        
        # Add all influencers
        for data in influencers_data:
            influencer = Influencer(**data)
            db.add(influencer)
        
        db.commit()
        logger.info(f"✅ Added {len(influencers_data)} Pakistani influencers")
        
        # Create demo API keys
        demo_keys = [
            {
                'key': 'aisk_demo_free_key_123456',
                'name': 'Demo Free User',
                'email': 'free@demo.com',
                'plan_type': 'free',
                'requests_per_day': 50
            },
            {
                'key': 'aisk_demo_basic_key_789012',
                'name': 'Demo Basic User',
                'email': 'basic@demo.com',
                'plan_type': 'basic',
                'requests_per_day': 1000
            },
            {
                'key': 'aisk_demo_pro_key_345678',
                'name': 'Demo Pro User',
                'email': 'pro@demo.com',
                'plan_type': 'pro',
                'requests_per_day': 10000
            }
        ]
        
        for key_data in demo_keys:
            api_key = ApiKey(
                key_hash=hash_api_key(key_data['key']),
                name=key_data['name'],
                email=key_data['email'],
                plan_type=key_data['plan_type'],
                requests_per_day=key_data['requests_per_day'],
                requests_used_today=0,
                is_active=True
            )
            db.add(api_key)
        
        db.commit()
        logger.info(f"✅ Added {len(demo_keys)} demo API keys")
        
        # Print demo keys
        print("\n" + "="*50)
        print("DEMO API KEYS (Use these for testing):")
        print("="*50)
        for key_data in demo_keys:
            print(f"{key_data['plan_type'].upper()} Plan: {key_data['key']}")
        print("="*50 + "\n")
        
    except Exception as e:
        logger.error(f"Error adding initial data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_initial_data()