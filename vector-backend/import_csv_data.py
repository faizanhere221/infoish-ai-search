# vector-backend/import_csv_data.py
"""
Import influencer data from CSV file
"""
import csv
import sys
from database import SessionLocal, Influencer
import os

def clean_number(value):
    """Extract number from string like '50,000' or '50K' """
    if not value:
        return 0
    value = str(value).strip().replace(',', '')
    if 'K' in value.upper():
        return int(float(value.upper().replace('K', '')) * 1000)
    elif 'M' in value.upper():
        return int(float(value.upper().replace('M', '')) * 1000000)
    try:
        return int(float(value))
    except:
        return 0

def clean_username(username):
    """Remove @ and clean username"""
    if not username:
        return None
    return str(username).strip().replace('@', '').replace(' ', '').lower()

def import_from_csv(csv_file_path):
    """Import influencers from CSV file (works with both Google Forms and manual CSVs)"""
    
    if not os.path.exists(csv_file_path):
        print(f"❌ File not found: {csv_file_path}")
        return
    
    db = SessionLocal()
    added_count = 0
    skipped_count = 0
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                # Clean and extract username - handle both formats
                username = clean_username(
                    row.get('username') or 
                    row.get('Username') or 
                    row.get('Your primary username (without @)') or
                    row.get('handle')
                )
                
                if not username:
                    print(f"⚠️ Skipping row without username: {row}")
                    skipped_count += 1
                    continue
                
                existing = db.query(Influencer).filter_by(username=username).first()
                if existing:
                    print(f"⚠️ Influencer {username} already exists, skipping")
                    skipped_count += 1
                    continue
                
                # Handle both Google Forms format and simple CSV format
                # Instagram
                instagram_handle = clean_username(
                    row.get('instagram') or 
                    row.get('Instagram') or 
                    row.get('Instagram Handle') or
                    row.get('ig_handle')
                )
                
                instagram_followers = clean_number(
                    row.get('ig_followers') or 
                    row.get('Instagram Followers') or 
                    row.get('instagram_followers') or 0
                )
                
                # YouTube
                youtube_channel = (
                    row.get('youtube') or 
                    row.get('YouTube') or 
                    row.get('YouTube Channel Name') or
                    row.get('yt_channel')
                )
                
                youtube_subscribers = clean_number(
                    row.get('yt_subscribers') or 
                    row.get('YouTube Subscribers') or
                    row.get('youtube_subscribers') or 0
                )
                
                # TikTok
                tiktok_handle = clean_username(
                    row.get('tiktok') or 
                    row.get('TikTok') or 
                    row.get('TikTok Username') or
                    row.get('tt_handle')
                )
                
                tiktok_followers = clean_number(
                    row.get('tt_followers') or 
                    row.get('TikTok Followers') or
                    row.get('tiktok_followers') or 0
                )
                
                # Calculate total
                total = instagram_followers + youtube_subscribers + tiktok_followers
                
                # Skip if too few followers (less than 5000)
                if total < 5000:
                    print(f"⚠️ Skipping {username} - only {total} total followers (minimum 1000)")
                    skipped_count += 1
                    continue
                
                # Get engagement rate
                engagement = row.get('engagement') or row.get('Engagement Rate') or row.get('Average Engagement Rate') or '0'
                try:
                    engagement_rate = float(str(engagement).replace('%', '').strip())
                except:
                    engagement_rate = 2.5  # Default
                
                # Check verified status - handle different formats
                verified_str = row.get('verified') or row.get('Verified') or row.get('Are you verified on any platform?') or 'false'
                verified = verified_str.lower() in ['true', 'yes', '1']
                
                # Create influencer object
                influencer = Influencer(
                    username=username,
                    full_name=row.get('full_name') or row.get('Full Name') or row.get('name'),
                    email=row.get('email') or row.get('Email'),
                    gender=(row.get('gender') or row.get('Gender') or 'not_specified').lower().replace(' ', '_'),
                    location_city=row.get('location') or row.get('city') or row.get('City') or 'Pakistan',
                    
                    instagram_handle=instagram_handle,
                    youtube_channel=youtube_channel,
                    tiktok_handle=tiktok_handle,
                    
                    instagram_followers=instagram_followers,
                    youtube_subscribers=youtube_subscribers,
                    tiktok_followers=tiktok_followers,
                    total_followers=total,
                    
                    engagement_rate=engagement_rate,
                    category=row.get('category') or row.get('Category') or row.get('Primary Category') or 'Lifestyle',
                    bio=row.get('bio') or row.get('Bio') or row.get('Bio/Description') or row.get('description'),
                    verified=verified
                )
                
                db.add(influencer)
                added_count += 1
                print(f"✅ Added: {username} ({influencer.category}, {influencer.total_followers:,} followers)")
        
        db.commit()
        print(f"\n🎉 Import Complete!")
        print(f"✅ Added: {added_count} influencers")
        print(f"⚠️ Skipped: {skipped_count} entries")
        
    except Exception as e:
        print(f"❌ Error during import: {e}")
        db.rollback()
    finally:
        db.close()

def create_sample_csv():
    """Create a sample CSV file for testing"""
    sample_file = "sample_influencers.csv"
    
    with open(sample_file, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        
        # Write header
        writer.writerow([
            'username', 'full_name', 'email', 'gender', 'city',
            'instagram', 'youtube', 'tiktok',
            'ig_followers', 'yt_subscribers', 'tt_followers',
            'engagement', 'category', 'bio', 'verified'
        ])
        
        # Write sample data
        sample_data = [
            ['foodpanda_pk', 'FoodPanda Pakistan', 'contact@foodpanda.pk', 'not_specified', 'Karachi',
             'foodpanda_pk', None, 'foodpanda_pk',
             450000, 0, 120000,
             3.5, 'Food', 'Food delivery service in Pakistan', 'true'],
            
            ['muskan.jay', 'Muskan Jay', None, 'female', 'Karachi',
             'muskan.jay', 'muskanjay', None,
             650000, 380000, 0,
             5.2, 'Beauty', 'Beauty and makeup content creator', 'false'],
            
            ['mooroo', 'Mooroo', 'contact@mooroo.com', 'male', 'Islamabad',
             'mooroo', 'mooroo', 'mooroo',
             380000, 920000, 250000,
             4.7, 'Comedy', 'Comedian, musician, and content creator', 'true'],
        ]
        
        writer.writerows(sample_data)
    
    print(f"✅ Created sample CSV file: {sample_file}")
    print("You can edit this file and add more influencers")
    return sample_file

if __name__ == "__main__":
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
    else:
        print("No CSV file specified. Creating sample CSV...")
        csv_file = create_sample_csv()
        response = input("\nDo you want to import the sample data? (y/n): ")
        if response.lower() != 'y':
            print("Exiting without import.")
            sys.exit(0)
    
    print(f"\n📂 Importing from: {csv_file}")
    import_from_csv(csv_file)