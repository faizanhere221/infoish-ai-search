"""
Instagram Profile Analyzer API Endpoint
Fetches public Instagram profile data and calculates engagement metrics
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import instaloader
from datetime import datetime
import statistics

router = APIRouter()

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

@router.get("/api/analyze-instagram/{username}")
async def analyze_instagram_profile(username: str):
    """
    Analyze a public Instagram profile and return engagement metrics
    
    Args:
        username: Instagram username (without @)
    
    Returns:
        Profile data with engagement metrics
    """
    try:
        # Initialize Instaloader
        L = instaloader.Instaloader()
        
        # Disable rate limiting messages
        L.context.quiet = True
        
        try:
            # Load profile
            profile = instaloader.Profile.from_username(L.context, username)
        except instaloader.exceptions.ProfileNotExistsException:
            raise HTTPException(status_code=404, detail="Profile not found")
        except instaloader.exceptions.PrivateProfileNotFollowedException:
            raise HTTPException(status_code=403, detail="Profile is private")
        
        # Check if profile is private
        if profile.is_private:
            raise HTTPException(status_code=403, detail="Profile is private. Only public profiles can be analyzed.")
        
        # Basic profile data
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
            "location": None  # Location is not directly available via Instaloader
        }
        
        # Fetch recent posts (last 12 posts)
        recent_posts = []
        likes_list = []
        comments_list = []
        views_list = []
        
        post_count = 0
        max_posts = 12
        
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
            
            # Calculate engagement rate for this post
            total_engagement = likes + comments
            engagement_rate = (total_engagement / profile.followers) * 100 if profile.followers > 0 else 0
            
            post_data = {
                "id": post.shortcode,
                "caption": post.caption[:200] if post.caption else None,  # First 200 chars
                "likes": likes,
                "comments": comments,
                "views": views,
                "type": "video" if post.is_video else "image",
                "timestamp": post.date_utc.isoformat(),
                "engagementRate": round(engagement_rate, 2)
            }
            
            recent_posts.append(post_data)
            post_count += 1
        
        # Calculate averages
        avg_likes = round(statistics.mean(likes_list)) if likes_list else 0
        avg_comments = round(statistics.mean(comments_list)) if comments_list else 0
        avg_views = round(statistics.mean(views_list)) if views_list else None
        
        # Prepare response
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
        raise HTTPException(status_code=429, detail="Too many requests. Please try again in a few minutes.")
    except instaloader.exceptions.InstaloaderException as e:
        raise HTTPException(status_code=500, detail=f"Instagram API error: {str(e)}")
    except Exception as e:
        print(f"Error analyzing profile {username}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze profile. Please try again.")


# Alternative lightweight endpoint without recent posts (faster)
@router.get("/api/analyze-instagram-quick/{username}")
async def analyze_instagram_profile_quick(username: str):
    """
    Quick analysis - profile stats only, no post data
    """
    try:
        L = instaloader.Instaloader()
        L.context.quiet = True
        
        try:
            profile = instaloader.Profile.from_username(L.context, username)
        except instaloader.exceptions.ProfileNotExistsException:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        if profile.is_private:
            raise HTTPException(status_code=403, detail="Profile is private")
        
        # Get just first 5 posts for quick averages
        likes_list = []
        comments_list = []
        
        post_count = 0
        for post in profile.get_posts():
            if post_count >= 5:
                break
            likes_list.append(post.likes)
            comments_list.append(post.comments)
            post_count += 1
        
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