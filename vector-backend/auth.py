# vector-backend/auth.py - UPDATED TO MATCH PRISMA SCHEMA
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import logging
import requests
import secrets
from jose import JWTError, jwt
from passlib.context import CryptContext
from database import get_db

logger = logging.getLogger(__name__)

# JWT Settings
SECRET_KEY = "your-super-secret-jwt-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_cuid():
    """Generate a CUID-like ID to match Prisma"""
    return f"c{secrets.token_urlsafe(20)}"

def safe_bool_convert(value):
    """Safely convert various boolean representations to actual boolean"""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes', 'on')
    return bool(value)

# Authentication Service
class AuthService:
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[str]:
        """Verify JWT token and return user email"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email is None:
                return None
            return email
        except JWTError:
            return None
    
    @staticmethod
    def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
    ):
        """Get current authenticated user - works with existing User table"""
        from database import User, AuthUser
        
        token = credentials.credentials
        email = AuthService.verify_token(token)
        
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # First try to find in basic users table
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Try to get extended auth info
        auth_user = db.query(AuthUser).filter(AuthUser.id == user.id).first()
        
        # Combine the data
        user.subscription_tier = getattr(auth_user, 'subscription_tier', 'free')
        user.search_count = getattr(auth_user, 'search_count', 0)
        user.monthly_searches = getattr(auth_user, 'monthly_searches', 0)
        user.search_limit = getattr(auth_user, 'search_limit', 15)
        user.full_name = getattr(auth_user, 'full_name', None)
        user.profile_picture = getattr(auth_user, 'profile_picture', None)
        user.google_id = getattr(auth_user, 'google_id', None)
        user.is_verified = getattr(auth_user, 'is_verified', False)
        
        return user
    
    @staticmethod
    def verify_google_token(google_token: str) -> Optional[dict]:
        """Verify Google OAuth token and return user info"""
        try:
            # Development test tokens - Enhanced with multiple users
            test_tokens = {
                "test_development_token_free": {
                    "sub": "test_user_free_123",
                    "email": "free@test.com",
                    "name": "Test Free User",
                    "picture": "https://via.placeholder.com/150",
                    "email_verified": True,  # Ensure this is boolean
                    "subscription_tier": "free"
                },
                "test_development_token_premium": {
                    "sub": "test_user_premium_456", 
                    "email": "premium@test.com",
                    "name": "Test Premium User",
                    "picture": "https://via.placeholder.com/150",
                    "email_verified": True,
                    "subscription_tier": "premium"
                },
                "test_development_token": {
                    "sub": "test_user_legacy",
                    "email": "developer@test.com",
                    "name": "Test Developer",
                    "picture": "https://via.placeholder.com/150",
                    "email_verified": True,
                    "subscription_tier": "free"
                }
            }
            
            if google_token in test_tokens:
                return test_tokens[google_token]
            
            # Production Google token verification
            response = requests.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={google_token}",
                timeout=5
            )
            
            if response.status_code == 200:
                user_info = response.json()
                return user_info
            else:
                logger.error(f"Google token verification failed: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Google token verification error: {e}")
            return None
    
    @staticmethod
    def get_or_create_user(google_user_info: dict, db: Session):
        """Get existing user or create new one from Google info"""
        from database import User, AuthUser
        
        email = google_user_info.get("email")
        google_id = google_user_info.get("sub")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        # Check if user exists in basic table
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user with CUID
            user_id = generate_cuid()
            user = User(
                id=user_id,
                email=email
            )
            db.add(user)
            db.flush()  # Get the ID
            
            # Create auth user record
            subscription_tier = google_user_info.get("subscription_tier", "free")
            search_limit = 999999 if subscription_tier == "premium" else 15
            
            auth_user = AuthUser(
                id=user.id,
                full_name=google_user_info.get("name", ""),
                profile_picture=google_user_info.get("picture", ""),
                google_id=google_id,
                subscription_tier=subscription_tier,
                search_count=0,  # Explicit default
                monthly_searches=0,  # Explicit default
                search_limit=search_limit,
                is_active=True,  # Explicit boolean default
                is_verified=safe_bool_convert(google_user_info.get("email_verified", False)),  # Use safe conversion
                created_at=datetime.utcnow()  # Explicit datetime
            )
            db.add(auth_user)
        else:
            # Update existing user
            auth_user = db.query(AuthUser).filter(AuthUser.id == user.id).first()
            if not auth_user:
                # Create auth record for existing user
                subscription_tier = google_user_info.get("subscription_tier", "free")
                search_limit = 999999 if subscription_tier == "premium" else 15
                
                auth_user = AuthUser(
                    id=user.id,
                    full_name=google_user_info.get("name", ""),
                    profile_picture=google_user_info.get("picture", ""),
                    google_id=google_id,
                    subscription_tier=subscription_tier,
                    search_count=0,  # Explicit default
                    monthly_searches=0,  # Explicit default
                    search_limit=search_limit,
                    is_active=True,  # Explicit boolean default
                    is_verified=safe_bool_convert(google_user_info.get("email_verified", False)),  # Use safe conversion
                    created_at=datetime.utcnow()  # Explicit datetime
                )
                db.add(auth_user)
            else:
                # Update existing auth user
                auth_user.google_id = google_id
                auth_user.full_name = google_user_info.get("name", auth_user.full_name)
                auth_user.profile_picture = google_user_info.get("picture", auth_user.profile_picture)
                auth_user.is_verified = safe_bool_convert(google_user_info.get("email_verified", False))
                
                # Handle test user subscription tiers
                if google_user_info.get("subscription_tier"):
                    auth_user.subscription_tier = google_user_info["subscription_tier"]
                    if google_user_info["subscription_tier"] == "premium":
                        auth_user.search_limit = 999999
        
        # Reset monthly searches if needed
        AuthService.reset_monthly_searches_if_needed(auth_user)
        
        db.commit()
        db.refresh(user)
        
        # Attach auth info to user object
        auth_user = db.query(AuthUser).filter(AuthUser.id == user.id).first()
        user.subscription_tier = auth_user.subscription_tier
        user.search_count = auth_user.search_count
        user.monthly_searches = auth_user.monthly_searches
        user.search_limit = auth_user.search_limit
        user.full_name = auth_user.full_name
        user.profile_picture = auth_user.profile_picture
        user.google_id = auth_user.google_id
        user.is_verified = auth_user.is_verified
        
        return user
    
    @staticmethod
    def reset_monthly_searches_if_needed(auth_user):
        """Reset monthly search count if it's a new month"""
        if not auth_user:
            return
        
        now = datetime.utcnow()
        last_reset = auth_user.created_at
    
        # Check if created_at exists before doing date arithmetic
        if last_reset and (now - last_reset).days >= 30:
            auth_user.monthly_searches = 0
        elif not last_reset:
            # If no created_at, set it to now and don't reset searches yet
            auth_user.created_at = now
    
    @staticmethod
    def check_search_limit(user) -> bool:
        """Check if user can perform another search"""
        if hasattr(user, 'subscription_tier') and user.subscription_tier == "premium":
            return True
        
        monthly_searches = getattr(user, 'monthly_searches', 0)
        search_limit = getattr(user, 'search_limit', 15)
        
        return monthly_searches < search_limit
    
    @staticmethod
    def increment_search_count(user, db: Session):
        """Increment user's search count"""
        from database import AuthUser
        
        auth_user = db.query(AuthUser).filter(AuthUser.id == user.id).first()
        if auth_user:
            auth_user.search_count += 1
            auth_user.monthly_searches += 1
            db.commit()
    
    @staticmethod
    def log_user_search(db: Session, user, query: str, filters: dict, results_count: int, search_time_ms: int):
        """Log user search for analytics"""
        from database import SearchLog
        
        try:
            # Increment search counts
            AuthService.increment_search_count(user, db)
            
            # Create search log
            search_log = SearchLog(
                query=query,
                user_email=user.email,
                results_count=results_count,
                filters_applied=filters
            )
            db.add(search_log)
            db.commit()
            
        except Exception as e:
            logger.error(f"Search logging error: {e}")

# Authentication Endpoints
class AuthEndpoints:
    
    @staticmethod
    async def google_login(google_token: str, db: Session):
        """Handle Google OAuth login"""
        try:
            # Verify Google token
            google_user_info = AuthService.verify_google_token(google_token)
            
            if not google_user_info:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google token"
                )
            
            # Get or create user
            user = AuthService.get_or_create_user(google_user_info, db)
            
            # Create access token
            access_token = AuthService.create_access_token(
                data={"sub": user.email}
            )
            
            logger.info(f"User logged in: {user.email}")
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": getattr(user, 'full_name', None),
                    "profile_picture": getattr(user, 'profile_picture', None),
                    "subscription_tier": getattr(user, 'subscription_tier', 'free'),
                    "monthly_searches": getattr(user, 'monthly_searches', 0),
                    "search_limit": getattr(user, 'search_limit', 15),
                    "searches_remaining": getattr(user, 'search_limit', 15) - getattr(user, 'monthly_searches', 0) if getattr(user, 'subscription_tier', 'free') == "free" else "unlimited"
                }
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Google login error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Login failed"
            )