"""
Test Instagram Analyzer Backend
Run this after deploying to Railway to verify everything works
"""

import requests
import json

# Your Railway backend URL
BACKEND_URL = "https://infoish-ai-search-production.up.railway.app"
# Or for local testing: "http://localhost:8000"

def test_health_check():
    """Test if the service is up"""
    print("\n🔍 Testing health check...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/instagram-analyzer/health")
        
        if response.status_code == 200:
            print("✅ Health check passed!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_profile_analysis(username):
    """Test analyzing a profile"""
    print(f"\n🔍 Testing profile analysis for @{username}...")
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/analyze-instagram/{username}",
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Analysis successful!")
            print(f"\n📊 Results:")
            print(f"  Username: @{data['username']}")
            print(f"  Display Name: {data['display_name']}")
            print(f"  Followers: {data['followers']:,}")
            print(f"  Posts: {data['posts']}")
            print(f"  Verified: {'Yes' if data['is_verified'] else 'No'}")
            print(f"  Avg Likes: {data['avg_likes']:,}")
            print(f"  Avg Comments: {data['avg_comments']:,}")
            
            # Calculate engagement rate
            if data['followers'] > 0:
                total_engagement = data['avg_likes'] + data['avg_comments']
                engagement_rate = (total_engagement / data['followers']) * 100
                print(f"  Engagement Rate: {engagement_rate:.2f}%")
            
            print(f"  Recent Posts: {len(data['recent_posts'])} analyzed")
            return True
            
        elif response.status_code == 404:
            print(f"❌ Profile not found")
            return False
        elif response.status_code == 403:
            print(f"❌ Profile is private")
            return False
        elif response.status_code == 429:
            print(f"❌ Rate limit exceeded")
            return False
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ Request timeout (normal for first request)")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_quick_analysis(username):
    """Test quick analysis endpoint"""
    print(f"\n🔍 Testing quick analysis for @{username}...")
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/analyze-instagram-quick/{username}",
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Quick analysis successful!")
            print(f"  Username: @{data['username']}")
            print(f"  Followers: {data['followers']:,}")
            print(f"  Avg Likes: {data['avg_likes']:,}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_error_handling():
    """Test error handling"""
    print(f"\n🔍 Testing error handling...")
    
    # Test non-existent profile
    response = requests.get(
        f"{BACKEND_URL}/api/analyze-instagram/thisuserdoesnotexist999999"
    )
    
    if response.status_code == 404:
        print("✅ 404 error handling works!")
    else:
        print(f"❌ Expected 404, got {response.status_code}")

def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("🧪 Instagram Analyzer Backend Tests")
    print("=" * 60)
    
    # Test 1: Health check
    health_ok = test_health_check()
    
    if not health_ok:
        print("\n❌ Health check failed. Backend may not be running.")
        return
    
    # Test 2: Profile analysis with public profiles
    test_profiles = [
        "cristiano",    # Large verified profile
        "kakayrao",     # Your profile
    ]
    
    for username in test_profiles:
        test_profile_analysis(username)
        print("-" * 60)
    
    # Test 3: Quick analysis
    test_quick_analysis("cristiano")
    print("-" * 60)
    
    # Test 4: Error handling
    test_error_handling()
    
    print("\n" + "=" * 60)
    print("✅ All tests complete!")
    print("=" * 60)

if __name__ == "__main__":
    # You can customize the backend URL here
    import sys
    
    if len(sys.argv) > 1:
        BACKEND_URL = sys.argv[1]
        print(f"Using custom backend URL: {BACKEND_URL}")
    
    run_all_tests()