import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, select, text
from typing import List, Dict
from models import Influencer, InfluencerSocialAccount, Platform, ContentPost, Base
from ..services.embedding_service import EmbeddingService
from ..services.vector_service import VectorService
from config import settings
import sys
import uuid

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EmbeddingProcessor:
    def __init__(self):
        self.engine = create_engine(settings.DATABASE_URL)
        self.embedding_service = EmbeddingService()
        self.vector_service = VectorService()
        
    async def initialize(self):
        """Initialize services."""
        await self.vector_service.initialize()
        logger.info("Services initialized")
    
    def get_db_session(self) -> Session:
        """Get database session."""
        return Session(self.engine)
    
    async def process_all_influencers(self, force_update: bool = False):
        """Process all influencers and generate embeddings."""
        db = self.get_db_session()
        
        try:
            # Get all influencers with their related data
            if force_update:
                query = select(Influencer)
                logger.info("Force update mode: processing all influencers")
            else:
                query = select(Influencer).where(
                    (Influencer.embedding_vector.is_(None)) |
                    (Influencer.embedding_updated_at.is_(None))
                )
                logger.info("Processing influencers without embeddings")
            
            result = db.execute(query)
            influencers = result.scalars().all()
            
            if not influencers:
                logger.info("No influencers to process")
                return
            
            logger.info(f"Found {len(influencers)} influencers to process")
            
            # Process in batches
            batch_size = getattr(settings, 'EMBEDDING_BATCH_SIZE', 10)
            total_processed = 0
            successful_batches = 0
            failed_batches = 0
            
            for i in range(0, len(influencers), batch_size):
                batch = influencers[i:i + batch_size]
                
                try:
                    # Get a fresh database session for each batch
                    batch_db = self.get_db_session()
                    await self.process_batch(batch_db, batch, force_update)
                    batch_db.close()
                    
                    successful_batches += 1
                    total_processed += len(batch)
                    
                    logger.info(f"Progress: {total_processed}/{len(influencers)} influencers processed (Batch {i//batch_size + 1} successful)")
                    
                except Exception as e:
                    failed_batches += 1
                    logger.error(f"Batch {i//batch_size + 1} failed: {str(e)}")
                    # Continue with next batch instead of failing completely
                    continue
                
                # Small delay to respect rate limits
                await asyncio.sleep(1)
            
            logger.info(f"Processing complete: {successful_batches} successful batches, {failed_batches} failed batches")
            logger.info(f"Total processed: {total_processed} influencers")
            
        except Exception as e:
            logger.error(f"Error in main processing: {str(e)}")
            raise
        finally:
            db.close()
    
    async def process_batch(self, db: Session, influencers: List[Influencer], force_update: bool = False):
        """Process a batch of influencers."""
        try:
            # Start fresh - rollback any existing transaction
            db.rollback()
            
            # Convert to dict format for processing
            influencer_data = []
            for inf in influencers:
                try:
                    # FIX: Use proper UUID comparison with explicit casting
                    social_accounts_query = text("""
                        SELECT isa.id, isa.influencer_id, isa.platform_id, isa.platform_username, 
                               isa.platform_user_id, isa.profile_url, isa.followers_count, 
                               isa.following_count, isa.posts_count, isa.engagement_rate, 
                               isa.avg_likes, isa.avg_comments, isa.avg_shares, isa.last_post_date, 
                               isa.account_verified, isa.is_business_account, isa.last_updated,
                               p.id as platform_id, p.name as platform_name, p.display_name, 
                               p.base_url, p.created_at as platform_created_at
                        FROM influencer_social_accounts isa
                        JOIN platforms p ON isa.platform_id = p.id
                        WHERE isa.influencer_id = :influencer_id
                    """)
                    
                    social_accounts_result = db.execute(
                        social_accounts_query, 
                        {"influencer_id": str(inf.id)}
                    )
                    social_accounts = social_accounts_result.fetchall()
                    
                    # Get recent posts for content with proper UUID handling
                    recent_posts_query = text("""
                        SELECT caption FROM content_posts 
                        WHERE influencer_id = :influencer_id 
                        AND caption IS NOT NULL 
                        ORDER BY post_date DESC 
                        LIMIT 5
                    """)
                    
                    recent_posts_result = db.execute(
                        recent_posts_query, 
                        {"influencer_id": str(inf.id)}
                    )
                    recent_posts = recent_posts_result.fetchall()
                    recent_post_texts = [post[0] for post in recent_posts if post[0]]
                    
                    # Calculate total followers across platforms
                    total_followers = sum(acc[6] or 0 for acc in social_accounts)  # followers_count is index 6
                    avg_engagement = sum(acc[9] or 0 for acc in social_accounts) / max(len(social_accounts), 1)  # engagement_rate is index 9
                    platforms = [acc[17] for acc in social_accounts]  # platform_name is index 17
                    
                    # Check if needs update
                    if not force_update:
                        current_hash = self.embedding_service.generate_content_hash({
                            'bio': inf.bio or '',
                            'recent_posts': recent_post_texts,
                            'categories': [],  # Will be populated from database
                            'platforms': platforms
                        })
                        
                        if inf.content_hash == current_hash and inf.embedding_vector:
                            logger.info(f"Skipping influencer {inf.username} - no content changes")
                            continue
                    
                    influencer_data.append({
                        'id': inf.id,
                        'username': inf.username,
                        'bio': inf.bio or '',
                        'recent_posts': recent_post_texts,
                        'categories': [],  # Simplified for now
                        'platforms': platforms,
                        'location_country': inf.location_country or '',
                        'location_city': inf.location_city or '',
                        'languages': inf.languages or [],
                        'total_followers': total_followers,
                        'avg_engagement_rate': avg_engagement,
                        'verified': inf.verified
                    })
                    
                except Exception as e:
                    logger.error(f"Error processing influencer {inf.id}: {str(e)}")
                    # Rollback and continue with next influencer
                    db.rollback()
                    continue
            
            if not influencer_data:
                logger.info("No influencers in batch need processing")
                return
            
            # Generate embeddings
            embeddings_result = await self.embedding_service.process_influencers_batch(influencer_data)
            
            # Prepare data for vector database
            vector_data = []
            db_updates = []
            
            for inf_data in influencer_data:
                # Find corresponding embedding result
                embedding_data = next(
                    (item for item in embeddings_result if item[0] == inf_data['id']), 
                    None
                )
                
                if embedding_data:
                    inf_id, embedding, content_hash = embedding_data
                    
                    # Prepare vector database entry with enhanced metadata
                    # Fix metadata format for Pinecone compatibility
                    metadata = {
                        'username': str(inf_data['username'])[:100],  # Ensure string and limit length
                        'platform': inf_data['platforms'][0] if inf_data['platforms'] else 'unknown',  # Single platform as string
                        'follower_count': int(inf_data['total_followers']),
                        'engagement_rate': float(inf_data['avg_engagement_rate']) if inf_data['avg_engagement_rate'] else 0.0,
                        'verified': bool(inf_data['verified']),
                        'location_country': str(inf_data['location_country'])[:50],  # Ensure string and limit
                        'bio_snippet': str(inf_data['bio'] or '')[:200],  # First 200 chars as string
                        'categories': inf_data['categories'][:3] if inf_data['categories'] else []  # Keep as list of strings
                    }
                    vector_data.append((str(inf_id), embedding, metadata))
                    
                    # Prepare database update - convert embedding to JSON string for PostgreSQL
                    import json
                    db_updates.append({
                        'id': inf_id,
                        'embedding_vector': json.dumps(embedding),  # Convert to JSON string
                        'content_hash': content_hash,
                        'embedding_updated_at': datetime.utcnow()
                    })
            
            # Update vector database first (less likely to fail)
            if vector_data:
                success = await self.vector_service.upsert_embeddings(vector_data)
                if success:
                    # Update PostgreSQL database
                    await self.update_database_embeddings(db, db_updates)
                    logger.info(f"Successfully processed batch of {len(vector_data)} influencers")
                else:
                    logger.error("Failed to upsert embeddings to vector database")
            
        except Exception as e:
            logger.error(f"Error processing batch: {str(e)}")
            # Ensure we rollback on any error
            db.rollback()
            raise
    
    async def update_database_embeddings(self, db: Session, updates: List[Dict]):
        """Update database with embedding information."""
        try:
            # Use executemany for better performance and simpler syntax
            for update in updates:
                # Simple approach - update one by one
                result = db.execute(
                    text("UPDATE influencers SET embedding_vector = :embedding_vector, content_hash = :content_hash, embedding_updated_at = :embedding_updated_at, embedding_created_at = COALESCE(embedding_created_at, :embedding_created_at) WHERE id::text = :influencer_id"),
                    {
                        'embedding_vector': update['embedding_vector'],
                        'content_hash': update['content_hash'],
                        'embedding_updated_at': update['embedding_updated_at'].isoformat(),
                        'embedding_created_at': datetime.utcnow().isoformat(),
                        'influencer_id': str(update['id'])
                    }
                )
                logger.debug(f"Updated influencer {update['id']}: {result.rowcount} rows affected")
            
            db.commit()
            logger.info(f"Updated database for {len(updates)} influencers")
            
        except Exception as e:
            logger.error(f"Error updating database: {str(e)}")
            db.rollback()
            raise
    
    async def process_single_influencer(self, influencer_id: str):
        """Process a single influencer (useful for real-time updates)."""
        db = self.get_db_session()
        
        try:
            # Convert string ID to UUID
            influencer_uuid = uuid.UUID(influencer_id)
            influencer = db.get(Influencer, influencer_uuid)
            
            if not influencer:
                logger.error(f"Influencer {influencer_id} not found")
                return False
            
            await self.process_batch(db, [influencer], force_update=True)
            return True
            
        except Exception as e:
            logger.error(f"Error processing single influencer {influencer_id}: {str(e)}")
            return False
        finally:
            db.close()
    
    async def get_processing_stats(self) -> Dict:
        """Get processing statistics."""
        db = self.get_db_session()
        
        try:
            total_influencers = db.query(Influencer).filter(Influencer.status == 'active').count()
            with_embeddings = db.query(Influencer).filter(
                Influencer.embedding_vector.is_not(None),
                Influencer.status == 'active'
            ).count()
            
            # Get some sample data for verification
            sample_with_embeddings = db.query(Influencer).filter(
                Influencer.embedding_vector.is_not(None)
            ).limit(3).all()
            
            vector_stats = await self.vector_service.get_index_stats()
            
            return {
                'total_influencers': total_influencers,
                'with_embeddings': with_embeddings,
                'without_embeddings': total_influencers - with_embeddings,
                'completion_percentage': round((with_embeddings / max(total_influencers, 1)) * 100, 2),
                'sample_processed': [{'username': inf.username, 'updated_at': inf.embedding_updated_at} 
                                   for inf in sample_with_embeddings],
                'vector_db_stats': vector_stats
            }
            
        except Exception as e:
            logger.error(f"Error getting stats: {str(e)}")
            return {}
        finally:
            db.close()
    
    async def cleanup_orphaned_vectors(self):
        """Remove vectors from Pinecone that don't have corresponding database records."""
        db = self.get_db_session()
        
        try:
            # Get all influencer IDs from database
            db_influencer_ids = set(str(inf.id) for inf in db.query(Influencer).all())
            
            # This would require implementing a method to list all vectors in Pinecone
            # For now, we'll skip this as it's advanced functionality
            logger.info("Cleanup functionality not implemented yet")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
        finally:
            db.close()

