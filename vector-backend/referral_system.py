# vector-backend/referral_system.py
# Complete Network marketing system integrated with your existing structure

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from database import SessionLocal, engine  # Use your existing database setup
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json
import logging
import uuid
import hashlib

logger = logging.getLogger(__name__)

# Extend your existing database models
Base = declarative_base()

class NetworkUser(Base):
    """Network marketing user model - extends your existing system"""
    __tablename__ = "network_users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    phone = Column(String)
    
    # Referral system
    referral_code = Column(String, unique=True, index=True)
    referred_by = Column(String, ForeignKey("network_users.id"), nullable=True)
    total_referrals = Column(Integer, default=0)
    
    # Earnings
    total_earnings = Column(Float, default=0.0)
    pending_earnings = Column(Float, default=0.0)
    this_month_earnings = Column(Float, default=0.0)
    
    # Status
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    verification_video_url = Column(String, nullable=True)
    
    # Profile info
    niche = Column(String)
    city = Column(String)
    bio = Column(Text)
    primary_platform = Column(String)
    followers_count = Column(Integer, default=0)
    
    # Referred person info (the person they invited)
    referral_name = Column(String)
    referral_username = Column(String) 
    referral_email = Column(String, nullable=True)
    referral_niche = Column(String)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    referrer = relationship("NetworkUser", remote_side=[id], backref="referred_users")
    transactions = relationship("EarningsTransaction", back_populates="user")

class EarningsTransaction(Base):
    """Track all earnings and payments"""
    __tablename__ = "earnings_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("network_users.id"))
    
    # Transaction details
    transaction_type = Column(String)  # referral_bonus, monthly_bonus, tier_reward, payment_out
    amount = Column(Float)
    description = Column(String)
    
    # Payment info (for payouts)
    payment_method = Column(String, nullable=True)  # jazzcash, easypaisa, bank
    payment_reference = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, completed, failed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    user = relationship("NetworkUser", back_populates="transactions")

class EnhancedReferralSystem:
    """Enhanced referral system integrated with your existing project"""
    
    def __init__(self):
        self.db = SessionLocal()
        
        # Reward structure - start conservative, scale up
        self.rewards = {
            "first_referral": 100,      # PKR for successful registration
            "ongoing_referral": 50,     # PKR for each additional referral
            "monthly_active_bonus": 25, # PKR per month per active referral
            "verification_bonus": 200,  # PKR for completing profile verification
        }
        
        # Tier system for scaling rewards
        self.tier_bonuses = {
            5: {"bonus": 500, "monthly_multiplier": 1.25},    # Silver tier
            15: {"bonus": 2000, "monthly_multiplier": 1.5},   # Gold tier  
            50: {"bonus": 5000, "monthly_multiplier": 2.0}    # Platinum tier
        }
    
    def generate_referral_code(self, username: str) -> str:
        """Generate unique referral code"""
        timestamp = str(int(datetime.now().timestamp()))
        hash_input = f"{username}_{timestamp}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:8].upper()
    
    def register_user(self, user_data: Dict) -> Dict:
        """Register new user with referral tracking"""
        try:
            # Generate referral code
            referral_code = self.generate_referral_code(user_data['username'])
            
            # Create network user
            user = NetworkUser(
                username=user_data['username'],
                email=user_data['email'],
                full_name=user_data.get('full_name'),
                phone=user_data.get('phone'),
                referral_code=referral_code,
                niche=user_data.get('niche'),
                city=user_data.get('city'),
                bio=user_data.get('bio'),
                primary_platform=user_data.get('primary_platform'),
                followers_count=int(user_data.get('followers', 0)),
                referral_name=user_data.get('referral_name'),
                referral_username=user_data.get('referral_username'),
                referral_email=user_data.get('referral_email'),
                referral_niche=user_data.get('referral_niche')
            )
            
            # Handle if they were referred by someone
            referral_code_used = user_data.get('referral_code')
            if referral_code_used:
                referrer = self.db.query(NetworkUser).filter_by(referral_code=referral_code_used).first()
                if referrer:
                    user.referred_by = referrer.id
                    # Process referral reward
                    self._process_referral_reward(referrer, user)
            
            self.db.add(user)
            self.db.commit()
            
            # Add welcome bonus
            self._add_welcome_bonus(user)
            
            return {
                "success": True,
                "user_id": user.id,
                "referral_code": user.referral_code,
                "welcome_bonus": 50,  # PKR
                "message": "Registration successful! Start referring to earn more."
            }
            
        except Exception as e:
            logger.error(f"Registration failed: {e}")
            self.db.rollback()
            return {"success": False, "error": str(e)}
    
    def _process_referral_reward(self, referrer: NetworkUser, new_user: NetworkUser):
        """Process reward for successful referral"""
        try:
            # Determine reward amount
            reward_amount = self.rewards["first_referral"] if referrer.total_referrals == 0 else self.rewards["ongoing_referral"]
            
            # Update referrer stats
            referrer.total_referrals += 1
            referrer.pending_earnings += reward_amount
            referrer.this_month_earnings += reward_amount
            
            # Create transaction record
            transaction = EarningsTransaction(
                user_id=referrer.id,
                transaction_type="referral_bonus",
                amount=reward_amount,
                description=f"Referral bonus for bringing {new_user.username}",
                status="completed"
            )
            self.db.add(transaction)
            
            # Check for tier bonuses
            self._check_tier_bonus(referrer)
            
            logger.info(f"Processed referral reward: {reward_amount} PKR for {referrer.username}")
            
        except Exception as e:
            logger.error(f"Failed to process referral reward: {e}")
    
    def _check_tier_bonus(self, user: NetworkUser):
        """Check and award tier bonuses"""
        for tier_threshold, tier_rewards in self.tier_bonuses.items():
            if user.total_referrals == tier_threshold:  # Exact match for one-time bonus
                bonus_amount = tier_rewards["bonus"]
                user.pending_earnings += bonus_amount
                
                # Create tier bonus transaction
                transaction = EarningsTransaction(
                    user_id=user.id,
                    transaction_type="tier_reward",
                    amount=bonus_amount,
                    description=f"Tier bonus for reaching {tier_threshold} referrals",
                    status="completed"
                )
                self.db.add(transaction)
                
                logger.info(f"Tier bonus awarded: {bonus_amount} PKR to {user.username}")
                break
    
    def _add_welcome_bonus(self, user: NetworkUser):
        """Add welcome bonus for new users"""
        welcome_amount = 50  # PKR
        user.pending_earnings += welcome_amount
        
        transaction = EarningsTransaction(
            user_id=user.id,
            transaction_type="welcome_bonus",
            amount=welcome_amount,
            description="Welcome bonus for joining the network",
            status="completed"
        )
        self.db.add(transaction)

