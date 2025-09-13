import sys
from pathlib import Path
# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import settings

import asyncio
import hashlib
import json
import tiktoken
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import openai
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
from config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.encoding = tiktoken.encoding_for_model("text-embedding-3-small")
        
    def prepare_text_for_embedding(self, influencer_data: Dict) -> str:
        """Prepare influencer data for embedding generation."""
        bio = influencer_data.get('bio', '').strip()
        recent_posts = influencer_data.get('recent_posts', [])
        categories = influencer_data.get('categories', [])
        platform = influencer_data.get('platform', '')
        
        # Combine recent posts (limit to first 5 to control length)
        posts_text = ' '.join(recent_posts[:5]) if recent_posts else ''
        
        # Create structured text
        text_parts = []
        if bio:
            text_parts.append(f"Bio: {bio}")
        if posts_text:
            text_parts.append(f"Recent posts: {posts_text}")
        if categories:
            text_parts.append(f"Categories: {', '.join(categories)}")
        if platform:
            text_parts.append(f"Platform: {platform}")
            
        combined_text = '\n'.join(text_parts)
        
        # Truncate if too long
        return self._truncate_text(combined_text)
    
    def _truncate_text(self, text: str) -> str:
        """Truncate text to fit within token limits."""
        tokens = self.encoding.encode(text)
        if len(tokens) <= settings.MAX_TEXT_LENGTH:
            return text
            
        # Truncate tokens and decode back
        truncated_tokens = tokens[:settings.MAX_TEXT_LENGTH]
        return self.encoding.decode(truncated_tokens)
    
    def generate_content_hash(self, influencer_data: Dict) -> str:
        """Generate hash of content to detect changes."""
        content_str = json.dumps({
            'bio': influencer_data.get('bio', ''),
            'recent_posts': influencer_data.get('recent_posts', [])[:5],
            'categories': influencer_data.get('categories', [])
        }, sort_keys=True)
        
        return hashlib.sha256(content_str.encode()).hexdigest()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def generate_single_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        try:
            response = await self.client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise
    
    async def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts in batch."""
        try:
            # OpenAI supports batch processing
            response = await self.client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=texts
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {str(e)}")
            # Fallback to individual processing
            embeddings = []
            for text in texts:
                embedding = await self.generate_single_embedding(text)
                embeddings.append(embedding)
                await asyncio.sleep(0.1)  # Rate limiting
            return embeddings
    
    async def process_influencers_batch(
        self, 
        influencers: List[Dict]
    ) -> List[Tuple[int, List[float], str]]:
        """Process a batch of influencers and return embeddings."""
        texts = []
        influencer_ids = []
        content_hashes = []
        
        for influencer in influencers:
            text = self.prepare_text_for_embedding(influencer)
            content_hash = self.generate_content_hash(influencer)
            
            texts.append(text)
            influencer_ids.append(influencer['id'])
            content_hashes.append(content_hash)
        
        logger.info(f"Generating embeddings for {len(texts)} influencers...")
        embeddings = await self.generate_batch_embeddings(texts)
        
        return list(zip(influencer_ids, embeddings, content_hashes))
    
    def needs_embedding_update(self, influencer: Dict, stored_hash: Optional[str]) -> bool:
        """Check if influencer needs embedding update."""
        if not stored_hash:
            return True
            
        current_hash = self.generate_content_hash(influencer)
        return current_hash != stored_hash
    
    async def generate_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for search query."""
        processed_query = f"Search query: {query}"
        return await self.generate_single_embedding(processed_query)