async def main():
    """Main function for running the embedding processor."""
    processor = EmbeddingProcessor()
    
    try:
        await processor.initialize()
        logger.info("Embedding processor initialized")
        
        # Check command line arguments
        force_update = '--force' in sys.argv
        single_id = None
        show_stats = '--stats' in sys.argv
        
        for i, arg in enumerate(sys.argv):
            if arg == '--id' and i + 1 < len(sys.argv):
                single_id = sys.argv[i + 1]
        
        if show_stats:
            # Show statistics only
            logger.info("Getting processing statistics...")
            stats = await processor.get_processing_stats()
            print("\n=== Embedding Processing Statistics ===")
            print(f"Total active influencers: {stats.get('total_influencers', 'N/A')}")
            print(f"With embeddings: {stats.get('with_embeddings', 'N/A')}")
            print(f"Without embeddings: {stats.get('without_embeddings', 'N/A')}")
            print(f"Completion: {stats.get('completion_percentage', 'N/A')}%")
            print(f"Vector DB stats: {stats.get('vector_db_stats', {})}")
            
            if stats.get('sample_processed'):
                print("\nSample processed influencers:")
                for sample in stats['sample_processed']:
                    print(f"  - {sample['username']}: {sample['updated_at']}")
            print("=====================================\n")
            
        elif single_id:
            # Process single influencer
            logger.info(f"Processing single influencer: {single_id}")
            success = await processor.process_single_influencer(single_id)
            if success:
                logger.info("Single influencer processed successfully")
            else:
                logger.error("Failed to process single influencer")
        else:
            # Process all influencers
            logger.info("Starting batch processing of all influencers")
            await processor.process_all_influencers(force_update=force_update)
        
        # Print final stats unless we just showed stats
        if not show_stats:
            stats = await processor.get_processing_stats()
            logger.info(f"Processing complete. Final stats: {stats}")
        
    except Exception as e:
        logger.error(f"Error during processing: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main())