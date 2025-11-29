# vector-backend/main.py - WITH AUTHENTICATION SYSTEM
from api_routes import router as api_router
from fastapi import FastAPI, HTTPException, Depends, Query, Body, status  # ✅ Added 'status'
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from contextlib import asynccontextmanager
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from passlib.context import CryptContext
from jose import JWTError, jwt  # ✅ Added for JWT handling
from datetime import datetime, timedelta  # ✅ Added 'timedelta'
from typing import Optional
from pathlib import Path
import uvicorn
from services.email_service import email_service
import logging
import sys
import asyncio
import time
import uuid
import hashlib
import secrets  # ✅ Added for secure random generation
import os  # ✅ Added for environment variables
import random
from instagram_analyzer_router import router as instagram_router


# Import your modules
from database import get_db, init_database, Influencer, InfluencerAuth, AuthUser, SearchLog, User  # ✅ Added 'InfluencerAuth'
from auth import AuthService, AuthEndpoints
from models.api_keys import ApiKey, ApiUsage, APIKeyService

# Add these imports at the top
from services.api_key_service import APIKeyService

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

# ✅ JWT Configuration (ADD THIS)
SECRET_KEY = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic models for requests
class GoogleLoginRequest(BaseModel):
    google_token: str

class FavoriteRequest(BaseModel):
    influencer_id: str

# Pydantic models for influencer auth
class InfluencerLoginRequest(BaseModel):
    email: EmailStr
    password: str

class InfluencerUpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    category: Optional[str] = None
    instagram_handle: Optional[str] = None
    instagram_followers: Optional[int] = None
    youtube_channel: Optional[str] = None
    youtube_subscribers: Optional[int] = None
    youtube_url: Optional[str] = None
    tiktok_handle: Optional[str] = None
    tiktok_followers: Optional[int] = None
    profile_image_url: Optional[str] = None
    engagement_rate: Optional[float] = None





# Helper functions for influencer auth
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_influencer_access_token(influencer_id: str, email: str) -> str:
    """Create JWT token for influencer"""
    data = {
        "sub": email,
        "influencer_id": influencer_id,
        "type": "influencer"  # Distinguish from brand user tokens
    }
    return AuthService.create_access_token(data)

def verify_influencer_token(token: str) -> Optional[dict]:
    """Verify influencer JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        influencer_id: str = payload.get("influencer_id")
        token_type: str = payload.get("type")
        
        if email is None or influencer_id is None or token_type != "influencer":
            return None
        
        return {"email": email, "influencer_id": influencer_id}
    except JWTError:
        return None

def get_current_influencer(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated influencer"""
    from database import Influencer, InfluencerAuth
    
    token = credentials.credentials
    token_data = verify_influencer_token(token)
    
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get influencer from database
    influencer = db.query(Influencer).filter(
        Influencer.id == token_data["influencer_id"]
    ).first()
    
    if not influencer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Influencer not found"
        )
    
    # Check if account is active
    auth_record = db.query(InfluencerAuth).filter(
        InfluencerAuth.id == influencer.id
    ).first()
    
    if not auth_record or not auth_record.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    return influencer




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
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",  # Add this line
    "https://infoishai.com",
    "https://www.infoishai.com",
    "https://infoish-ai-search.vercel.app",
],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)





