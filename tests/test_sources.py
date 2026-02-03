#!/usr/bin/env python3
"""
Test script to see current search data structure and sources
Run from project root: python tests/test_sources.py
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.search_logger import SearchLogger

def test_sources():
    logger = SearchLogger()
    
    # Get categorized searches
    searches = logger.get_categorized_searches(limit=10)
    
    print("📊 Current Search Data Structure:")
    print("="*50)
    
    for search in searches:
        print(f"\nQuery: {search['query']}")
        print(f"Results ({len(search['results'])}):")
        
        for result in search['results']:
            source = result.get('source', 'No source info')
            domain = result.get('domain', 'No domain info')
            category = result.get('category', 'No category')
            title = result.get('title', 'No title')[:50]
            
            print(f"  • {title}... | {source} | {category}")
        
        print(f"Categories: {search['categories']}")
        print("-" * 30)

if __name__ == '__main__':
    test_sources()