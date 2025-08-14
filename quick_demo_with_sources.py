#!/usr/bin/env python3
"""
Quick demonstration script that shows sources alongside the analytics
"""

from api.search_logger import SearchLogger
from domain_extractor import extract_domain_info

def demo_with_sources():
    logger = SearchLogger()
    
    print("🎯 ENHANCED ANALYTICS DEMO - With Source Extraction")
    print("="*60)
    
    # Get categorized searches
    searches = logger.get_categorized_searches(limit=10)
    
    # Extract sources and create source statistics
    source_stats = {}
    domain_stats = {}
    
    print("\n📊 SEARCHES WITH SOURCES:")
    print("-" * 60)
    
    for search in searches:
        print(f"\n🔍 Query: {search['query']}")
        print(f"📅 Date: {search['timestamp'][:10]}")
        print(f"🏷️  Primary Category: {search['primary_category'].title()}")
        print(f"📰 Sources ({len(search['results'])}):")
        
        for result in search['results']:
            url = result.get('url', '')
            domain_info = extract_domain_info(url)
            source = domain_info['source']
            domain = domain_info['domain']
            category = result.get('category', 'general')
            title = result.get('title', 'Untitled')
            
            # Update statistics
            source_stats[source] = source_stats.get(source, 0) + 1
            domain_stats[domain] = domain_stats.get(domain, 0) + 1
            
            print(f"   • {source} | {category} | {title[:40]}...")
    
    print("\n" + "="*60)
    print("📈 SOURCE STATISTICS:")
    print("="*60)
    
    # Sort sources by frequency
    sorted_sources = sorted(source_stats.items(), key=lambda x: x[1], reverse=True)
    
    for source, count in sorted_sources:
        print(f"📰 {source:<25} | {count:2d} results")
    
    print(f"\n📊 SUMMARY:")
    print(f"   Total Searches: {len(searches)}")
    print(f"   Total Results: {sum(len(s['results']) for s in searches)}")
    print(f"   Unique Sources: {len(source_stats)}")
    print(f"   Unique Domains: {len(domain_stats)}")
    
    # Category breakdown
    all_categories = {}
    for search in searches:
        for cat, count in search['categories'].items():
            all_categories[cat] = all_categories.get(cat, 0) + count
    
    print(f"\n🏷️  CATEGORY BREAKDOWN:")
    for cat, count in sorted(all_categories.items(), key=lambda x: x[1], reverse=True):
        print(f"   {cat.title():<15} | {count:2d} results")

if __name__ == '__main__':
    demo_with_sources()