# Create database tables
def create_network_tables():
    """Create network marketing tables"""
    try:
        print("📋 Creating network marketing database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Network marketing tables created successfully")
        print("✅ Network marketing tables created successfully")
        print("   📊 Tables created:")
        print("      - network_users (user profiles, referral codes, earnings)")
        print("      - earnings_transactions (bonuses, payments, rewards)")
        print("   🎯 System ready for user registration and referrals!")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to create network tables: {e}")
        print(f"❌ Failed to create network tables: {e}")
        return False

def get_network_stats():
    """Get network marketing statistics"""
    try:
        db = SessionLocal()
        
        total_users = db.query(NetworkUser).count()
        if total_users == 0:
            return {"error": "No network users yet"}
        
        active_users = db.query(NetworkUser).filter_by(is_active=True).count()
        verified_users = db.query(NetworkUser).filter_by(is_verified=True).count()
        
        # Total earnings distributed
        from sqlalchemy import func
        total_distributed = db.query(func.sum(EarningsTransaction.amount))\
                                  .filter(EarningsTransaction.transaction_type.in_([
                                      'referral_bonus', 'tier_reward', 'welcome_bonus'
                                  ])).scalar() or 0
        
        # This month's activity
        start_of_month = datetime.now().replace(day=1)
        monthly_registrations = db.query(NetworkUser)\
                                       .filter(NetworkUser.created_at >= start_of_month)\
                                       .count()
        
        monthly_earnings = db.query(func.sum(NetworkUser.this_month_earnings)).scalar() or 0
        
        db.close()
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "verified_users": verified_users,
            "total_earnings_distributed": total_distributed,
            "monthly_stats": {
                "new_registrations": monthly_registrations,
                "total_monthly_earnings": monthly_earnings
            }
        }
        
    except Exception as e:
        logger.error(f"Network stats error: {e}")
        return {"error": str(e)}

# Initialize referral system
referral_system = EnhancedReferralSystem()

# Main functions for API integration
def register_network_user(user_data: Dict) -> Dict:
    """API function to register new user"""
    return referral_system.register_user(user_data)

def get_user_dashboard_data(user_id: str) -> Dict:
    """API function to get dashboard data"""
    # This would be implemented when you need dashboard functionality
    return {"message": "Dashboard functionality coming soon"}

def get_monthly_leaderboard() -> List[Dict]:
    """API function to get leaderboard"""
    # This would be implemented when you have users
    return []

def get_network_stats_api() -> Dict:
    """API wrapper for network stats"""
    return get_network_stats()