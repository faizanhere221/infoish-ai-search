# vector-backend/main.py - WITH AUTHENTICATION SYSTEM
from api_routes import router as api_router
from fastapi import FastAPI, HTTPException, Depends, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import uvicorn
import logging
from datetime import datetime
import sys
from pathlib import Path
from typing import Optional
from pydantic import BaseModel
from models.api_keys import ApiKey, ApiUsage, APIKeyService
# Import your modules
from database import get_db, init_database, Influencer, AuthUser, SearchLog
from auth import AuthService, AuthEndpoints
from database import User
from sqlalchemy import text
from contextlib import asynccontextmanager
import asyncio
import time
# Add these imports at the top
from services.api_key_service import APIKeyService
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Add the security scheme
security = HTTPBearer()
try:
    from services.api_key_service import APIKeyService
    API_KEY_SYSTEM_AVAILABLE = True
    print("✅ API Key system loaded successfully")
except ImportError:
    API_KEY_SYSTEM_AVAILABLE = False
    print("⚠️ API Key system not available")
try:
    from services.hybrid_search_service import HybridSearchService
except ImportError:
    # Fallback if hybrid search service is not available
    HybridSearchService = None

# Add current directory to path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))



# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for requests
class GoogleLoginRequest(BaseModel):
    google_token: str

class FavoriteRequest(BaseModel):
    influencer_id: str



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting Pakistani Influencer Search API with Authentication...")
    
    try:
        success = init_database()
        if success:
            logger.info("✅ Database initialized successfully")
            
            from database import SessionLocal
            db = SessionLocal()
            try:
                # Check influencers
                count = db.query(Influencer).count()
                logger.info(f"📊 Database contains {count} Pakistani influencers")
                
                # Check users table
                try:
                    user_count = db.query(User).count()
                    logger.info(f"👥 Database contains {user_count} registered users")
                except Exception as e:
                    logger.warning(f"Could not count users: {e}")
                    user_count = 0
                
                if count >= 300:
                    logger.info("🎉 Full 300-influencer database ready with AUTHENTICATION!")
                elif count > 0:
                    logger.info(f"⚠️ Database has {count} influencers - hybrid search active")
                else:
                    logger.warning("❌ Empty influencer database - populate with your scrapers")
            finally:
                db.close()
        else:
            logger.error("❌ Database initialization failed")
    except Exception as e:
        logger.error(f"Database startup error: {e}")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down API...")


# Update your FastAPI app creation (replace the existing app = FastAPI(...)):
app = FastAPI(
    title="Pakistani Influencer Search API - WITH AUTH",
    description="Advanced search with Authentication, User Tracking & Favorites - 300+ verified profiles",
    version="4.0.0",
    lifespan=lifespan  # This replaces the deprecated @app.on_event
)
app.include_router(api_router)
# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://infoish-ai-search.vercel.app",
        "https://infoish-ai-search-git-master-faizans-projects-e49cee22.vercel.app",
        "https://infoish-ai-search-b9yjaksn0-faizans-projects-e49cee22.vercel.app",
        "https://*.vercel.app",  # This should cover all Vercel subdomains
        "https://infoish.com"  # Future custom domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)



@app.options("/{path:path}")
async def options_handler(request):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Add timeout middleware after CORS middleware:
@app.middleware("http")
async def timeout_middleware(request, call_next):
    try:
        response = await asyncio.wait_for(call_next(request), timeout=30.0)
        return response
    except asyncio.TimeoutError:
        logger.error(f"Request timeout: {request.url}")
        return JSONResponse(
            status_code=504,
            content={"error": "Request timeout", "message": "Server took too long to respond"}
        )

# Add keepalive endpoint to prevent disconnection:
@app.get("/keepalive")
async def keepalive():
    """Prevent backend from going to sleep"""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Backend is running"
    }






