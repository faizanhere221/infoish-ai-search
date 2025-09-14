# vector-backend/api_routes.py - UPDATED WITH API KEY MANAGEMENT
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine, desc, func, text
from typing import Optional, List
from database import get_db, Influencer, User
from auth import AuthService  # Your existing auth service
from services.hybrid_search_service import HybridSearchService
from pydantic import BaseModel
import logging
import os
import time
from services.api_key_service import APIKeyService
from pydantic import BaseModel
API_KEY_SYSTEM_AVAILABLE = True

# Import the new API key management components
try:
    from models.api_keys import APIKey, APIUsage
    from services.api_key_service import APIKeyService
    API_KEY_SYSTEM_AVAILABLE = True
except ImportError:
    print("⚠️ API Key system not yet set up - some endpoints will be limited")
    API_KEY_SYSTEM_AVAILABLE = False

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.ypdspiwxsojwjzbagaip:databasepassword9876543211212@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres")

class CreateAPIKeyRequest(BaseModel):
    key_name: str

# API Key Authentication Dependency
async def get_current_api_user(
    request: Request, 
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
):
    """Authenticate requests using API key for external API access"""
    # Remove the API_KEY_SYSTEM_AVAILABLE check that's causing the 503 error
    
    api_key = credentials.credentials
    api_secret = request.headers.get("X-API-Secret")
    
    key_record, error = APIKeyService.validate_api_key(db, api_key, api_secret)
    if error:
        raise HTTPException(status_code=401, detail=error)
    
    # Check rate limits
    if not APIKeyService.check_rate_limit(db, key_record):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Return simplified user object
    user = {"id": key_record["user_id"]}
    
    return user, key_record

