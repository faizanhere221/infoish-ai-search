# Enhanced services/hybrid_search_service.py
import asyncio
import time
import logging
import re
import sys
from pathlib import Path
from typing import List, Dict, Optional, Set, Tuple, Union
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func, case, text
from fastapi import HTTPException


# Add parent directory to path for imports
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

# Import database model and constants
from database import Influencer

# Enhanced constants for better search
DEFAULT_SEARCH_LIMIT = 50
MAX_SEARCH_LIMIT = 100
MIN_RELEVANCE_SCORE = 0.15  # Slightly higher threshold
EXACT_MATCH_WEIGHT = 0.5   # Increased for exact matches
USERNAME_MATCH_WEIGHT = 0.3
FULL_NAME_MATCH_WEIGHT = 0.25
BIO_MATCH_WEIGHT = 0.15
VERIFIED_BONUS = 0.15      # Increased verified bonus
HIGH_ENGAGEMENT_BONUS = 0.2 # Increased engagement bonus
HIGH_FOLLOWERS_BONUS = 0.1
BATCH_SIZE = 100

logger = logging.getLogger(__name__)


class HybridSearchService:
    """
    Enhanced hybrid search with improved Pakistani context understanding
    """
    
    def __init__(self, db: Session):
        self.db = db
        
        # Enhanced synonym mapping with Pakistani context
        self.synonym_map = {
            'tech': ['technology', 'gadget', 'review', 'mobile', 'phone', 'laptop', 'computer', 'android', 'iphone', 'software', 'ai', 'programming', 'unboxing', 'specs', 'smartphone'],
            'beauty': ['makeup', 'cosmetic', 'skincare', 'fashion', 'style', 'salon', 'hair', 'nails', 'modeling', 'outfit', 'hijab', 'modest fashion', 'bridal', 'mehndi'],
            'food': ['cooking', 'recipe', 'chef', 'restaurant', 'cuisine', 'kitchen', 'desi', 'pakistani', 'karahi', 'biryani', 'street food', 'halal', 'ramadan', 'iftar'],
            'gaming': ['game', 'gamer', 'esports', 'streaming', 'pubg', 'minecraft', 'fifa', 'cod', 'valorant', 'mobile gaming', 'free fire', 'clash', 'fortnite'],
            'comedy': ['funny', 'humor', 'entertainment', 'joke', 'sketch', 'parody', 'memes', 'viral', 'comedy skits', 'standup', 'roast'],
            'travel': ['trip', 'journey', 'tourism', 'adventure', 'explore', 'wanderlust', 'vacation', 'vlog', 'destination', 'pakistan tourism', 'northern areas'],
            'fitness': ['gym', 'workout', 'health', 'exercise', 'bodybuilding', 'yoga', 'training', 'sports', 'wellness', 'diet', 'nutrition'],
            'music': ['singer', 'song', 'musician', 'artist', 'band', 'cover', 'vocals', 'instrument', 'melody', 'qawwali', 'sufi', 'bollywood'],
            'lifestyle': ['vlog', 'daily', 'routine', 'life', 'personal', 'family', 'home', 'decor', 'motivation', 'inspiration'],
            'business': ['entrepreneur', 'startup', 'finance', 'investment', 'money', 'corporate', 'marketing', 'success', 'motivational'],
            'education': ['teaching', 'learning', 'study', 'tutorial', 'academic', 'knowledge', 'skills', 'training', 'coaching'],
            'news': ['current affairs', 'politics', 'journalism', 'reporting', 'updates', 'breaking news', 'analysis']
        }
        
        # Pakistani context words that should boost relevance
        self.pakistani_context = {'pakistan', 'pakistani', 'karachi', 'lahore', 'islamabad', 'urdu', 'punjabi', 'sindhi', 'desi'}
        
    async def initialize(self):
        """Initialize search service"""
        try:
            logger.info("Enhanced hybrid search service initialized")
        except Exception as e:
            logger.warning(f"Search service initialization failed: {e}")

    def extract_keywords(self, query: str) -> Set[str]:
        """Enhanced keyword extraction with Pakistani context"""
        if not query:
            return set()

        # Clean and normalize query
        clean_query = re.sub(r'[^\w\s]', ' ', query.lower().strip())
        keywords = set(re.findall(r'\b\w+\b', clean_query))

        # Enhanced stop words (including common Pakistani words that don't add search value)
        stop_words = {
            'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 
            'is', 'are', 'was', 'were', 'best', 'top', 'good', 'great', 'find', 'search'
        }
        keywords = keywords - stop_words

        # Enhanced synonym expansion with context awareness
        expanded = set(keywords)
        for keyword in keywords:
            # Direct category matches
            if keyword in self.synonym_map:
                expanded.update([keyword] + self.synonym_map[keyword][:4])
            
            # Reverse synonym lookup
            for category, synonyms in self.synonym_map.items():
                if keyword in synonyms:
                    expanded.add(category)
                    # Add related synonyms
                    expanded.update(synonyms[:2])

        return expanded

    def calculate_enhanced_relevance_score(self, influencer, keywords: Set[str], query: str) -> float:
        """Enhanced relevance scoring with multiple factors"""
        score = 0.0
        
        # Convert fields to lowercase for comparison
        category_lower = influencer.category.lower() if influencer.category else ""
        username_lower = influencer.username.lower() if influencer.username else ""
        full_name_lower = influencer.full_name.lower() if influencer.full_name else ""
        bio_lower = influencer.bio.lower() if influencer.bio else ""
        
        # Exact query match (highest priority)
        query_lower = query.lower()
        if query_lower in category_lower or query_lower in username_lower or query_lower in bio_lower:
            score += 0.6
        
        # Category exact match
        for keyword in keywords:
            if keyword == category_lower:
                score += EXACT_MATCH_WEIGHT
            elif keyword in category_lower:
                score += EXACT_MATCH_WEIGHT * 0.7

        # Username relevance
        for keyword in keywords:
            if keyword == username_lower:
                score += USERNAME_MATCH_WEIGHT
            elif keyword in username_lower:
                score += USERNAME_MATCH_WEIGHT * 0.7

        # Full name relevance
        for keyword in keywords:
            if keyword in full_name_lower:
                score += FULL_NAME_MATCH_WEIGHT

        # Bio relevance with keyword density
        bio_matches = sum(1 for keyword in keywords if keyword in bio_lower)
        if bio_matches > 0:
            bio_score = min(bio_matches * 0.1, BIO_MATCH_WEIGHT)
            score += bio_score

        # Pakistani context boost
        if any(ctx in bio_lower or ctx in category_lower for ctx in self.pakistani_context):
            score += 0.1

        # Performance bonuses
        if influencer.verified:
            score += VERIFIED_BONUS

        # Engagement rate bonus (scaled)
        if influencer.engagement_rate:
            if influencer.engagement_rate >= 8:
                score += HIGH_ENGAGEMENT_BONUS
            elif influencer.engagement_rate >= 5:
                score += HIGH_ENGAGEMENT_BONUS * 0.7
            elif influencer.engagement_rate >= 3:
                score += HIGH_ENGAGEMENT_BONUS * 0.4

        # Follower count bonus (logarithmic scale)
        if influencer.total_followers:
            if influencer.total_followers >= 1000000:  # 1M+
                score += HIGH_FOLLOWERS_BONUS
            elif influencer.total_followers >= 100000:  # 100K+
                score += HIGH_FOLLOWERS_BONUS * 0.7
            elif influencer.total_followers >= 50000:   # 50K+
                score += HIGH_FOLLOWERS_BONUS * 0.4

        # Multi-platform bonus
        platform_count = sum([
            1 if influencer.instagram_followers and influencer.instagram_followers > 1000 else 0,
            1 if influencer.youtube_subscribers and influencer.youtube_subscribers > 1000 else 0,
            1 if influencer.tiktok_followers and influencer.tiktok_followers > 1000 else 0
        ])
        if platform_count >= 2:
            score += 0.1

        return min(score, 1.0)

    def apply_smart_ordering(self, db_query, query: str, keywords: Set[str]):
        """Apply intelligent ordering based on query context"""
        
        # Create relevance scoring in SQL
        relevance_cases = []
        
        # Exact category matches get highest priority
        for keyword in keywords:
            relevance_cases.append(
                case(
                    (func.lower(Influencer.category) == keyword, 10),
                    (func.lower(Influencer.category).like(f'%{keyword}%'), 8),
                    else_=0
                )
            )
        
        # Username matches
        for keyword in keywords:
            relevance_cases.append(
                case(
                    (func.lower(Influencer.username) == keyword, 7),
                    (func.lower(Influencer.username).like(f'%{keyword}%'), 5),
                    else_=0
                )
            )
        
        # Combine all relevance scores
        total_relevance = sum(relevance_cases) if relevance_cases else 0
        
        # Engagement boost
        engagement_boost = case(
            (Influencer.engagement_rate >= 8, 3),
            (Influencer.engagement_rate >= 5, 2),
            (Influencer.engagement_rate >= 3, 1),
            else_=0
        )
        
        # Verified boost
        verified_boost = case((Influencer.verified == True, 2), else_=0)
        
        # Final ordering
        return db_query.order_by(
            desc(total_relevance + engagement_boost + verified_boost),
            desc(Influencer.total_followers),
            desc(Influencer.engagement_rate)
        )

    async def hybrid_search(self, query: str, filters: Dict, limit: int = 12, offset: int = 0) -> Dict:
        """Enhanced hybrid search with improved relevance"""
        start_time = time.time()

        try:
            logger.info(f"Enhanced search for: '{query}' with offset: {offset}, limit: {limit}")

            # Extract and expand keywords
            keywords = self.extract_keywords(query)
            logger.info(f"Extracted keywords: {keywords}")

            # Build base query
            db_query = self.db.query(Influencer)

            # Apply text search with enhanced matching
            if query and keywords:
                conditions = []
                
                # Exact phrase matching (highest priority)
                exact_phrase = query.strip().lower()
                if len(exact_phrase) > 2:
                    conditions.extend([
                        func.lower(Influencer.category).like(f'%{exact_phrase}%'),
                        func.lower(Influencer.username).like(f'%{exact_phrase}%'),
                        func.lower(Influencer.bio).like(f'%{exact_phrase}%')
                    ])
                
                # Keyword-based matching
                for keyword in keywords:
                    if len(keyword) > 2:  # Skip very short words
                        conditions.extend([
                            func.lower(Influencer.username).like(f'%{keyword}%'),
                            func.lower(Influencer.full_name).like(f'%{keyword}%'),
                            func.lower(Influencer.category).like(f'%{keyword}%'),
                            func.lower(Influencer.bio).like(f'%{keyword}%'),
                            func.lower(Influencer.youtube_channel).like(f'%{keyword}%'),
                            func.lower(Influencer.instagram_handle).like(f'%{keyword}%'),
                            func.lower(Influencer.tiktok_handle).like(f'%{keyword}%')
                        ])
                
                if conditions:
                    db_query = db_query.filter(or_(*conditions))

            # Apply filters
            db_query = self.apply_filters(db_query, filters)
            
            # Get total count before pagination
            total_count = db_query.count()
            logger.info(f"Total matching results: {total_count}")

            # Apply smart ordering
            if query and keywords:
                db_query = self.apply_smart_ordering(db_query, query, keywords)
            else:
                # Default ordering when no query
                db_query = db_query.order_by(
                    desc(Influencer.engagement_rate),
                    desc(Influencer.total_followers)
                )

            # Apply pagination
            paginated_results = db_query.offset(offset).limit(limit).all()
            logger.info(f"Retrieved {len(paginated_results)} results for page")

            # Format results with enhanced scoring
            formatted_results = []
            for inf in paginated_results:
                relevance_score = self.calculate_enhanced_relevance_score(inf, keywords, query) if keywords else 0.5
                
                # Only include results with sufficient relevance (or all results if no query)
                if not query or relevance_score >= MIN_RELEVANCE_SCORE:
                    formatted_results.append({
                        'id': inf.id,
                        'username': inf.username,
                        'full_name': inf.full_name,
                        'bio': inf.bio,
                        'category': inf.category,
                        'total_followers': inf.total_followers,
                        'engagement_rate': float(inf.engagement_rate) if inf.engagement_rate else 0.0,
                        'verified': inf.verified,
                        'video_count': inf.video_count,
                        'total_views': int(inf.total_views) if inf.total_views else 0,
                        'youtube_url': inf.youtube_url,
                        'instagram_followers': inf.instagram_followers or 0,
                        'youtube_subscribers': inf.youtube_subscribers or 0,
                        'tiktok_followers': inf.tiktok_followers or 0,
                        'instagram_handle': inf.instagram_handle,
                        'youtube_channel': inf.youtube_channel,
                        'tiktok_handle': inf.tiktok_handle,
                        'profile_image_url': inf.profile_image_url,
                        'email': inf.email,
                        'search_type': 'enhanced_hybrid',
                        'match_score': relevance_score,
                        'relevance_score': relevance_score
                    })

            search_time_ms = int((time.time() - start_time) * 1000)
            current_page = (offset // limit) + 1
            total_pages = (total_count + limit - 1) // limit

            return {
                'results': formatted_results,
                'total': total_count,
                'total_found': total_count,
                'search_time_ms': search_time_ms,
                'search_insights': {
                    'total_results': total_count,
                    'returned_results': len(formatted_results),
                    'current_page': current_page,
                    'total_pages': total_pages,
                    'results_per_page': limit,
                    'search_strategy': 'enhanced_hybrid_search',
                    'keywords_extracted': list(keywords) if keywords else [],
                    'relevance_threshold': MIN_RELEVANCE_SCORE,
                    'query_complexity': 'high' if len(keywords) > 3 else 'medium' if len(keywords) > 1 else 'simple'
                },
                'query': query,
                'success': True
            }

        except Exception as e:
            logger.error(f"Enhanced search failed: {str(e)}")
            return {
                'results': [],
                'total': 0,
                'total_found': 0,
                'search_time_ms': int((time.time() - start_time) * 1000),
                'search_insights': {'error': str(e)},
                'query': query,
                'success': False
            }

    def apply_filters(self, db_query, filters: Dict):
        """Enhanced filter application with better validation"""
        try:
            # Platform filtering with validation
            platform = filters.get('platform')
            if platform == "instagram":
                db_query = db_query.filter(
                    and_(
                        Influencer.instagram_handle.isnot(None),
                        Influencer.instagram_followers > 100  # Minimum threshold
                    )
                )
            elif platform == "youtube":
                db_query = db_query.filter(
                    and_(
                        Influencer.youtube_channel.isnot(None),
                        Influencer.youtube_subscribers > 100
                    )
                )
            elif platform == "tiktok":
                db_query = db_query.filter(
                    and_(
                        Influencer.tiktok_handle.isnot(None),
                        Influencer.tiktok_followers > 100
                    )
                )
            
            # Category filtering with partial matching
            if filters.get('category'):
                category = filters['category'].lower().strip()
                db_query = db_query.filter(
                    func.lower(Influencer.category).like(f"%{category}%")
                )
            
            # Follower range filtering
            if filters.get('min_followers'):
                min_val = int(filters['min_followers'])
                db_query = db_query.filter(Influencer.total_followers >= min_val)
            
            if filters.get('max_followers'):
                max_val = int(filters['max_followers'])
                db_query = db_query.filter(Influencer.total_followers <= max_val)
            
            # Engagement filtering
            if filters.get('engagement_min'):
                eng_min = float(filters['engagement_min'])
                db_query = db_query.filter(Influencer.engagement_rate >= eng_min)
            
            # YouTube specific filters
            if filters.get('min_video_count'):
                video_min = int(filters['min_video_count'])
                db_query = db_query.filter(Influencer.video_count >= video_min)
            
            if filters.get('min_total_views'):
                views_min = int(filters['min_total_views'])
                db_query = db_query.filter(Influencer.total_views >= views_min)
            
            if filters.get('has_youtube_url') is True:
                db_query = db_query.filter(Influencer.youtube_url.isnot(None))
            
            # Verified status filtering
            if filters.get('verified'):
                verified_val = filters['verified'].lower()
                if verified_val == "true":
                    db_query = db_query.filter(Influencer.verified == True)
                elif verified_val == "false":
                    db_query = db_query.filter(Influencer.verified == False)
            
            return db_query
            
        except (ValueError, TypeError) as e:
            logger.warning(f"Filter application error: {e}")
            return db_query  # Return unfiltered query if filter values are invalid