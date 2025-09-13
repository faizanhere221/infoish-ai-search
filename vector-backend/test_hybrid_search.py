#!/usr/bin/env python3
"""
Test script for HybridSearchService functionality
"""
import asyncio
import sys
import pytest
from pathlib import Path

# Add parent directory to path for imports
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

from database import get_db_session
from services.hybrid_search_service import HybridSearchService

@pytest.mark.asyncio
async def test_hybrid_search_service():
    """Test the HybridSearchService methods"""
    print("🧪 Testing HybridSearchService...")

    # Get database session
    db = next(get_db_session())

    try:
        # Initialize service
        service = HybridSearchService(db)
        print("✅ Service initialized successfully")

        # Test keyword extraction
        print("\n📝 Testing keyword extraction...")
        keywords = service.extract_keywords("tech gaming mobile phone")
        print(f"Extracted keywords: {keywords}")
        assert len(keywords) > 0, "Keyword extraction failed"
        print("✅ Keyword extraction working")

        # Test relevance score calculation
        print("\n📊 Testing relevance score calculation...")
        # Create a mock influencer object
        class MockInfluencer:
            def __init__(self):
                self.category = "tech"
                self.username = "techguru"
                self.full_name = "Tech Guru"
                self.bio = "Mobile phone reviews and tech content"
                self.verified = True
                self.engagement_rate = 8.5
                self.total_followers = 150000

        mock_inf = MockInfluencer()
        score = service.calculate_relevance_score(mock_inf, {"tech", "mobile", "phone"})
        print(f"Relevance score: {score}")
        assert score > 0, "Relevance score calculation failed"
        print("✅ Relevance score calculation working")

        # Test hybrid search with pagination
        print("\n🔍 Testing hybrid search with pagination...")
        result = await service.hybrid_search(
            query="tech",
            filters={},
            limit=5,
            offset=0
        )

        print(f"Search results: {len(result['results'])} found")
        print(f"Total found: {result['total_found']}")
        print(f"Search time: {result['search_time_ms']}ms")
        print(f"Pagination info: {result['search_insights'].get('pagination', 'N/A')}")

        assert result['success'] == True, "Hybrid search failed"
        assert 'results' in result, "Results not returned"
        assert 'search_insights' in result, "Search insights missing"
        print("✅ Hybrid search with pagination working")

        # Test pagination with offset
        print("\n📄 Testing pagination with offset...")
        result_page2 = await service.hybrid_search(
            query="tech",
            filters={},
            limit=5,
            offset=5
        )

        print(f"Page 2 results: {len(result_page2['results'])} found")
        print(f"Page 2 pagination: {result_page2['search_insights'].get('pagination', 'N/A')}")

        # Test filters
        print("\n🔧 Testing filters...")
        result_filtered = await service.hybrid_search(
            query="tech",
            filters={"platform": "youtube", "min_followers": "10000"},
            limit=5,
            offset=0
        )

        print(f"Filtered results: {len(result_filtered['results'])} found")
        print("✅ Filters working")

        # Test YouTube search
        print("\n📺 Testing YouTube-specific search...")
        youtube_results = await service.youtube_search(
            query="tech",
            filters={},
            limit=5
        )

        print(f"YouTube search results: {len(youtube_results)} found")
        print("✅ YouTube search working")

        print("\n🎉 All tests passed successfully!")

    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        db.close()

    return True

if __name__ == "__main__":
    success = asyncio.run(test_hybrid_search_service())
    sys.exit(0 if success else 1)