#for instagram analyzer
app.include_router(instagram_router, prefix="/api")




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
    """Quick health check without database query"""
    return {
        "status": "healthy", 
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "backend": "running",
        "port": 8000,
        "message": "Backend is operational"
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

@app.post("/auth/google/callback")
async def google_oauth_callback(request: dict, db: Session = Depends(get_db)):
    """Handle OAuth callback with authorization code"""
    try:
        import os
        import requests as http_requests
        from google.oauth2 import id_token
        from google.auth.transport import requests
        
        code = request.get('code')
        redirect_uri = request.get('redirect_uri')
        
        if not code:
            raise HTTPException(status_code=400, detail="No authorization code provided")
        
        # Exchange code for tokens
        token_response = http_requests.post('https://oauth2.googleapis.com/token', data={
            'code': code,
            'client_id': os.getenv('GOOGLE_CLIENT_ID'),
            'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'), 
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        })
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to exchange code for tokens: {token_response.text}")
        
        tokens = token_response.json()
        
        if 'id_token' not in tokens:
            raise HTTPException(status_code=400, detail="No ID token received from Google")
        
        # Verify the ID token
        user_info = id_token.verify_oauth2_token(
            tokens['id_token'], 
            requests.Request(), 
            os.getenv('GOOGLE_CLIENT_ID')
        )
        
        # Use your existing user creation logic
        auth_result = await AuthEndpoints.google_login(tokens['id_token'], db)
        
        # Return the result from your existing auth system
        return auth_result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"OAuth callback error: {e}")
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")



# Add this endpoint to your main.py file