# Optional user authentication for web interface
async def get_current_user_optional(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Optional user authentication - won't fail if no auth"""
    if not authorization:
        return None
    
    try:
        if not authorization.startswith("Bearer "):
            return None
            
        token = authorization.split(" ")[1]
        
        # FIXED: Use the correct method and parameters
        from fastapi.security import HTTPAuthorizationCredentials
        from fastapi import HTTPException
        
        # Create credentials object that AuthService.get_current_user expects
        credentials = type('obj', (object,), {'credentials': token})()
        
        # Use the existing get_current_user method
        user = AuthService.get_current_user(credentials, db)
        return user
        
    except HTTPException:
        # If authentication fails, return None (optional auth)
        return None
    except Exception as e:
        logging.warning(f"Auth failed: {e}")
        return None

# ================================
# API KEY MANAGEMENT ENDPOINTS
# ================================

@router.post("/api-keys")
async def create_api_key(
    request: CreateAPIKeyRequest,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Create new API key for Pro users"""
    if not API_KEY_SYSTEM_AVAILABLE:
        raise HTTPException(status_code=503, detail="API key system not available")
    
    if current_user.subscription_tier != "pro":
        raise HTTPException(
            status_code=403, 
            detail="API access requires Pro subscription (PKR 6,999/month)"
        )
    
    try:
        api_key = APIKeyService.create_api_key(
            db=db,
            user_id=current_user.id,
            key_name=request.key_name,
            subscription_tier=current_user.subscription_tier
        )
        
        return {
            "id": api_key.id,
            "key_name": api_key.key_name,
            "api_key": api_key.api_key,
            "api_secret": api_key.api_secret,  # Only returned once
            "monthly_limit": api_key.monthly_limit,
            "rate_limit_per_minute": api_key.rate_limit_per_minute,
            "created_at": api_key.created_at.isoformat(),
            "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api-keys")
async def list_api_keys(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """List user's API keys"""
    if not API_KEY_SYSTEM_AVAILABLE:
        return {"api_keys": []}
    
    keys = db.query(APIKey).filter(APIKey.user_id == current_user.id).all()
    
    return {
        "api_keys": [
            {
                "id": key.id,
                "key_name": key.key_name,
                "api_key": key.api_key[:8] + "..." + key.api_key[-4:],  # Masked
                "monthly_requests": key.monthly_requests,
                "monthly_limit": key.monthly_limit,
                "is_active": key.is_active,
                "last_used": key.last_used.isoformat() if key.last_used else None,
                "created_at": key.created_at.isoformat()
            }
            for key in keys
        ]
    }

@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke/deactivate API key"""
    if not API_KEY_SYSTEM_AVAILABLE:
        raise HTTPException(status_code=503, detail="API key system not available")
    
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    api_key.is_active = False
    db.commit()
    
    return {"message": "API key revoked successfully"}

@router.get("/api-usage")
async def get_api_usage(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Get API usage statistics"""
    if not API_KEY_SYSTEM_AVAILABLE:
        return {"total_requests": 0, "api_keys": [], "period_days": days}
    
    stats = APIKeyService.get_api_usage_stats(db, current_user.id, days)
    return stats

# ================================
# EXTERNAL API ENDPOINTS (for agencies)
# ================================

@router.get("/api/v1/search")
async def external_api_search(
    request: Request,
    db: Session = Depends(get_db),
    user_and_key = Depends(get_current_api_user),
    query: Optional[str] = Query(None, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Results per page")
):
    """External API endpoint for influencer search - requires API key"""
    print(f"🔍 API Search called with query: {query}")
    
    user, api_key = user_and_key
    print(f"✅ Authentication successful for user: {user}")
    
    try:
        print("🚀 Starting search...")
        
        # Simple direct database query first (skip hybrid search for now)
        results = db.execute(text("""
            SELECT id, username, full_name, category, total_followers, verified
            FROM influencers 
            WHERE category ILIKE '%tech%' OR username ILIKE '%tech%'
            LIMIT :limit
        """), {"limit": limit}).fetchall()
        
        print(f"📊 Found {len(results)} results")
        
        formatted_results = []
        for row in results:
            formatted_results.append({
                "id": row[0],
                "username": row[1],
                "full_name": row[2],
                "category": row[3],
                "total_followers": row[4],
                "verified": row[5]
            })
        
        return {
            "success": True,
            "results": formatted_results,
            "total": len(formatted_results),
            "query": query
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/v1/stats")
async def external_api_stats(
    request: Request,
    db: Session = Depends(get_db),
    user_and_key = Depends(get_current_api_user)
):
    """Get database statistics via API"""
    user, api_key = user_and_key
    
    try:
        total_influencers = db.query(Influencer).count()
        verified_count = db.query(Influencer).filter(Influencer.verified == True).count()
        
        # Platform counts
        instagram_count = db.query(Influencer).filter(Influencer.instagram_handle.isnot(None)).count()
        youtube_count = db.query(Influencer).filter(Influencer.youtube_channel.isnot(None)).count()
        tiktok_count = db.query(Influencer).filter(Influencer.tiktok_handle.isnot(None)).count()
        
        # Category breakdown
        category_stats = db.query(
            Influencer.category, 
            func.count(Influencer.id)
        ).filter(
            Influencer.category.isnot(None)
        ).group_by(Influencer.category).order_by(func.count(Influencer.id).desc()).limit(10).all()
        
        # Log API usage
        if API_KEY_SYSTEM_AVAILABLE:
            APIKeyService.log_api_usage(
                db=db,
                api_key_record=api_key,
                endpoint="/api/v1/stats",
                method="GET",
                query_params={},
                status_code=200,
                results_count=1,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent")
            )
        
        return {
            "total_influencers": total_influencers,
            "verified_influencers": verified_count,
            "platform_presence": {
                "instagram": instagram_count,
                "youtube": youtube_count,
                "tiktok": tiktok_count
            },
            "categories": {cat: count for cat, count in category_stats},
            "last_updated": "2025-09-06"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# EXISTING WEB INTERFACE ENDPOINTS
# ================================

@router.get("/search/influencers")
async def search_influencers(
    query: str = Query("", description="Search query"),
    limit: int = Query(12, ge=1, le=500, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    platform: Optional[str] = Query(None, description="Platform filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    min_followers: Optional[int] = Query(None, ge=0, description="Minimum followers"),
    max_followers: Optional[int] = Query(None, ge=0, description="Maximum followers"),
    engagement_min: Optional[float] = Query(None, ge=0.0, le=100.0, description="Minimum engagement rate"),
    min_video_count: Optional[int] = Query(None, ge=0, description="Minimum video count"),
    min_total_views: Optional[int] = Query(None, ge=0, description="Minimum total views"),
    has_youtube_url: Optional[bool] = Query(None, description="Has YouTube URL"),
    verified: Optional[str] = Query(None, description="Verified status"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional)
):
    """Search for influencers - web interface endpoint"""
    try:
        logger.info(f"Search request - Query: '{query}', Offset: {offset}, Limit: {limit}")
        
        # Validate parameters
        if max_followers and min_followers and max_followers < min_followers:
            raise HTTPException(status_code=422, detail="max_followers must be greater than min_followers")
        
        if engagement_min and engagement_min > 100:
            raise HTTPException(status_code=422, detail="engagement_min cannot exceed 100%")

        # Build filters dict
        filters = {}
        if platform: filters['platform'] = platform.lower()
        if category: filters['category'] = category.lower()
        if min_followers: filters['min_followers'] = min_followers
        if max_followers: filters['max_followers'] = max_followers
        if engagement_min: filters['engagement_min'] = engagement_min
        if min_video_count: filters['min_video_count'] = min_video_count
        if min_total_views: filters['min_total_views'] = min_total_views
        if has_youtube_url is not None: filters['has_youtube_url'] = has_youtube_url
        if verified: filters['verified'] = verified.lower()

        # Initialize search service
        search_service = HybridSearchService(db)
        await search_service.initialize()

        # Perform search
        search_results = await search_service.hybrid_search(
            query=query,
            filters=filters,
            limit=limit,
            offset=offset
        )

        # CRITICAL: Add search count logging for authenticated users
        if current_user:
            try:
                # Check if user can search (for limits)
                if not AuthService.check_search_limit(current_user):
                    raise HTTPException(
                        status_code=429,
                        detail=f"Monthly search limit ({current_user.search_limit}) exceeded. Upgrade for unlimited searches."
                    )
                
                # Log the search and increment count
                AuthService.log_user_search(
                    db=db,
                    user=current_user,
                    query=query,
                    filters=filters,
                    results_count=len(search_results.get('results', [])),
                    search_time_ms=search_results.get('search_time_ms', 0)
                )
                
                logger.info(f"Search logged for user: {current_user.email}")
                
            except Exception as e:
                logger.error(f"Error logging search for user {current_user.email if current_user else 'None'}: {e}")

        logger.info(f"Search completed - Found: {search_results.get('total_found', 0)} total")

        # Apply result limits based on subscription tier
        results = search_results.get('results', [])
        if current_user and current_user.subscription_tier == 'free':
            # Limit free users to 5 results
            results = results[:5]
            
        return {
            "success": True,
            "results": results,
            "total": search_results.get('total_found', 0),
            "total_found": search_results.get('total_found', 0),
            "search_insights": search_results.get('search_insights', {}),
            "query": query,
            "filters_applied": filters,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "current_page": (offset // limit) + 1,
                "total_pages": (search_results.get('total_found', 0) + limit - 1) // limit
            },
            # Add user info for frontend updates
            "user_info": {
                "subscription_tier": current_user.subscription_tier if current_user else None,
                "searches_remaining": (current_user.search_limit - current_user.monthly_searches) if current_user and current_user.subscription_tier == 'free' else "unlimited",
                "results_shown": len(results),
                "results_limit": 5 if (current_user and current_user.subscription_tier == 'free') else 50
            } if current_user else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in search: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

# Keep all your existing endpoints (stats, youtube search, top influencers, etc.)
@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get enhanced database statistics with YouTube data"""
    # Your existing stats implementation
    return await get_existing_stats(db)

async def get_existing_stats(db: Session):
    """Your existing stats logic"""
    try:
        total_influencers = db.query(Influencer).count()
        verified_count = db.query(Influencer).filter(Influencer.verified == True).count()
        
        # Count by platform
        instagram_count = db.query(Influencer).filter(Influencer.instagram_handle.isnot(None)).count()
        youtube_count = db.query(Influencer).filter(Influencer.youtube_channel.isnot(None)).count()
        tiktok_count = db.query(Influencer).filter(Influencer.tiktok_handle.isnot(None)).count()
        
        return {
            "total_influencers": total_influencers,
            "verified_influencers": verified_count,
            "by_platform": {
                "instagram": instagram_count,
                "youtube": youtube_count,
                "tiktok": tiktok_count
            },
            "status": "live" if total_influencers > 0 else "demo_mode",
            "last_updated": "2025-09-06"
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Stats failed: {str(e)}")
    

@router.get("/api-keys")
async def list_api_keys(
    current_user=Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """List user's API keys"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    result = db.execute(text("""
        SELECT id, key_name, api_key, monthly_requests, monthly_limit, 
               is_active, created_at, last_used
        FROM api_keys WHERE user_id = :user_id
    """), {"user_id": current_user.id}).fetchall()
    
    return {
        "api_keys": [
            {
                "id": row[0],
                "key_name": row[1],
                "api_key": row[2][:8] + "..." + row[2][-4:],  # Masked
                "monthly_requests": row[3] or 0,
                "monthly_limit": row[4] or 50000,
                "is_active": row[5],
                "created_at": row[6].isoformat() if row[6] else None,
                "last_used": row[7].isoformat() if row[7] else None
            }
            for row in result
        ]
    }
    

@router.post("/api-keys")
async def create_api_key_authenticated(
    request: CreateAPIKeyRequest,
    current_user=Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Create API key for authenticated Pro users"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if current_user.subscription_tier != "pro":
        raise HTTPException(status_code=403, detail="API access requires Pro subscription (PKR 6,999/month)")
    
    try:
        api_key = APIKeyService.create_api_key(
            db=db,
            user_id=current_user.id,
            key_name=request.key_name,
            subscription_tier=current_user.subscription_tier
        )
        return api_key
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api-keys")
async def list_user_api_keys(
    current_user=Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """List user's API keys"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    result = db.execute(text("""
        SELECT id, key_name, api_key, monthly_requests, monthly_limit, 
               is_active, created_at, last_used
        FROM api_keys WHERE user_id = :user_id
    """), {"user_id": current_user.id}).fetchall()
    
    return {
        "api_keys": [
            {
                "id": row[0],
                "key_name": row[1],
                "api_key": row[2][:8] + "..." + row[2][-4:],  # Masked
                "monthly_requests": row[3] or 0,
                "monthly_limit": row[4] or 50000,
                "is_active": row[5],
                "created_at": row[6].isoformat() if row[6] else None,
                "last_used": row[7].isoformat() if row[7] else None
            }
            for row in result
        ]
    }


@router.post("/test-api-key")
async def test_create_api_key(db: Session = Depends(get_db)):
    """Test API key creation with real Pro user"""
    try:
        # Use the real Pro user from your data
        user_id = "wObARoa4SMm-XLY3VM8vOg"  # test@example.com (Pro user)
        
        # Create a test API key
        api_key = APIKeyService.create_api_key(
            db=db,
            user_id=user_id,
            key_name="Test Production API Key",
            subscription_tier="pro"
        )
        return {"status": "success", "api_key": api_key}
    except Exception as e:
        return {"status": "error", "message": str(e)}