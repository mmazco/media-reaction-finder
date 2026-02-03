#!/usr/bin/env python3
"""
Test if we have detailed results with URLs to extract sources from
Run from project root: python tests/test_detailed_results.py
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.search_logger import SearchLogger
from domain_extractor import extract_domain_info

def test_detailed_results():
    logger = SearchLogger()
    
    # Get categorized searches
    searches = logger.get_categorized_searches(limit=2)
    
    print("🔍 Testing Detailed Search Results:")
    print("="*50)
    
    for search in searches:
        print(f"\nQuery: {search['query']}")
        print(f"Results: {len(search['results'])}")
        
        if search['results']:
            print("📄 Individual Results:")
            for i, result in enumerate(search['results'][:3]):  # Show first 3
                title = result.get('title', 'No title')[:40]
                url = result.get('url', 'No URL')
                category = result.get('category', 'No category')
                
                if url and url != 'No URL':
                    domain_info = extract_domain_info(url)
                    source = domain_info['source']
                    print(f"  {i+1}. {source} | {category} | {title}...")
                else:
                    print(f"  {i+1}. No URL available | {category} | {title}...")
        else:
            print("❌ No detailed results found")
        
        print("-" * 30)

if __name__ == '__main__':
    test_detailed_results()