"""
Instagram Profile Analyzer API - FIXED VERSION
Includes caching, rate limiting, and all required imports
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import instaloader
import time
import statistics
from datetime import datetime, timedelta

router = APIRouter()

# Simple in-memory cache
profile_cache = {}
CACHE_DURATION = 3600  # 1 hour

# Rate limiting tracker
request_tracker = {}
RATE_LIMIT_WINDOW = 60  # 1 minute
MAX_REQUESTS_PER_WINDOW = 10  # 10 requests per minute

class PostData(BaseModel):
    id: str
    caption: Optional[str] = None
    likes: int
    comments: int
    views: Optional[int] = None
    type: str
    timestamp: str
    engagementRate: float
    thumbnail: str

class InstagramProfileResponse(BaseModel):
    username: str
    display_name: str
    bio: Optional[str] = None
    followers: int
    following: int
    posts: int
    profile_picture: str
    is_verified: bool
    category: Optional[str] = None
    location: Optional[str] = None
    avg_likes: float
    avg_comments: float
    avg_views: Optional[float] = None
    recent_posts: List[PostData]


def check_rate_limit(username: str) -> bool:
    """Check if username has exceeded rate limit"""
    now = time.time()
    
    # Clean old entries
    expired_keys = [k for k, v in request_tracker.items() if now - v['timestamp'] > RATE_LIMIT_WINDOW]
    for k in expired_keys:
        del request_tracker[k]
    
    # Check current user
    if username in request_tracker:
        if request_tracker[username]['count'] >= MAX_REQUESTS_PER_WINDOW:
            return False
        request_tracker[username]['count'] += 1
    else:
        request_tracker[username] = {'count': 1, 'timestamp': now}
    
    return True


def get_cached_profile(username: str):
    """Get profile from cache if available and not expired"""
    if username in profile_cache:
        cached_data, timestamp = profile_cache[username]
        if datetime.now() - timestamp < timedelta(seconds=CACHE_DURATION):
            print(f"Cache hit for {username}")
            return cached_data
        else:
            print(f"Cache expired for {username}")
            del profile_cache[username]
    return None


@router.get("/analyze-instagram/{username}")
async def analyze_instagram_profile(username: str, request: Request):
    """
    Analyze Instagram profile with caching and rate limiting
    """
    try:
        # Check rate limit
        if not check_rate_limit(username):
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too many requests",
                    "message": "Please wait a minute before trying again.",
                    "retry_after": 60
                }
            )
        
        # Check cache first
        cached = get_cached_profile(username)
        if cached:
            print(f"Returning cached data for {username}")
            return cached
        
        print(f"Fetching fresh data for {username}")
        
        # Create Instaloader instance - SIMPLIFIED
        L = instaloader.Instaloader(
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            post_metadata_txt_pattern='',
            max_connection_attempts=3
        )
        
        # Set quiet mode
        L.context.quiet = True
        
        # Try to get profile with retry logic
        max_retries = 2
        profile = None
        for attempt in range(max_retries):
            try:
                profile = instaloader.Profile.from_username(L.context, username)
                time.sleep(2)  # Wait 2 seconds after getting profile
                break
            except Exception as e:
                if attempt < max_retries - 1:
                    print(f"Retry {attempt + 1} for {username}")
                    time.sleep(5)  # Wait 5 seconds before retry
                    continue
                raise e
        
        if not profile:
            raise HTTPException(status_code=500, detail="Failed to fetch profile")
        
        # Get basic profile data
        profile_data = {
            "username": profile.username,
            "full_name": profile.full_name,
            "biography": profile.biography,
            "followers": profile.followers,
            "following": profile.followees,
            "posts_count": profile.mediacount,
            "is_verified": profile.is_verified,
            "is_private": profile.is_private,
            "profile_pic_url": profile.profile_pic_url,
            "external_url": profile.external_url
        }
        
        # Only fetch posts if public
        posts = []
        if not profile.is_private:
            try:
                post_count = 0
                for post in profile.get_posts():
                    if post_count >= 12:  # Changed from 6 to 12
                        break
                    
                    # Use Instagram embed URL for thumbnail (public, no auth needed)
                    thumbnail_url = f"https://www.instagram.com/p/{post.shortcode}/media/?size=m"
                    
                    posts.append({
                        "shortcode": post.shortcode,
                        "likes": post.likes,
                        "comments": post.comments,
                        "caption": post.caption[:200] if post.caption else "",
                        "date": post.date_utc.isoformat(),
                        "is_video": post.is_video,
                        "url": f"https://www.instagram.com/p/{post.shortcode}/",
                        "thumbnail_url": thumbnail_url,
                        "display_url": thumbnail_url
                    })
                    
                    post_count += 1
                    time.sleep(1)  # 1 second delay between post fetches
                    
            except Exception as e:
                print(f"Error fetching posts: {e}")
                # Continue without posts if there's an error
        
        # Calculate metrics
        total_likes = sum(post['likes'] for post in posts)
        total_comments = sum(post['comments'] for post in posts)
        avg_likes = total_likes / len(posts) if posts else 0
        avg_comments = total_comments / len(posts) if posts else 0
        
        engagement_rate = 0
        if profile.followers > 0 and posts:
            avg_engagement = (avg_likes + avg_comments) / 2
            engagement_rate = (avg_engagement / profile.followers) * 100
        
        # Find best performing post
        best_post = None
        if posts:
            best_post = max(posts, key=lambda p: p['likes'] + p['comments'])
        
        # Calculate post type distribution
        video_count = sum(1 for post in posts if post['is_video'])
        photo_count = len(posts) - video_count
        
        metrics = {
            "engagement_rate": round(engagement_rate, 2),
            "avg_likes": int(avg_likes),
            "avg_comments": int(avg_comments),
            "total_posts_analyzed": len(posts),
            "best_post": {
                "shortcode": best_post['shortcode'] if best_post else None,
                "likes": best_post['likes'] if best_post else 0,
                "comments": best_post['comments'] if best_post else 0,
                "url": best_post['url'] if best_post else None
            } if best_post else None,
            "post_types": {
                "videos": video_count,
                "photos": photo_count
            }
        }
        
        result = {
            "profile": profile_data,
            "metrics": metrics,
            "posts": posts,
            "cached": False,
            "timestamp": datetime.now().isoformat()
        }
        
        # Cache the result
        profile_cache[username] = (result, datetime.now())
        print(f"Cached data for {username}")
        
        return result
        
    except instaloader.exceptions.ProfileNotExistsException:
        raise HTTPException(status_code=404, detail="Profile not found")
    except instaloader.exceptions.PrivateProfileNotFollowedException:
        raise HTTPException(status_code=403, detail="This is a private profile")
    except instaloader.exceptions.ConnectionException:
        raise HTTPException(status_code=429, detail="Too many requests to Instagram. Please try again in a few minutes.")
    except instaloader.exceptions.TooManyRequestsException:
        raise HTTPException(status_code=429, detail="Instagram rate limit reached. Please try again in 5-10 minutes.")
    except Exception as e:
        print(f"Error analyzing profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing profile: {str(e)}")


@router.get("/analyze-instagram-quick/{username}")
async def analyze_instagram_profile_quick(username: str, request: Request):
    """Quick analysis - profile stats only"""
    
    client_ip = request.client.host
    check_rate_limit(client_ip)
    
    username = username.strip().lstrip('@')
    
    try:
        L = instaloader.Instaloader()
        L.context.quiet = True
        
        try:
            profile = instaloader.Profile.from_username(L.context, username)
        except instaloader.exceptions.ProfileNotExistsException:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        if profile.is_private:
            raise HTTPException(status_code=403, detail="Profile is private")
        
        likes_list = []
        comments_list = []
        
        post_count = 0
        try:
            for post in profile.get_posts():
                if post_count >= 5:
                    break
                likes_list.append(post.likes)
                comments_list.append(post.comments)
                post_count += 1
        except:
            pass
        
        avg_likes = round(statistics.mean(likes_list)) if likes_list else 0
        avg_comments = round(statistics.mean(comments_list)) if comments_list else 0
        
        return {
            "username": profile.username,
            "display_name": profile.full_name or profile.username,
            "bio": profile.biography,
            "followers": profile.followers,
            "following": profile.followees,
            "posts": profile.mediacount,
            "profile_picture": profile.profile_pic_url,
            "is_verified": profile.is_verified,
            "avg_likes": avg_likes,
            "avg_comments": avg_comments,
            "avg_views": None,
            "recent_posts": []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing profile {username}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze profile")


@router.get("/instagram-analyzer/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Instagram Profile Analyzer",
        "version": "1.2.0",
        "cache_size": len(profile_cache),
        "features": ["caching", "rate_limiting", "retry_logic"]
    }


@router.get("/instagram-analyzer/cache-stats")
async def cache_stats():
    """Get cache statistics"""
    active_cache = 0
    expired_cache = 0
    
    now = datetime.now()
    for username, (data, timestamp) in profile_cache.items():
        if now - timestamp < timedelta(seconds=CACHE_DURATION):
            active_cache += 1
        else:
            expired_cache += 1
    
    return {
        "total_cached": len(profile_cache),
        "active": active_cache,
        "expired": expired_cache,
        "cache_duration_seconds": CACHE_DURATION
    }