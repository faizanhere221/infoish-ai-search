# simple_embedding_processor.py - Works with your current database schema
import asyncio
import logging
import sys
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict
from sqlalchemy.orm import Session

# Add parent directory to path
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

from database import get_db_session, init_database, Influencer
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService
from config import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SimpleEmbeddingProcessor:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.vector_service = VectorService()
        
    async def initialize(self):
        """Initialize services."""
        await self.vector_service.initialize()
        logger.info("Embedding processor initialized")
        
        # Check if Pinecone is available
        if self.vector_service.is_available():
            logger.info("✅ Pinecone vector database ready")
        else:
            logger.warning("⚠️ Pinecone not available - check your API keys")
            
    def get_db_session(self) -> Session:
        """Get database session."""
        from database import SessionLocal
        return SessionLocal()
    
    async def process_all_influencers(self, force_update: bool = False):
        """Process all influencers and generate embeddings."""
        db = self.get_db_session()
        
        try:
            # Get all influencers from your simplified schema
            if force_update:
                influencers = db.query(Influencer).all()
                logger.info(f"Force update mode: processing all {len(influencers)} influencers")
            else:
                # Only process influencers without embeddings
                influencers = db.query(Influencer).filter(
                    Influencer.embedding_vector.is_(None)
                ).all()
                logger.info(f"Processing {len(influencers)} influencers without embeddings")
            
            if not influencers:
                logger.info("No influencers to process")
                return
            
            # Process in batches to respect OpenAI rate limits
            batch_size = getattr(settings, 'EMBEDDING_BATCH_SIZE', 5)  # Smaller batches
            total_processed = 0
            successful_batches = 0
            failed_batches = 0
            
            for i in range(0, len(influencers), batch_size):
                batch = influencers[i:i + batch_size]
                
                try:
                    logger.info(f"Processing batch {i//batch_size + 1}/{(len(influencers) + batch_size - 1)//batch_size}")
                    await self.process_batch(db, batch)
                    
                    successful_batches += 1
                    total_processed += len(batch)
                    
                    logger.info(f"✅ Progress: {total_processed}/{len(influencers)} influencers processed")
                    
                except Exception as e:
                    failed_batches += 1
                    logger.error(f"❌ Batch {i//batch_size + 1} failed: {str(e)}")
                    continue
                
                # Delay to respect rate limits
                await asyncio.sleep(2)
            
            logger.info(f"🎉 Processing complete: {successful_batches} successful, {failed_batches} failed batches")
            logger.info(f"📊 Total processed: {total_processed} influencers")
            
        except Exception as e:
            logger.error(f"Error in main processing: {str(e)}")
            raise
        finally:
            db.close()
    
    async def process_batch(self, db: Session, influencers: List[Influencer]):
        """Process a batch of influencers."""
        try:
            # Convert influencers to the format expected by embedding service
            influencer_data = []
            
            for inf in influencers:
                # Determine platforms based on your schema
                platforms = []
                if inf.instagram_handle:
                    platforms.append('instagram')
                if inf.youtube_channel:
                    platforms.append('youtube')
                if inf.tiktok_handle:
                    platforms.append('tiktok')
                
                # Calculate total followers
                total_followers = (
                    (inf.instagram_followers or 0) + 
                    (inf.youtube_subscribers or 0) + 
                    (inf.tiktok_followers or 0)
                )
                
                influencer_data.append({
                    'id': inf.id,
                    'username': inf.username,
                    'bio': inf.bio or '',
                    'recent_posts': [],  # No posts data in simplified schema
                    'categories': [inf.category] if inf.category else [],
                    'platforms': platforms,
                    'location_country': 'Pakistan',  # Default
                    'location_city': inf.location_city or '',
                    'total_followers': total_followers,
                    'avg_engagement_rate': float(inf.engagement_rate) if inf.engagement_rate else 0.0,
                    'verified': inf.verified or False
                })
            
            # Generate embeddings
            logger.info(f"Generating embeddings for {len(influencer_data)} influencers...")
            embeddings_result = await self.embedding_service.process_influencers_batch(influencer_data)
            
            # Prepare data for Pinecone and database updates
            vector_data = []
            db_updates = []
            
            for inf_data in influencer_data:
                # Find corresponding embedding
                embedding_data = next(
                    (item for item in embeddings_result if item[0] == inf_data['id']), 
                    None
                )
                
                if embedding_data:
                    inf_id, embedding, content_hash = embedding_data
                    
                    # Prepare Pinecone metadata
                    metadata = {
                        'username': str(inf_data['username'])[:100],
                        'platform': inf_data['platforms'][0] if inf_data['platforms'] else 'unknown',
                        'follower_count': int(inf_data['total_followers']),
                        'engagement_rate': float(inf_data['avg_engagement_rate']),
                        'verified': bool(inf_data['verified']),
                        'location_country': 'Pakistan',
                        'bio_snippet': str(inf_data['bio'] or '')[:200],
                        'categories': inf_data['categories'][:3] if inf_data['categories'] else []
                    }
                    
                    vector_data.append((str(inf_id), embedding, metadata))
                    
                    # Prepare database update
                    db_updates.append({
                        'id': inf_id,
                        'embedding_vector': json.dumps(embedding),
                        'content_hash': content_hash,
                        'embedding_updated_at': datetime.utcnow()
                    })
            
            # Upload to Pinecone first
            if vector_data and self.vector_service.is_available():
                logger.info(f"Uploading {len(vector_data)} embeddings to Pinecone...")
                success = await self.vector_service.upsert_embeddings(vector_data)
                
                if success:
                    logger.info("✅ Pinecone upload successful")
                    # Update database
                    await self.update_database_embeddings(db, db_updates)
                else:
                    logger.error("❌ Pinecone upload failed")
            else:
                logger.warning("⚠️ Skipping Pinecone upload - service not available")
                # Still update database with embeddings for future use
                await self.update_database_embeddings(db, db_updates)
            
        except Exception as e:
            logger.error(f"Error processing batch: {str(e)}")
            raise
    
    async def update_database_embeddings(self, db: Session, updates: List[Dict]):
        """Update database with embedding information."""
        try:
            for update in updates:
                # Update the influencer record
                influencer = db.query(Influencer).filter(Influencer.id == update['id']).first()
                if influencer:
                    influencer.embedding_vector = update['embedding_vector']
                    influencer.content_hash = update['content_hash']
                    influencer.updated_at = update['embedding_updated_at']
                    
                    # Add embedding timestamps if they don't exist
                    if not hasattr(influencer, 'embedding_created_at'):
                        # Add these fields to your database schema if needed
                        pass
            
            db.commit()
            logger.info(f"✅ Updated database for {len(updates)} influencers")
            
        except Exception as e:
            logger.error(f"❌ Error updating database: {str(e)}")
            db.rollback()
            raise
    
    async def get_stats(self) -> Dict:
        """Get processing statistics."""
        db = self.get_db_session()
        
        try:
            total_influencers = db.query(Influencer).count()
            with_embeddings = db.query(Influencer).filter(
                Influencer.embedding_vector.isnot(None)
            ).count()
            
            vector_stats = await self.vector_service.get_index_stats() if self.vector_service.is_available() else {"error": "Pinecone not available"}
            
            return {
                'total_influencers': total_influencers,
                'with_embeddings': with_embeddings,
                'without_embeddings': total_influencers - with_embeddings,
                'completion_percentage': round((with_embeddings / max(total_influencers, 1)) * 100, 2),
                'vector_db_stats': vector_stats
            }
            
        except Exception as e:
            logger.error(f"Error getting stats: {str(e)}")
            return {'error': str(e)}
        finally:
            db.close()

