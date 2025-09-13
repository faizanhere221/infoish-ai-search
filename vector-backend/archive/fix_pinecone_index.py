import time
import pinecone
from pinecone import Pinecone
from config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_pinecone_index():
    """Fix the Pinecone index dimension mismatch."""
    
    # Initialize Pinecone
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    index_name = settings.PINECONE_INDEX_NAME
    
    try:
        # Check existing indexes
        existing_indexes = pc.list_indexes()
        index_names = [idx.name for idx in existing_indexes.indexes]
        
        if index_name in index_names:
            # Get current index info
            index_info = pc.describe_index(index_name)
            current_dimension = index_info.dimension
            required_dimension = settings.EMBEDDING_DIMENSIONS
            
            logger.info(f"Current index dimension: {current_dimension}")
            logger.info(f"Required dimension: {required_dimension}")
            
            if current_dimension != required_dimension:
                logger.info("❌ Dimension mismatch detected!")
                logger.info(f"Deleting index '{index_name}'...")
                
                # Delete the existing index
                pc.delete_index(index_name)
                
                # Wait for deletion to complete
                logger.info("⏳ Waiting for deletion to complete...")
                time.sleep(30)
                
                # Wait until index is completely deleted
                while index_name in [idx.name for idx in pc.list_indexes().indexes]:
                    logger.info("Still waiting for deletion...")
                    time.sleep(5)
                
                logger.info("✅ Index deleted successfully!")
            else:
                logger.info("✅ Index already has correct dimensions!")
                return True
        
        # Create new index with correct dimensions
        logger.info(f"🚀 Creating new index '{index_name}' with dimension {settings.EMBEDDING_DIMENSIONS}")
        
        pc.create_index(
            name=index_name,
            dimension=settings.EMBEDDING_DIMENSIONS,  # 1536 for text-embedding-3-small
            metric='cosine',
            spec=pinecone.ServerlessSpec(
                cloud='aws',
                region='us-east-1'  # Match your PINECONE_ENVIRONMENT
            )
        )
        
        # Wait for index to be ready
        logger.info("⏳ Waiting for index to be ready...")
        time.sleep(20)
        
        # Verify the new index
        new_index_info = pc.describe_index(index_name)
        logger.info(f"✅ New index created successfully!")
        logger.info(f"   - Name: {new_index_info.name}")
        logger.info(f"   - Dimension: {new_index_info.dimension}")
        logger.info(f"   - Metric: {new_index_info.metric}")
        logger.info(f"   - Status: {new_index_info.status.ready}")
        
        if new_index_info.dimension == settings.EMBEDDING_DIMENSIONS:
            logger.info("🎉 Index dimension matches embedding model!")
            return True
        else:
            logger.error("❌ Index dimension still doesn't match!")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error fixing index: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔧 Fixing Pinecone index dimension mismatch...")
    print(f"📊 Target dimension: {settings.EMBEDDING_DIMENSIONS}")
    print(f"🔑 Index name: {settings.PINECONE_INDEX_NAME}")
    print(f"🌍 Environment: {settings.PINECONE_ENVIRONMENT}")
    print("-" * 50)
    
    success = fix_pinecone_index()
    
    if success:
        print("\n" + "=" * 50)
        print("✅ SUCCESS! Pinecone index is now ready!")
        print("You can now run:")
        print("python vector-backend/run_embedding_processing.py")
        print("=" * 50)
    else:
        print("\n" + "=" * 50)
        print("❌ FAILED to fix Pinecone index")
        print("Please check your API keys and try again")
        print("=" * 50)