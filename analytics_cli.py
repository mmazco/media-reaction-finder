#!/usr/bin/env python3
"""
Command-line tool for viewing search analytics
Usage: python analytics_cli.py [command] [options]
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from api.search_logger import SearchLogger

def format_date(date_str):
    """Format date string for display"""
    if not date_str:
        return "N/A"
    try:
        date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return date_obj.strftime('%Y-%m-%d %H:%M:%S')
    except:
        return date_str

def show_stats(days=30):
    """Show overall statistics"""
    logger = SearchLogger()
    analytics = logger.get_analytics(days=days)
    
    print(f"\n📊 Search Analytics (Last {days} days)")
    print("=" * 50)
    
    stats = analytics['overall_stats']
    print(f"Total Searches: {stats.get('total_searches', 0)}")
    print(f"Unique Queries: {stats.get('unique_queries', 0)}")
    print(f"Average Results: {stats.get('avg_results', 0):.1f}")
    print(f"First Search: {format_date(stats.get('first_search'))}")
    print(f"Last Search: {format_date(stats.get('last_search'))}")
    
    print(f"\n🔍 Top Queries:")
    for i, query in enumerate(analytics['top_queries'][:10], 1):
        print(f"  {i:2d}. {query['query'][:60]:<60} ({query['count']} times)")
    
    print(f"\n📈 Search Types:")
    for search_type in analytics['search_types']:
        print(f"  {search_type['type']}: {search_type['count']} searches")

def show_history(limit=20, search_type=None, days=7):
    """Show recent search history"""
    logger = SearchLogger()
    date_from = (datetime.now() - timedelta(days=days)).date() if days else None
    history = logger.get_search_history(limit=limit, search_type=search_type, date_from=date_from)
    
    print(f"\n📝 Recent Search History (Last {limit} searches)")
    print("=" * 80)
    
    for item in history:
        timestamp = format_date(item['timestamp'])
        query = item['query'][:50] + "..." if len(item['query']) > 50 else item['query']
        results = item['results_count']
        processing_time = item['processing_time']
        time_str = f"{processing_time:.2f}s" if processing_time else "N/A"
        
        print(f"{timestamp} | {item['search_type']:<5} | {results:2d} results | {time_str:<6} | {query}")

def export_data(format_type='json', days=30, output_file=None):
    """Export search data"""
    logger = SearchLogger()
    date_from = (datetime.now() - timedelta(days=days)).date() if days else None
    
    data = logger.export_data(format=format_type, date_from=date_from)
    
    if output_file:
        with open(output_file, 'w') as f:
            f.write(data)
        print(f"✅ Data exported to {output_file}")
    else:
        print(data)

def search_queries(pattern):
    """Search for specific queries in history"""
    logger = SearchLogger()
    history = logger.get_search_history(limit=1000)
    
    matches = [item for item in history if pattern.lower() in item['query'].lower()]
    
    print(f"\n🔍 Found {len(matches)} searches matching '{pattern}':")
    print("=" * 80)
    
    for item in matches:
        timestamp = format_date(item['timestamp'])
        query = item['query'][:50] + "..." if len(item['query']) > 50 else item['query']
        results = item['results_count']
        
        print(f"{timestamp} | {item['search_type']:<5} | {results:2d} results | {query}")

def main():
    parser = argparse.ArgumentParser(description='Search Analytics CLI Tool')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show analytics statistics')
    stats_parser.add_argument('--days', type=int, default=30, help='Number of days to analyze (default: 30)')
    
    # History command
    history_parser = subparsers.add_parser('history', help='Show search history')
    history_parser.add_argument('--limit', type=int, default=20, help='Number of searches to show (default: 20)')
    history_parser.add_argument('--type', help='Filter by search type (news, reddit)')
    history_parser.add_argument('--days', type=int, default=7, help='Number of days to look back (default: 7)')
    
    # Export command
    export_parser = subparsers.add_parser('export', help='Export search data')
    export_parser.add_argument('--format', choices=['json', 'csv'], default='json', help='Export format (default: json)')
    export_parser.add_argument('--days', type=int, default=30, help='Number of days to export (default: 30)')
    export_parser.add_argument('--output', help='Output file path')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Search for specific queries')
    search_parser.add_argument('pattern', help='Pattern to search for in queries')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        if args.command == 'stats':
            show_stats(args.days)
        elif args.command == 'history':
            show_history(args.limit, args.type, args.days)
        elif args.command == 'export':
            export_data(args.format, args.days, args.output)
        elif args.command == 'search':
            search_queries(args.pattern)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()