async def main():
    """Main function."""
    processor = SimpleEmbeddingProcessor()
    
    try:
        # Initialize
        await processor.initialize()
        
        # Check command line arguments
        force_update = '--force' in sys.argv
        show_stats = '--stats' in sys.argv
        
        if show_stats:
            # Show statistics
            logger.info("Getting embedding statistics...")
            stats = await processor.get_stats()
            
            print("\n" + "=" * 50)
            print("📊 EMBEDDING PROCESSING STATISTICS")
            print("=" * 50)
            print(f"Total influencers: {stats.get('total_influencers', 'N/A')}")
            print(f"With embeddings: {stats.get('with_embeddings', 'N/A')}")
            print(f"Without embeddings: {stats.get('without_embeddings', 'N/A')}")
            print(f"Completion: {stats.get('completion_percentage', 'N/A')}%")
            print(f"Vector DB: {stats.get('vector_db_stats', {})}")
            print("=" * 50 + "\n")
            
        else:
            # Process all influencers
            logger.info("🚀 Starting embedding generation for Pakistani influencers...")
            await processor.process_all_influencers(force_update=force_update)
            
            # Show final stats
            stats = await processor.get_stats()
            logger.info(f"🎉 Final stats: {stats.get('completion_percentage', 0)}% complete")
        
    except Exception as e:
        logger.error(f"💥 Processing failed: {str(e)}")
        print(f"\n❌ Error: {str(e)}")
        print("\n🔧 Troubleshooting:")
        print("1. Check your OpenAI API key in .env file")
        print("2. Check your Pinecone API key and index name")
        print("3. Ensure database connection is working")
        print("4. Try running with --stats first to check setup")

if __name__ == "__main__":
    print("🚀 Pakistani Influencer Embedding Processor")
    print("This will convert your 300 influencers into vector embeddings")
    print("-" * 60)
    asyncio.run(main())