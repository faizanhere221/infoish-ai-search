# services/vector_service.py - Updated for Pinecone v7.3.0
import pinecone
from typing import List, Dict, Optional, Tuple
import logging
import sys
from pathlib import Path

# Add parent directory to path for imports
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

from config import settings

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        try:
            # Initialize Pinecone client for v7.3.0
            pinecone.init(
                api_key=settings.PINECONE_API_KEY,
                environment=getattr(settings, 'PINECONE_ENVIRONMENT', 'us-east-1-aws')
            )
            self.index_name = settings.PINECONE_INDEX_NAME
            self.index = None
            logger.info("Pinecone client initialized")
        except Exception as e:
            logger.error(f"Error initializing Pinecone client: {e}")
            self.index_name = None
            self.index = None
        
    async def initialize(self):
        """Initialize Pinecone index."""
        if not self.index_name:
            logger.error("Pinecone client not initialized")
            return
            
        try:
            # Check if index exists
            existing_indexes = pinecone.list_indexes()
            
            if self.index_name not in existing_indexes:
                logger.info(f"Creating Pinecone index: {self.index_name}")
                
                # Create index for v7.3.0
                pinecone.create_index(
                    name=self.index_name,
                    dimension=getattr(settings, 'EMBEDDING_DIMENSIONS', 1536),
                    metric='cosine'
                )
                logger.info("Index created successfully")
            else:
                logger.info(f"Index {self.index_name} already exists")
            
            self.index = pinecone.Index(self.index_name)
            logger.info(f"Connected to Pinecone index: {self.index_name}")
            
            # Test the connection
            stats = self.index.describe_index_stats()
            logger.info(f"Index stats: {stats}")
            
        except Exception as e:
            logger.error(f"Error initializing Pinecone: {str(e)}")
            # Don't raise - allow system to continue
    
    def prepare_metadata(self, influencer: Dict) -> Dict:
        """Prepare metadata for vector storage."""
        return {
            'username': str(influencer.get('username', '')),
            'platform': str(influencer.get('platform', '')),
            'follower_count': int(influencer.get('follower_count', 0)),
            'engagement_rate': float(influencer.get('engagement_rate', 0.0)),
            'categories': influencer.get('categories', []),
            'bio_snippet': str(influencer.get('bio', '') or '')[:200],
            'country': str(influencer.get('country', '')),
        }
    
    async def upsert_embeddings(
        self, 
        embeddings_data: List[Tuple[str, List[float], Dict]]
    ) -> bool:
        """Upsert embeddings to Pinecone."""
        if not self.index:
            logger.error("Pinecone index not available")
            return False
            
        try:
            vectors = []
            for influencer_id, embedding, metadata in embeddings_data:
                vectors.append({
                    'id': str(influencer_id),
                    'values': embedding,
                    'metadata': self.prepare_metadata(metadata)
                })
            
            # Batch upsert
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                self.index.upsert(vectors=batch)
                logger.info(f"Upserted batch {i//batch_size + 1}/{(len(vectors)-1)//batch_size + 1}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error upserting embeddings: {str(e)}")
            return False
    
    async def search_similar(
        self,
        query_embedding: List[float],
        top_k: int = 50,
        filters: Optional[Dict] = None,
        score_threshold: float = 0.7
    ) -> List[Dict]:
        """Search for similar vectors."""
        if not self.index:
            logger.warning("Pinecone index not available, returning empty results")
            return []
            
        try:
            # Build Pinecone filter
            pinecone_filter = self._build_pinecone_filter(filters) if filters else {}
            
            # Perform search
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=pinecone_filter
            )
            
            # Format results
            formatted_results = []
            if hasattr(results, 'matches'):
                for match in results.matches:
                    if match.score >= score_threshold:
                        formatted_results.append({
                            'id': match.id,
                            'score': float(match.score),
                            'metadata': match.metadata or {}
                        })
            
            logger.info(f"Found {len(formatted_results)} results above threshold {score_threshold}")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching vectors: {str(e)}")
            return []
    
    def _build_pinecone_filter(self, filters: Dict) -> Dict:
        """Build Pinecone metadata filter."""
        pinecone_filter = {}
        
        try:
            if filters.get('platforms'):
                pinecone_filter['platform'] = {'$in': filters['platforms']}
            
            # Follower count filtering
            min_followers = filters.get('min_followers')
            max_followers = filters.get('max_followers')
            if min_followers is not None or max_followers is not None:
                follower_filter = {}
                if min_followers is not None:
                    follower_filter['$gte'] = int(min_followers)
                if max_followers is not None:
                    follower_filter['$lte'] = int(max_followers)
                if follower_filter:
                    pinecone_filter['follower_count'] = follower_filter
            
            # Engagement rate filtering
            if filters.get('min_engagement_rate') is not None:
                pinecone_filter['engagement_rate'] = {
                    '$gte': float(filters['min_engagement_rate'])
                }
            
            # Country filtering
            if filters.get('countries'):
                pinecone_filter['country'] = {'$in': filters['countries']}
            
            logger.info(f"Built Pinecone filter: {pinecone_filter}")
            return pinecone_filter
            
        except Exception as e:
            logger.error(f"Error building filter: {e}")
            return {}
    
    async def delete_embedding(self, influencer_id: str) -> bool:
        """Delete embedding from Pinecone."""
        if not self.index:
            return False
            
        try:
            self.index.delete(ids=[str(influencer_id)])
            return True
        except Exception as e:
            logger.error(f"Error deleting embedding {influencer_id}: {str(e)}")
            return False
    
    async def get_index_stats(self) -> Dict:
        """Get index statistics."""
        if not self.index:
            return {"error": "Index not available"}
            
        try:
            stats = self.index.describe_index_stats()
            return {
                'total_vectors': stats.get('total_vector_count', 0),
                'dimension': stats.get('dimension', 'unknown'),
                'index_fullness': stats.get('index_fullness', 0)
            }
        except Exception as e:
            logger.error(f"Error getting index stats: {str(e)}")
            return {"error": str(e)}
    
    def is_available(self) -> bool:
        """Check if vector service is available."""
        return self.index is not None