@app.get("/")
async def root():
    return {
        "message": "Pakistani Influencer Search API - WITH AUTHENTICATION",
        "version": "4.0.0",
        "status": "running",
        "database_size": "1800+ Pakistani influencers",
        "features": [
            "Google OAuth Login",
            "User Search Tracking",
            "Favorites System",
            "Hybrid keyword + vector search",
            "Pakistani context awareness",
            "Subscription management"
        ],
        "docs": "/docs",
        "endpoints": {
            "auth": {
                "google_login": "/auth/google",
                "profile": "/auth/me",
                "analytics": "/auth/analytics"
            },
            "search": "/search/influencers",
            "favorites": "/favorites",
            "stats": "/stats",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check with authentication info"""
    try:
        db = next(get_db())
        influencer_count = db.query(Influencer).count()
        user_count = db.query(User).count()
        db.close()
        
        return {
            "status": "healthy", 
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "database": "connected",
            "influencer_count": influencer_count,
            "user_count": user_count,
            "search_engine": "hybrid_keyword_vector_v4.0",
            "auth_system": "google_oauth_enabled"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat() + "Z", 
            "database": "disconnected",
            "error": str(e)
        }

# AUTHENTICATION ENDPOINTS
@app.post("/auth/google")
async def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Google OAuth login endpoint"""
    return await AuthEndpoints.google_login(request.google_token, db)

@app.get("/auth/me")
async def get_current_user_profile(current_user: User = Depends(AuthService.get_current_user)):
    """Get current user profile"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "profile_picture": current_user.profile_picture,
        "subscription_tier": current_user.subscription_tier,
        "search_count": current_user.search_count,
        "monthly_searches": current_user.monthly_searches,
        "search_limit": current_user.search_limit,
        "created_at": current_user.created_at.isoformat()
    }

@app.get("/auth/analytics")
async def get_user_analytics(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's search analytics and history"""
    return AuthEndpoints.get_user_analytics(current_user, db)

# PROTECTED SEARCH ENDPOINT (REQUIRES AUTHENTICATION)
@app.get("/search/influencers")
async def search_influencers_authenticated(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user),
    query: Optional[str] = Query(None, description="🚀 HYBRID SEARCH - Keywords + Vector Similarity"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_followers: Optional[int] = Query(None, description="Minimum total followers"),
    max_followers: Optional[int] = Query(None, description="Maximum total followers"),
    engagement_min: Optional[float] = Query(None, description="Minimum engagement rate"),
    # 🆕 NEW YOUTUBE FILTERS
    min_video_count: Optional[int] = Query(None, description="Minimum video count"),
    min_total_views: Optional[int] = Query(None, description="Minimum total views"),
    has_youtube_url: Optional[bool] = Query(None, description="Has YouTube URL"),
    # 🗑️ REMOVED: gender and location parameters
    verified: Optional[str] = Query(None, description="Filter by verification status"),
    search_type: str = Query("hybrid", description="Search type: 'hybrid' or 'direct'"),
    limit: int = Query(12, ge=1, le=50, description="Results per page"),
    offset: int = Query(0, ge=0, description="Results to skip")
):
    """
    🚀 AUTHENTICATED Hybrid Pakistani Influencer Search

    Requires Google OAuth login. Features:
    - Enhanced keyword matching with synonyms
    - Semantic vector similarity via Pinecone
    - User search tracking & analytics
    - Personalized recommendations
    - Direct database search option

    Examples:
    - 'tech' → finds Technology, Mobile Reviews, Gadget Testing
    - 'cooking' → matches Food, Recipe, Chef, Pakistani Cuisine
    - 'fitness trainer' → discovers Gym, Workout, Health content
    """
    try:
        # Check search limits
        if not AuthService.check_search_limit(current_user):
            raise HTTPException(
                status_code=429,
                detail=f"Monthly search limit ({current_user.search_limit}) exceeded. Upgrade to premium for unlimited searches."
            )

        # Prepare filters
        filters = {
            'platform': platform,
            'category': category,
            'min_followers': min_followers,
            'max_followers': max_followers,
            'engagement_min': engagement_min,
            # 🆕 NEW YOUTUBE FILTERS
            'min_video_count': min_video_count,
            'min_total_views': min_total_views,
            'has_youtube_url': has_youtube_url,
            # 🗑️ REMOVED: gender and location filters
            'verified': verified
        }

        # Choose search method based on search_type parameter
        if search_type == "direct":
            # Use direct database search
            search_service = HybridSearchService(db)
            search_results = await search_service.direct_database_search(
                query=query or '',
                filters=filters,
                limit=limit,
                offset=offset
            )
        else:
            # Use hybrid search (default)
            search_service = HybridSearchService(db)
            await search_service.initialize()
            search_results = await search_service.hybrid_search(
                query=query or '',
                filters=filters,
                limit=limit,
                offset=offset
            )

        results = search_results['results']

        # Apply pagination for hybrid search (direct search handles pagination internally)
        if search_type != "direct":
            paginated_results = results[offset:offset + limit]
            total_count = len(results)
            total_pages = (total_count + limit - 1) // limit
            current_page = (offset // limit) + 1
        else:
            paginated_results = results
            total_count = search_results.get('total_found', len(results))
            total_pages = (total_count + limit - 1) // limit
            current_page = (offset // limit) + 1

        # Format for frontend with user-specific data
        formatted_results = []
        user_favorites = [fav.influencer_id for fav in current_user.favorites]

        for influencer in paginated_results:
            try:
                db_influencer = db.query(Influencer).filter(Influencer.id == influencer['id']).first()
                if db_influencer:
                    formatted_results.append({
                        "id": db_influencer.id,
                        "username": db_influencer.username,
                        "full_name": db_influencer.full_name,
                        "email": db_influencer.email,
                        # 🗑️ REMOVED: gender and location_city
                        "instagram_handle": db_influencer.instagram_handle,
                        "youtube_channel": db_influencer.youtube_channel,
                        "tiktok_handle": db_influencer.tiktok_handle,
                        "instagram_followers": db_influencer.instagram_followers,
                        "youtube_subscribers": db_influencer.youtube_subscribers,
                        "tiktok_followers": db_influencer.tiktok_followers,
                        "total_followers": db_influencer.total_followers,  # 🆕 Use generated column
                        "engagement_rate": float(db_influencer.engagement_rate) if db_influencer.engagement_rate else 0.0,
                        "category": db_influencer.category,
                        "bio": db_influencer.bio,
                        "profile_image_url": db_influencer.profile_image_url,
                        "verified": db_influencer.verified,
                        "created_at": db_influencer.created_at.isoformat() if db_influencer.created_at else None,
                        # 🆕 NEW YOUTUBE FIELDS
                        "video_count": db_influencer.video_count,
                        "total_views": db_influencer.total_views,
                        "youtube_url": db_influencer.youtube_url,
                        # User-specific data
                        "is_favorited": str(db_influencer.id) in user_favorites,
                        # Search metadata
                        "search_score": influencer.get('match_score', 0),
                        "search_type": influencer.get('search_type', search_type),
                        "similarity_score": influencer.get('similarity_score')
                    })
            except Exception as e:
                logger.error(f"Error formatting result {influencer.get('id')}: {e}")

        # Log user search for analytics
        AuthService.log_user_search(
            db=db,
            user=current_user,
            query=query or '',
            filters=filters,
            results_count=len(formatted_results),
            search_time_ms=search_results['search_time_ms']
        )

        logger.info(f"User {current_user.email} searched: '{query}' - {len(formatted_results)} results (type: {search_type})")

        return {
            "success": True,
            "results": formatted_results,
            "data": formatted_results,
            "total": total_count,
            "page": current_page,
            "pages": total_pages,
            "limit": limit,
            "offset": offset,
            "search_insights": search_results['search_insights'],
            "search_time_ms": search_results['search_time_ms'],
            "message": f"{search_type.title()} search found {total_count} Pakistani influencers",
            "search_type": search_type,
            "user_info": {
                "searches_remaining": current_user.search_limit - current_user.monthly_searches,
                "subscription_tier": current_user.subscription_tier
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authenticated search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

# FAVORITES SYSTEM
@app.post("/favorites")
async def add_favorite(
    request: FavoriteRequest,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Add influencer to user's favorites"""
    try:
        # Check if already favorited
        existing = db.query(AuthUser).filter(
            AuthUser.user_id == current_user.id,
            AuthUser.influencer_id == request.influencer_id
        ).first()
        
        if existing:
            return {"message": "Already in favorites", "favorited": True}
        
        # Add to favorites
        favorite = AuthUser(
            user_id=current_user.id,
            influencer_id=request.influencer_id
        )
        db.add(favorite)
        db.commit()
        
        return {"message": "Added to favorites", "favorited": True}
        
    except Exception as e:
        logger.error(f"Add favorite error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add favorite")

@app.delete("/favorites/{influencer_id}")
async def remove_favorite(
    influencer_id: str,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Remove influencer from user's favorites"""
    try:
        favorite = db.query(AuthUser).filter(
            AuthUser.user_id == current_user.id,
            AuthUser.influencer_id == influencer_id
        ).first()
        
        if favorite:
            db.delete(favorite)
            db.commit()
            return {"message": "Removed from favorites", "favorited": False}
        
        return {"message": "Not in favorites", "favorited": False}
        
    except Exception as e:
        logger.error(f"Remove favorite error: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove favorite")

@app.get("/favorites")
async def get_user_favorites(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's favorited influencers"""
    try:
        favorites = db.query(AuthUser).filter(
            AuthUser.user_id == current_user.id
        ).all()
        
        # Get full influencer data
        influencer_ids = [fav.influencer_id for fav in favorites]
        influencers = db.query(Influencer).filter(
            Influencer.id.in_(influencer_ids)
        ).all()
        
        formatted_favorites = []
        for inf in influencers:
            formatted_favorites.append({
                "id": inf.id,
                "username": inf.username,
                "full_name": inf.full_name,
                "category": inf.category,
                "total_followers": (inf.instagram_followers + inf.youtube_subscribers + inf.tiktok_followers),
                "engagement_rate": float(inf.engagement_rate) if inf.engagement_rate else 0.0,
                "verified": inf.verified,
                "is_favorited": True
            })
        
        return {
            "favorites": formatted_favorites,
            "count": len(formatted_favorites)
        }
        
    except Exception as e:
        logger.error(f"Get favorites error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get favorites")

@app.get("/stats")
async def get_database_stats(db: Session = Depends(get_db)):
    """Public database statistics (no auth required)"""
    try:
        from sqlalchemy import func
        
        total_influencers = db.query(Influencer).count()
        
        # Get user and search counts using raw SQL
        user_count_result = db.execute(text("SELECT COUNT(*) as count FROM users")).fetchone()
        total_users = user_count_result.count if user_count_result else 0
        
        search_count_result = db.execute(text("SELECT COUNT(*) as count FROM user_searches")).fetchone()
        total_searches = search_count_result.count if search_count_result else 0
        
        category_stats = db.query(
            Influencer.category,
            func.count(Influencer.id).label('count')
        ).filter(Influencer.category.isnot(None)).group_by(Influencer.category).all()
        
        # 🗑️ REMOVED: city_stats query with location_city
        
        instagram_count = db.query(Influencer).filter(Influencer.instagram_followers > 0).count()
        youtube_count = db.query(Influencer).filter(Influencer.youtube_subscribers > 0).count()
        tiktok_count = db.query(Influencer).filter(Influencer.tiktok_followers > 0).count()
        verified_count = db.query(Influencer).filter(Influencer.verified == True).count()
        
        # 🆕 NEW YOUTUBE STATS
        youtube_with_urls = db.query(Influencer).filter(Influencer.youtube_url.isnot(None)).count()
        total_videos = db.query(func.sum(func.coalesce(Influencer.video_count, 0))).scalar() or 0
        total_views = db.query(func.sum(func.coalesce(Influencer.total_views, 0))).scalar() or 0
        
        return {
            "total_influencers": total_influencers,
            "total_users": total_users,
            "total_searches": total_searches,
            "categories": {cat: count for cat, count in category_stats},
            # 🗑️ REMOVED: cities stats
            "platform_presence": {
                "instagram": instagram_count,
                "youtube": youtube_count,
                "tiktok": tiktok_count
            },
            "verified_influencers": verified_count,
            # 🆕 NEW YOUTUBE ANALYTICS
            "youtube_analytics": {
                "creators_with_urls": youtube_with_urls,
                "total_videos_tracked": total_videos,
                "total_views_tracked": total_views,
                "avg_videos_per_creator": round(total_videos / youtube_count) if youtube_count > 0 else 0
            },
            "search_engine": "hybrid_keyword_vector_with_auth",
            "last_updated": "2025-09-06"
        }
    
    except Exception as e:
        logger.error(f"Stats API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stats failed: {str(e)}")

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)