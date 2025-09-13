#!/usr/bin/env python3
"""
Complete setup script for AI Influencer Search embedding functionality.
"""

import os
import sys
import logging
import asyncio
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_environment():
    """Check if environment is properly set up."""
    logger.info("Checking environment setup...")
    
    # Check if .env file exists
    if not Path('.env').exists():
        logger.error("❌ .env file not found!")
        logger.info("Please copy .env.example to .env and fill in your credentials:")
        logger.info("  cp .env.example .env")
        return False
    
    # Try to import required modules
    try:
        from config import settings
        logger.info("✅ Configuration loaded successfully")
    except Exception as e:
        logger.error(f"❌ Error loading configuration: {str(e)}")
        return False
    
    # Check required environment variables
    required_vars = ['DATABASE_URL', 'OPENAI_API_KEY', 'PINECONE_API_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not hasattr(settings, var) or not getattr(settings, var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"❌ Missing required environment variables: {missing_vars}")
        logger.info("Please check your .env file and make sure these variables are set")
        return False
    
    logger.info("✅ All required environment variables are set")
    return True

def test_database_connection():
    """Test database connection."""
    logger.info("Testing database connection...")
    
    try:
        from database import test_connection
        if test_connection():
            logger.info("✅ Database connection successful")
            return True
        else:
            logger.error("❌ Database connection failed")
            return False
    except Exception as e:
        logger.error(f"❌ Database connection error: {str(e)}")
        return False

def run_database_migration():
    """Run database migration."""
    logger.info("Running database migration...")
    
    try:
        from run_migration import run_migration, test_migration
        run_migration()
        
        if test_migration():
            logger.info("✅ Database migration completed successfully")
            return True
        else:
            logger.error("❌ Database migration verification failed")
            return False
            
    except Exception as e:
        logger.error(f"❌ Database migration failed: {str(e)}")
        return False

async def test_api_services():
    """Test API services initialization."""
    logger.info("Testing API services...")
    
    try:
        from embedding_service import EmbeddingService
        from vector_service import VectorService
        
        # Test embedding service
        embedding_service = EmbeddingService()
        test_embedding = await embedding_service.generate_single_embedding("test query")
        logger.info(f"✅ Embedding service working (generated {len(test_embedding)} dimensions)")
        
        # Test vector service
        vector_service = VectorService()
        await vector_service.initialize()
        stats = await vector_service.get_index_stats()
        logger.info(f"✅ Vector service working (index stats: {stats})")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ API services test failed: {str(e)}")
        logger.info("This might be due to missing API keys or network issues")
        return False

async def run_embedding_stats():
    """Show embedding processing statistics."""
    logger.info("Checking embedding processing statistics...")
    
    try:
        from embedding_processor import EmbeddingProcessor
        
        processor = EmbeddingProcessor()
        await processor.initialize()
        
        stats = await processor.get_processing_stats()
        
        logger.info("📊 Current Statistics:")
        logger.info(f"  Total influencers: {stats.get('total_influencers', 'N/A')}")
        logger.info(f"  With embeddings: {stats.get('with_embeddings', 'N/A')}")
        logger.info(f"  Without embeddings: {stats.get('without_embeddings', 'N/A')}")
        logger.info(f"  Completion: {stats.get('completion_percentage', 'N/A')}%")
        
        return stats
        
    except Exception as e:
        logger.error(f"❌ Error getting embedding stats: {str(e)}")
        return None

async def main():
    """Main setup function."""
    logger.info("🚀 Starting AI Influencer Search setup...")
    
    # Step 1: Check environment
    if not check_environment():
        logger.error("❌ Environment check failed. Please fix the issues and try again.")
        return False
    
    # Step 2: Test database connection
    if not test_database_connection():
        logger.error("❌ Database connection failed. Please check your DATABASE_URL.")
        return False
    
    # Step 3: Run migration
    if not run_database_migration():
        logger.error("❌ Database migration failed.")
        return False
    
    # Step 4: Test API services
    logger.info("Testing API services (this may take a moment)...")
    if not await test_api_services():
        logger.warning("⚠️  API services test failed. You may have API key issues.")
        logger.info("You can still proceed with the setup, but fix API keys before processing embeddings.")
    
    # Step 5: Show current stats
    stats = await run_embedding_stats()
    
    # Step 6: Provide next steps
    logger.info("\n🎉 Setup completed successfully!")
    logger.info("\n📋 Next Steps:")
    
    if stats and stats.get('without_embeddings', 0) > 0:
        logger.info("1. Process embeddings for your influencers:")
        logger.info("   python run_embedding_processing.py")
        logger.info("   (This will take some time depending on how many influencers you have)")
    else:
        logger.info("1. All influencers already have embeddings! ✅")
    
    logger.info("\n2. Start your API server:")
    logger.info("   python main.py")
    
    logger.info("\n3. Test the search functionality:")
    logger.info("   python test_search.py")
    
    logger.info("\n4. API Documentation will be available at:")
    logger.info("   http://localhost:8000/docs")
    
    logger.info("\n📖 For more detailed instructions, see SETUP_GUIDE.md")
    
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        logger.info("Setup interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Unexpected error during setup: {str(e)}")
        sys.exit(1)