@app.post("/auth/logout")
async def logout_user(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user and invalidate session"""
    try:
        # Update user's last logout time (optional)
        auth_user = db.query(AuthUser).filter(AuthUser.id == current_user.id).first()
        if auth_user:
            auth_user.last_logout = datetime.utcnow()
            db.commit()
        
        logger.info(f"User logged out: {current_user.email}")
        
        return {
            "message": "Logout successful",
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {
            "message": "Logout completed",
            "status": "success"  # Always return success for logout
        }


@app.get("/auth/limits")
async def get_user_limits(current_user: User = Depends(AuthService.get_current_user)):
    """Get user's current search limits and usage"""
    subscription_tier = getattr(current_user, 'subscription_tier', 'free')
    monthly_searches = getattr(current_user, 'monthly_searches', 0)
    search_limit = getattr(current_user, 'search_limit', 15)
    
    # Calculate limits based on tier
    results_limit = 5 if subscription_tier == 'free' else 50
    can_export = subscription_tier in ['starter', 'pro', 'developer']
    can_use_api = subscription_tier in ['pro', 'developer']
    
    return {
        "subscription_tier": subscription_tier,
        "searches_used": monthly_searches,
        "searches_limit": search_limit,
        "results_limit": results_limit,
        "can_export": can_export,
        "can_use_api": can_use_api,
        "is_unlimited": subscription_tier in ['pro', 'developer', 'premium']
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
    min_video_count: Optional[int] = Query(None, description="Minimum video count"),
    min_total_views: Optional[int] = Query(None, description="Minimum total views"),
    has_youtube_url: Optional[bool] = Query(None, description="Has YouTube URL"),
    verified: Optional[str] = Query(None, description="Filter by verification status"),
    search_type: str = Query("hybrid", description="Search type: 'hybrid' or 'direct'"),
    limit: int = Query(12, ge=1, le=50, description="Results per page"),
    offset: int = Query(0, ge=0, description="Results to skip")
):
    try:
        # Check search limits FIRST
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
            'min_video_count': min_video_count,
            'min_total_views': min_total_views,
            'has_youtube_url': has_youtube_url,
            'verified': verified
        }

        # Perform search
        if search_type == "direct":
            search_service = HybridSearchService(db)
            search_results = await search_service.direct_database_search(
                query=query or '',
                filters=filters,
                limit=limit,
                offset=offset
            )
        else:
            search_service = HybridSearchService(db)
            await search_service.initialize()
            search_results = await search_service.hybrid_search(
                query=query or '',
                filters=filters,
                limit=limit,
                offset=offset
            )

        results = search_results['results']

        # Apply pagination for hybrid search
        if search_type != "direct":
            paginated_results = results[offset:offset + limit]
            total_count = len(results)
        else:
            paginated_results = results
            total_count = search_results.get('total_found', len(results))

        # ========================================
        # CRITICAL FIX: Apply subscription limits BEFORE formatting
        # ========================================
        subscription_tier = getattr(current_user, 'subscription_tier', 'free')
        
        # Apply free tier limits
        if subscription_tier == 'free':
            paginated_results = paginated_results[:5]  # Limit to 5 results
            logger.info(f"Free user {current_user.email} limited to 5 results")
        
        # Calculate pagination info AFTER limiting
        total_pages = (total_count + limit - 1) // limit
        current_page = (offset // limit) + 1

        # Format results for frontend
        formatted_results = []
        user_favorites = [fav.influencer_id for fav in current_user.favorites] if hasattr(current_user, 'favorites') else []
        
        for influencer in paginated_results:
            try:
                db_influencer = db.query(Influencer).filter(Influencer.id == influencer['id']).first()
                if db_influencer:
                    formatted_results.append({
                        "id": db_influencer.id,
                        "username": db_influencer.username,
                        "full_name": db_influencer.full_name,
                        "email": db_influencer.email,
                        "instagram_handle": db_influencer.instagram_handle,
                        "youtube_channel": db_influencer.youtube_channel,
                        "tiktok_handle": db_influencer.tiktok_handle,
                        "instagram_followers": db_influencer.instagram_followers,
                        "youtube_subscribers": db_influencer.youtube_subscribers,
                        "tiktok_followers": db_influencer.tiktok_followers,
                        "total_followers": db_influencer.total_followers,
                        "engagement_rate": float(db_influencer.engagement_rate) if db_influencer.engagement_rate else 0.0,
                        "category": db_influencer.category,
                        "bio": db_influencer.bio,
                        "profile_image_url": db_influencer.profile_image_url,
                        "verified": db_influencer.verified,
                        "created_at": db_influencer.created_at.isoformat() if db_influencer.created_at else None,
                        "video_count": db_influencer.video_count,
                        "total_views": db_influencer.total_views,
                        "youtube_url": db_influencer.youtube_url,
                        "is_favorited": str(db_influencer.id) in user_favorites,
                        "search_score": influencer.get('match_score', 0),
                        "search_type": influencer.get('search_type', search_type),
                        "similarity_score": influencer.get('similarity_score')
                    })
            except Exception as e:
                logger.error(f"Error formatting result {influencer.get('id')}: {e}")

        # Add upgrade message for free users
        upgrade_message = None
        if subscription_tier == 'free' and len(formatted_results) == 5:
            upgrade_message = "Upgrade to see more results! Free accounts are limited to 5 results per search."

        # Log user search for analytics
        AuthService.log_user_search(
            db=db,
            user=current_user,
            query=query or '',
            filters=filters,
            results_count=len(formatted_results),
            search_time_ms=search_results['search_time_ms']
        )

        logger.info(f"User {current_user.email} ({subscription_tier}) searched: '{query}' - {len(formatted_results)} results returned")

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
            "upgrade_message": upgrade_message,
            "user_info": {
                "searches_remaining": current_user.search_limit - current_user.monthly_searches if subscription_tier not in ['developer', 'pro'] else "unlimited",
                "subscription_tier": subscription_tier,
                "results_shown": len(formatted_results),
                "results_limit": 5 if subscription_tier == 'free' else 180,
                "monthly_searches": current_user.monthly_searches  # Add this for frontend updates
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







# Pydantic model for influencer registration
class InfluencerRegistrationRequest(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    bio: Optional[str] = None
    category: str
    instagram_handle: Optional[str] = None
    instagram_followers: int = 0
    youtube_channel: Optional[str] = None
    youtube_subscribers: int = 0
    youtube_url: Optional[str] = None
    video_count: int = 0
    total_views: int = 0
    tiktok_handle: Optional[str] = None
    tiktok_followers: int = 0
    total_followers: Optional[int] = None  # Database auto-calculates this
    profile_image_url: Optional[str] = None
    engagement_rate: float = 0.0
    source: str = "self_registered"
    verified: bool = False

    @model_validator(mode='after')
    def validate_minimum_followers(self) -> 'InfluencerRegistrationRequest':
        """Validate total followers across all platforms"""
        instagram = self.instagram_followers or 0
        youtube = self.youtube_subscribers or 0
        tiktok = self.tiktok_followers or 0
        
        total = instagram + youtube + tiktok
        
        if total < 1000:
            raise ValueError(f'Minimum 1,000 total followers required. Current total: {total}')
        
        # At least one platform required
        if not self.instagram_handle and not self.youtube_channel and not self.tiktok_handle:
            raise ValueError('At least one social media platform is required')
        
        return self

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v or len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not v.replace('_', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.lower().strip()

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not v or '@' not in v:
            raise ValueError('Valid email address required')
        return v.lower().strip()

    @field_validator('category')
    @classmethod
    def validate_category(cls, v: str) -> str:
        valid_categories = [
            'beauty', 'tech', 'food', 'gaming', 'comedy', 'travel', 'fitness',
            'music', 'lifestyle', 'business', 'education', 'news', 'fashion', 'general'
        ]
        if v.lower() not in valid_categories:
            raise ValueError(f'Category must be one of: {", ".join(valid_categories)}')
        return v.lower()


# Replace your existing @app.post("/influencers/register") with this COMPLETE version:

@app.post("/influencers/register")
async def register_influencer(
    request: InfluencerRegistrationRequest,
    db: Session = Depends(get_db)
):
    """Register a new influencer profile (self-registration) with automatic auth setup"""
    try:
        from database import Influencer, InfluencerAuth
        import hashlib
        import time
        
        logger.info(f"🔵 Registration attempt for: {request.username} ({request.email})")
        
        # 🔵 1. Check if username already exists
        existing_username = db.query(Influencer).filter(
            Influencer.username == request.username
        ).first()
        
        if existing_username:
            logger.warning(f"❌ Username already exists: {request.username}")
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # 🔵 2. Check if email already exists
        existing_email = db.query(Influencer).filter(
            Influencer.email == request.email
        ).first()
        
        if existing_email:
            logger.warning(f"❌ Email already exists: {request.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # 🔵 3. Validate minimum followers (1,000 total)
        total_followers = (
            (request.instagram_followers or 0) + 
            (request.youtube_subscribers or 0) + 
            (request.tiktok_followers or 0)
        )
        
        if total_followers < 1000:
            logger.warning(f"❌ Insufficient followers: {total_followers}")
            raise HTTPException(
                status_code=400, 
                detail=f"Minimum 1,000 total followers required. You have {total_followers}"
            )
        
        logger.info(f"✅ Validation passed - {total_followers} total followers")
        
        # 🔵 4. Generate unique influencer ID
        timestamp = str(time.time())
        unique_string = f"{request.username}_{request.email}_{timestamp}"
        hash_object = hashlib.sha256(unique_string.encode())
        unique_id = f"inf_{hash_object.hexdigest()[:16]}"
        
        logger.info(f"🔵 Generated ID: {unique_id}")
        
        # 🔵 5. Generate temporary password (bcrypt-safe)

        import secrets
        temp_password = f"{request.username[:8].lower()}{secrets.randbelow(9000) + 1000}"
       
       

        logger.info(f"🔵 Temporary password generated: {temp_password[:5]}...")
        
        # 🔵 6. Hash the password for storage
        hashed_password = hash_password(temp_password)
        
        # 🔵 7. Insert into influencers table using RAW SQL
        # (CRITICAL: Avoid SQLAlchemy ORM to bypass GENERATED column issue)
        insert_influencer_query = text("""
            INSERT INTO influencers (
                id, username, full_name, email, bio, category,
                instagram_handle, instagram_followers,
                youtube_channel, youtube_subscribers, youtube_url,
                video_count, total_views,
                tiktok_handle, tiktok_followers,
                profile_image_url, engagement_rate,
                source, verified, created_at, updated_at
            ) VALUES (
                :id, :username, :full_name, :email, :bio, :category,
                :instagram_handle, :instagram_followers,
                :youtube_channel, :youtube_subscribers, :youtube_url,
                :video_count, :total_views,
                :tiktok_handle, :tiktok_followers,
                :profile_image_url, :engagement_rate,
                :source, :verified, NOW(), NOW()
            )
        """)
        
        db.execute(insert_influencer_query, {
            "id": unique_id,
            "username": request.username,
            "full_name": request.full_name,
            "email": request.email,
            "bio": request.bio,
            "category": request.category.lower() if request.category else "general",
            "instagram_handle": request.instagram_handle,
            "instagram_followers": request.instagram_followers or 0,
            "youtube_channel": request.youtube_channel,
            "youtube_subscribers": request.youtube_subscribers or 0,
            "youtube_url": request.youtube_url,
            "video_count": request.video_count or 0,
            "total_views": request.total_views or 0,
            "tiktok_handle": request.tiktok_handle,
            "tiktok_followers": request.tiktok_followers or 0,
            "profile_image_url": request.profile_image_url,
            "engagement_rate": request.engagement_rate or 0.0,
            "source": "self_registered",
            "verified": False
        })
        
        logger.info(f"✅ Influencer record created in database")
        
        # 🔵 7b. Insert into influencer_auth table
        insert_auth_query = text("""
            INSERT INTO influencer_auth (
                id, email, password_hash, is_active, email_verified,
                created_at, updated_at
            ) VALUES (
                :id, :email, :password_hash, TRUE, FALSE,
                NOW(), NOW()
            )
        """)
        
        db.execute(insert_auth_query, {
            "id": unique_id,
            "email": request.email,
            "password_hash": hashed_password
        })
        
        logger.info(f"✅ Auth record created for influencer")
        
        # 🔵 8. Commit all changes
        db.commit()
        logger.info(f"✅ Transaction committed")
        
        # 🔵 9. Fetch the created influencer using RAW SQL
        fetch_query = text("""
            SELECT id, username, full_name, email, category, 
                   total_followers, created_at
            FROM influencers
            WHERE id = :id
        """)
        
        result = db.execute(fetch_query, {"id": unique_id}).fetchone()
        
        if not result:
            logger.error(f"❌ Could not fetch created influencer")
            raise HTTPException(status_code=500, detail="Registration failed")
        
        # Convert result to dict
        new_influencer_data = {
            "id": result.id,
            "username": result.username,
            "full_name": result.full_name,
            "email": result.email,
            "category": result.category,
            "total_followers": result.total_followers,
            "created_at": result.created_at
        }

        logger.info(f"✅ Registration complete: {request.username} - {new_influencer_data['total_followers']} followers")

        # 🆕 10. Send welcome email with credentials
        email_sent = False
        try:
            email_sent = email_service.send_welcome_email(
                email=request.email,
                username=request.username,
                full_name=request.full_name,
                temp_password=temp_password
            )
            
            if email_sent:
                logger.info(f"✅ Welcome email sent to {request.email}")
            else:
                logger.warning(f"⚠️ Welcome email failed (non-critical)")
                # Don't fail registration if email fails
                
        except Exception as email_error:
            logger.error(f"⚠️ Email error (non-critical): {email_error}")
            # Continue with registration even if email fails

        # 🔵 11. Return success with temporary credentials
        return {
            "success": True,
            "message": "Registration successful! Check your email for login credentials.",
            "influencer": {
                "id": new_influencer_data["id"],
                "username": new_influencer_data["username"],
                "full_name": new_influencer_data["full_name"],
                "email": new_influencer_data["email"],
                "category": new_influencer_data["category"],
                "total_followers": new_influencer_data["total_followers"],
                "created_at": new_influencer_data["created_at"].isoformat()
            },
            "temporary_credentials": {
                "email": request.email,
                "temporary_password": temp_password,
                "message": "Save this password! You'll need it to login."
            },
            "email_sent": email_sent,
            "next_step": {
                "action": "login",
                "url": "/influencer/login",
                "instruction": "Check your email for your temporary password, then login to your dashboard."
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Influencer registration error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.get("/influencers/check-username/{username}")
async def check_username_availability(
    username: str,
    db: Session = Depends(get_db)
):
    """
    Check if a username is available
    """
    try:
        existing = db.query(Influencer).filter(
            Influencer.username == username.lower().strip()
        ).first()
        
        return {
            "available": existing is None,
            "username": username.lower().strip(),
            "message": "Username is available" if not existing else "Username is already taken"
        }
    except Exception as e:
        logger.error(f"Username check error: {e}")
        raise HTTPException(status_code=500, detail="Failed to check username availability")


@app.get("/influencers/stats")
async def get_influencer_stats(db: Session = Depends(get_db)):
    """
    Get statistics about registered influencers (for homepage/marketing)
    """
    try:
        from sqlalchemy import func
        
        total_influencers = db.query(Influencer).count()
        self_registered = db.query(Influencer).filter(
            Influencer.id.like('inf_%')  # Our self-registered IDs start with 'inf_'
        ).count()
        
        avg_followers = db.query(func.avg(Influencer.total_followers)).scalar() or 0
        
        category_breakdown = db.query(
            Influencer.category,
            func.count(Influencer.id).label('count')
        ).group_by(Influencer.category).all()
        
        return {
            "total_influencers": total_influencers,
            "self_registered_influencers": self_registered,
            "scraped_influencers": total_influencers - self_registered,
            "average_followers": round(avg_followers),
            "categories": {cat: count for cat, count in category_breakdown if cat},
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")
    





# =================================================================
# INFLUENCER AUTHENTICATION ENDPOINTS
# =================================================================

@app.post("/influencers/login")
async def influencer_login(
    request: InfluencerLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login endpoint for influencers
    Returns JWT token on successful authentication
    """
    try:
        from database import Influencer, InfluencerAuth
        
        # Find influencer by email
        influencer = db.query(Influencer).filter(
            Influencer.email == request.email
        ).first()
        
        if not influencer:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Get auth record
        auth_record = db.query(InfluencerAuth).filter(
            InfluencerAuth.id == influencer.id
        ).first()
        
        if not auth_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account not found. Please contact support."
            )
        
        # Verify password
        if not verify_password(request.password, auth_record.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if account is active
        if not auth_record.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please contact support."
            )
        
        # Update last login
        auth_record.last_login = datetime.utcnow()
        db.commit()
        
        # Create access token
        access_token = create_influencer_access_token(
            influencer_id=str(influencer.id),
            email=influencer.email
        )
        
        logger.info(f"✅ Influencer logged in: {influencer.email}")
        
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "influencer": {
                "id": influencer.id,
                "username": influencer.username,
                "email": influencer.email,
                "full_name": influencer.full_name,
                "profile_picture": influencer.profile_image_url,
                "category": influencer.category,
                "total_followers": influencer.total_followers,
                "verified": influencer.verified
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Influencer login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )


@app.get("/influencers/me")
async def get_influencer_profile(
    current_influencer: Influencer = Depends(get_current_influencer)
):
    """
    Get current influencer's profile data
    """
    return {
        "success": True,
        "influencer": {
            "id": current_influencer.id,
            "username": current_influencer.username,
            "full_name": current_influencer.full_name,
            "email": current_influencer.email,
            "bio": current_influencer.bio,
            "category": current_influencer.category,
            "profile_image_url": current_influencer.profile_image_url,
            "verified": current_influencer.verified,
            
            # Social Media
            "instagram_handle": current_influencer.instagram_handle,
            "instagram_followers": current_influencer.instagram_followers,
            "youtube_channel": current_influencer.youtube_channel,
            "youtube_subscribers": current_influencer.youtube_subscribers,
            "youtube_url": current_influencer.youtube_url,
            "video_count": current_influencer.video_count,
            "total_views": current_influencer.total_views,
            "tiktok_handle": current_influencer.tiktok_handle,
            "tiktok_followers": current_influencer.tiktok_followers,
            
            # Stats
            "total_followers": current_influencer.total_followers,
            "engagement_rate": float(current_influencer.engagement_rate) if current_influencer.engagement_rate else 0.0,
            
            # Metadata
            "created_at": current_influencer.created_at.isoformat() if current_influencer.created_at else None,
            "updated_at": current_influencer.updated_at.isoformat() if current_influencer.updated_at else None
        }
    }


@app.get("/influencers/profile")
async def get_influencer_profile(
    current_influencer: Influencer = Depends(get_current_influencer),
    db: Session = Depends(get_db)
):
    """Get current influencer's profile"""
    try:
        logger.info(f"📋 Fetching profile for: {current_influencer.username}")
        
        return {
            "success": True,
            "influencer": {
                "id": current_influencer.id,
                "username": current_influencer.username,
                "full_name": current_influencer.full_name,
                "email": current_influencer.email,
                "bio": current_influencer.bio,
                "category": current_influencer.category,
                "profile_image_url": current_influencer.profile_image_url,
                "instagram_handle": current_influencer.instagram_handle,
                "instagram_followers": current_influencer.instagram_followers,
                "youtube_channel": current_influencer.youtube_channel,
                "youtube_subscribers": current_influencer.youtube_subscribers,
                "youtube_url": current_influencer.youtube_url,
                "tiktok_handle": current_influencer.tiktok_handle,
                "tiktok_followers": current_influencer.tiktok_followers,
                "total_followers": current_influencer.total_followers,
                "engagement_rate": float(current_influencer.engagement_rate) if current_influencer.engagement_rate else 0.0,
                "verified": current_influencer.verified,
                "created_at": current_influencer.created_at.isoformat() if current_influencer.created_at else None,
                "updated_at": current_influencer.updated_at.isoformat() if current_influencer.updated_at else None
            }
        }
    except Exception as e:
        logger.error(f"❌ Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/influencers/profile")
async def update_influencer_profile(
    request: InfluencerUpdateProfileRequest,
    current_influencer: Influencer = Depends(get_current_influencer),
    db: Session = Depends(get_db)
):
    """
    Update influencer profile
    Only allows updating specific fields (not username, email, or verification status)
    """
    try:
        logger.info(f"🔄 Updating profile for: {current_influencer.username}")
        
        # Update only provided fields
        update_data = request.dict(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields to update"
            )
        
        # Update using raw SQL to avoid total_followers issues
        update_fields = []
        update_values = {"influencer_id": current_influencer.id}
        
        for field, value in update_data.items():
            update_fields.append(f"{field} = :{field}")
            update_values[field] = value
        
        # Always update the updated_at timestamp
        update_fields.append("updated_at = :updated_at")
        update_values["updated_at"] = datetime.utcnow()
        
        update_query = text(f"""
            UPDATE influencers
            SET {", ".join(update_fields)}
            WHERE id = :influencer_id
        """)
        
        db.execute(update_query, update_values)
        db.commit()
        
        # Fetch updated influencer
        updated_influencer = db.query(Influencer).filter(
            Influencer.id == current_influencer.id
        ).first()
        
        logger.info(f"✅ Profile updated: {updated_influencer.username}")
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "influencer": {
                "id": updated_influencer.id,
                "username": updated_influencer.username,
                "full_name": updated_influencer.full_name,
                "email": updated_influencer.email,
                "bio": updated_influencer.bio,
                "category": updated_influencer.category,
                "profile_image_url": updated_influencer.profile_image_url,
                "instagram_handle": updated_influencer.instagram_handle,
                "instagram_followers": updated_influencer.instagram_followers,
                "youtube_channel": updated_influencer.youtube_channel,
                "youtube_subscribers": updated_influencer.youtube_subscribers,
                "youtube_url": updated_influencer.youtube_url,
                "tiktok_handle": updated_influencer.tiktok_handle,
                "tiktok_followers": updated_influencer.tiktok_followers,
                "total_followers": updated_influencer.total_followers,
                "engagement_rate": float(updated_influencer.engagement_rate) if updated_influencer.engagement_rate else 0.0,
                "verified": updated_influencer.verified,
                "created_at": updated_influencer.created_at.isoformat() if updated_influencer.created_at else None,
                "updated_at": updated_influencer.updated_at.isoformat() if updated_influencer.updated_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Profile update error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Profile update failed: {str(e)}"
        )


@app.post("/influencers/create-password")
async def create_influencer_password(
    email: EmailStr,
    password: str,
    db: Session = Depends(get_db)
):
    """
    Create password for an existing influencer (for self-registered influencers)
    This should be called RIGHT AFTER registration
    """
    try:
        from database import Influencer, InfluencerAuth
        
        # Validate password strength
        if len(password) < 8:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters long"
            )
        
        # Find influencer by email
        influencer = db.query(Influencer).filter(
            Influencer.email == email
        ).first()
        
        if not influencer:
            raise HTTPException(
                status_code=404,
                detail="Influencer not found"
            )
        
        # Check if password already exists
        existing_auth = db.query(InfluencerAuth).filter(
            InfluencerAuth.id == influencer.id
        ).first()
        
        if existing_auth:
            raise HTTPException(
                status_code=400,
                detail="Password already set. Please use login instead."
            )
        
        # Create auth record
        auth_record = InfluencerAuth(
            id=influencer.id,
            email=influencer.email,
            password_hash=hash_password(password),
            is_active=True,
            email_verified=False,
            created_at=datetime.utcnow()
        )
        
        db.add(auth_record)
        db.commit()
        
        logger.info(f"✅ Password created for influencer: {email}")
        
        return {
            "success": True,
            "message": "Password created successfully. You can now login.",
            "influencer_id": influencer.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Password creation error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Password creation failed"
        )



@app.post("/influencers/change-password")
async def change_influencer_password(
    request: dict,
    current_influencer: Influencer = Depends(get_current_influencer),
    db: Session = Depends(get_db)
):
    """
    Change influencer password
    Requires old password verification
    """
    try:
        old_password = request.get('old_password')
        new_password = request.get('new_password')
        
        if not old_password or not new_password:
            raise HTTPException(
                status_code=400,
                detail="Both old and new passwords are required"
            )
        
        if len(new_password) < 8:
            raise HTTPException(
                status_code=400,
                detail="New password must be at least 8 characters"
            )
        
        # Get auth record
        auth_query = text("""
            SELECT password_hash 
            FROM influencer_auth 
            WHERE id = :influencer_id
        """)
        
        auth_result = db.execute(auth_query, {
            "influencer_id": current_influencer.id
        }).fetchone()
        
        if not auth_result:
            raise HTTPException(
                status_code=404,
                detail="Authentication record not found"
            )
        
        # Verify old password
        if not verify_password(old_password, auth_result.password_hash):
            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect"
            )
        
        # Hash new password
        new_password_hash = hash_password(new_password)
        
        # Update password
        update_query = text("""
            UPDATE influencer_auth
            SET password_hash = :new_password_hash,
                updated_at = NOW()
            WHERE id = :influencer_id
        """)
        
        db.execute(update_query, {
            "new_password_hash": new_password_hash,
            "influencer_id": current_influencer.id
        })
        
        db.commit()
        
        logger.info(f"✅ Password changed for: {current_influencer.username}")
        
        return {
            "success": True,
            "message": "Password changed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Password change error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to change password: {str(e)}"
        )