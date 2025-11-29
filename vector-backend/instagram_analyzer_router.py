"""
Instagram Profile Analyzer API Endpoint - CORRECTED VERSION
Fixed router prefix issue
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
import instaloader
from datetime import datetime
import statistics
from collections import defaultdict

# FIXED: Remove /api prefix here, add it in main.py instead
router = APIRouter(tags=["Instagram Analyzer"])

# Simple rate limiting
rate_limit_tracker = defaultdict(list)
MAX_REQUESTS_PER_HOUR = 30

class PostData(BaseModel):
    id: str
    caption: Optional[str]
    likes: int
    comments: int
    views: Optional[int]
    type: str
    timestamp: str
    engagementRate: float

class InstagramProfileResponse(BaseModel):
    username: str
    display_name: str
    bio: Optional[str]
    followers: int
    following: int
    posts: int
    profile_picture: str
    is_verified: bool
    category: Optional[str]
    location: Optional[str]
    avg_likes: float
    avg_comments: float
    avg_views: Optional[float]
    recent_posts: List[PostData]


def check_rate_limit(ip_address: str):
    """Simple rate limiter - 30 requests per hour per IP"""
    from datetime import datetime, timedelta
    
    now = datetime.now()
    hour_ago = now - timedelta(hours=1)
    
    rate_limit_tracker[ip_address] = [
        req_time for req_time in rate_limit_tracker[ip_address]
        if req_time > hour_ago
    ]
    
    if len(rate_limit_tracker[ip_address]) >= MAX_REQUESTS_PER_HOUR:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again in an hour."
        )
    
    rate_limit_tracker[ip_address].append(now)


@router.get("/analyze-instagram/{username}")
async def analyze_instagram_profile(username: str, request: Request):
    """
    Analyze a public Instagram profile and return engagement metrics
    """
    
    client_ip = request.client.host
    check_rate_limit(client_ip)
    
    username = username.strip().lstrip('@')
    
    try:
        L = instaloader.Instaloader()
        L.context.quiet = True
        
        try:
            profile = instaloader.Profile.from_username(L.context, username)
        except instaloader.exceptions.ProfileNotExistsException:
            raise HTTPException(status_code=404, detail="Profile not found. Please check the username.")
        except instaloader.exceptions.PrivateProfileNotFollowedException:
            raise HTTPException(status_code=403, detail="This profile is private. Only public profiles can be analyzed.")
        
        if profile.is_private:
            raise HTTPException(
                status_code=403,
                detail="This profile is private. Only public profiles can be analyzed."
            )
        
        profile_data = {
            "username": profile.username,
            "display_name": profile.full_name or profile.username,
            "bio": profile.biography,
            "followers": profile.followers,
            "following": profile.followees,
            "posts": profile.mediacount,
            "profile_picture": profile.profile_pic_url,
            "is_verified": profile.is_verified,
            "category": profile.business_category_name if profile.is_business_account else None,
            "location": None
        }
        
        recent_posts = []
        likes_list = []
        comments_list = []
        views_list = []
        
        post_count = 0
        max_posts = 12
        
        try:
            for post in profile.get_posts():
                if post_count >= max_posts:
                    break
                
                likes = post.likes
                comments = post.comments
                views = post.video_view_count if post.is_video else None
                
                likes_list.append(likes)
                comments_list.append(comments)
                if views:
                    views_list.append(views)
                
                total_engagement = likes + comments
                engagement_rate = (total_engagement / profile.followers) * 100 if profile.followers > 0 else 0
                
                post_data = {
                    "id": post.shortcode,
                    "caption": post.caption[:200] if post.caption else None,
                    "likes": likes,
                    "comments": comments,
                    "views": views,
                    "type": "video" if post.is_video else "image",
                    "timestamp": post.date_utc.isoformat(),
                    "engagementRate": round(engagement_rate, 2)
                }
                
                recent_posts.append(post_data)
                post_count += 1
                
        except Exception as e:
            print(f"Warning: Could not fetch all posts for {username}: {str(e)}")
        
        avg_likes = round(statistics.mean(likes_list)) if likes_list else 0
        avg_comments = round(statistics.mean(comments_list)) if comments_list else 0
        avg_views = round(statistics.mean(views_list)) if views_list else None
        
        response = {
            **profile_data,
            "avg_likes": avg_likes,
            "avg_comments": avg_comments,
            "avg_views": avg_views,
            "recent_posts": recent_posts
        }
        
        return response
        
    except HTTPException:
        raise
    except instaloader.exceptions.ConnectionException:
        raise HTTPException(
            status_code=429,
            detail="Too many requests to Instagram. Please try again in a few minutes."
        )
    except instaloader.exceptions.InstaloaderException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Instagram API error: {str(e)}"
        )
    except Exception as e:
        print(f"Error analyzing profile {username}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze profile. Please try again later."
        )


@router.get("/analyze-instagram-quick/{username}")
async def analyze_instagram_profile_quick(username: str, request: Request):
    """
    Quick analysis - profile stats only (faster, no post data)
    """
    
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
    """Check if Instagram analyzer service is working"""
    return {
        "status": "healthy",
        "service": "Instagram Profile Analyzer",
        "version": "1.0.0"
    }