#!/usr/bin/env python3
"""
SerpAPI Search History Extractor and Analyzer

This tool extracts search history from SerpAPI and categorizes URLs automatically.
Since SerpAPI doesn't provide direct API access to search history, this tool
provides multiple methods to import your search data.
"""

import json
import re
import requests
import argparse
import sys
from datetime import datetime
from urllib.parse import urlparse
from api.search_logger import SearchLogger
from domain_extractor import enhance_search_results
import time

class URLCategorizer:
    """Categorizes URLs into topics like News, Music, Culture, etc."""
    
    def __init__(self):
        # Domain-based categorization patterns
        self.domain_patterns = {
            'news': [
                'cnn.com', 'bbc.com', 'reuters.com', 'ap.org', 'bloomberg.com',
                'wsj.com', 'nytimes.com', 'washingtonpost.com', 'theguardian.com',
                'npr.org', 'abc.com', 'cbsnews.com', 'nbcnews.com', 'foxnews.com',
                'politico.com', 'axios.com', 'thehill.com', 'newsweek.com',
                'time.com', 'usatoday.com', 'latimes.com', 'nypost.com',
                'dailymail.co.uk', 'sky.com', 'independent.co.uk', 'metro.co.uk'
            ],
            'music': [
                'spotify.com', 'apple.com/music', 'youtube.com/music', 'soundcloud.com',
                'bandcamp.com', 'last.fm', 'genius.com', 'pitchfork.com',
                'rollingstone.com', 'billboard.com', 'allmusic.com', 'discogs.com',
                'musicbrainz.org', 'pandora.com', 'deezer.com', 'tidal.com',
                'musictheory.net', 'songkick.com', 'setlist.fm', 'rateyourmusic.com'
            ],
            'culture': [
                'artforum.com', 'artnet.com', 'artnews.com', 'frieze.com',
                'hyperallergic.com', 'artsy.net', 'moma.org', 'metmuseum.org',
                'guggenheim.org', 'whitney.org', 'tate.org.uk', 'louvre.fr',
                'smithsonianmag.com', 'nationalgeographic.com', 'archaeologymagazine.org',
                'americanart.si.edu', 'nga.gov', 'brooklynmuseum.org'
            ],
            'tech': [
                'techcrunch.com', 'wired.com', 'theverge.com', 'ars-technica.com',
                'engadget.com', 'gizmodo.com', 'mashable.com', 'recode.net',
                'venturebeat.com', 'arstechnica.com', 'zdnet.com', 'cnet.com',
                'computerworld.com', 'infoworld.com', 'pcmag.com', 'pcworld.com',
                'tomshardware.com', 'anandtech.com', 'slashdot.org', 'hackaday.com'
            ],
            'entertainment': [
                'variety.com', 'hollywood.com', 'eonline.com', 'tmz.com',
                'people.com', 'usmagazine.com', 'ew.com', 'accesshollywood.com',
                'extratv.com', 'etonline.com', 'justjared.com', 'perezhilton.com',
                'deadline.com', 'hollywoodreporter.com', 'vulture.com', 'avclub.com',
                'rottentomatoes.com', 'imdb.com', 'metacritic.com', 'filmstruck.com'
            ],
            'sports': [
                'espn.com', 'sports.com', 'si.com', 'bleacherreport.com',
                'cbssports.com', 'nbcsports.com', 'foxsports.com', 'tsn.ca',
                'sportsnet.ca', 'skysports.com', 'bbc.com/sport', 'eurosport.com',
                'nfl.com', 'nba.com', 'mlb.com', 'nhl.com', 'fifa.com',
                'uefa.com', 'olympics.com', 'athletic.com', 'deadspin.com'
            ],
            'politics': [
                'politico.com', 'thehill.com', 'rollcall.com', 'congress.gov',
                'whitehouse.gov', 'senate.gov', 'house.gov', 'supremecourt.gov',
                'fec.gov', 'opensecrets.org', 'ballotpedia.org', 'vote411.org',
                'factcheck.org', 'snopes.com', 'politifact.com', 'realclearpolitics.com'
            ],
            'science': [
                'nature.com', 'science.org', 'cell.com', 'pnas.org', 'nejm.org',
                'sciencemag.org', 'scientificamerican.com', 'newscientist.com',
                'livescience.com', 'sciencedaily.com', 'phys.org', 'eurekalert.org',
                'nasa.gov', 'nih.gov', 'cdc.gov', 'who.int', 'arxiv.org'
            ],
            'business': [
                'wsj.com', 'ft.com', 'bloomberg.com', 'reuters.com/business',
                'cnbc.com', 'marketwatch.com', 'barrons.com', 'investopedia.com',
                'sec.gov', 'edgar.gov', 'nasdaq.com', 'nyse.com', 'morningstar.com',
                'yahoo.com/finance', 'google.com/finance', 'benzinga.com'
            ]
        }
        
        # URL path and content-based patterns
        self.path_patterns = {
            'music': ['/music/', '/song/', '/album/', '/artist/', '/playlist/', '/track/'],
            'news': ['/news/', '/politics/', '/world/', '/breaking/', '/latest/'],
            'sports': ['/sports/', '/football/', '/basketball/', '/baseball/', '/soccer/'],
            'tech': ['/technology/', '/tech/', '/gadgets/', '/software/', '/hardware/'],
            'culture': ['/culture/', '/arts/', '/museum/', '/gallery/', '/exhibition/'],
            'entertainment': ['/entertainment/', '/movies/', '/tv/', '/celebrity/', '/hollywood/'],
            'science': ['/science/', '/research/', '/study/', '/health/', '/medical/'],
            'business': ['/business/', '/finance/', '/economy/', '/market/', '/stocks/']
        }

    def categorize_url(self, url):
        """Categorize a URL based on domain and path patterns"""
        try:
            parsed = urlparse(url.lower())
            domain = parsed.netloc.replace('www.', '')
            path = parsed.path
            
            # Check domain patterns first
            for category, domains in self.domain_patterns.items():
                if any(d in domain for d in domains):
                    return category
            
            # Check path patterns
            for category, paths in self.path_patterns.items():
                if any(p in path for p in paths):
                    return category
            
            # Default fallback
            return 'general'
            
        except Exception as e:
            print(f"Error categorizing URL {url}: {e}")
            return 'unknown'

    def analyze_title_content(self, title, snippet=""):
        """Analyze title and snippet for additional categorization clues"""
        content = (title + " " + snippet).lower()
        
        # Keywords for each category
        keywords = {
            'music': ['song', 'album', 'artist', 'band', 'concert', 'tour', 'lyrics', 'music'],
            'news': ['breaking', 'reports', 'announces', 'says', 'according', 'sources'],
            'sports': ['game', 'match', 'championship', 'league', 'team', 'player', 'score'],
            'tech': ['software', 'app', 'device', 'technology', 'digital', 'ai', 'startup'],
            'culture': ['art', 'culture', 'museum', 'exhibition', 'artist', 'gallery'],
            'entertainment': ['movie', 'film', 'actor', 'actress', 'celebrity', 'tv show'],
            'science': ['study', 'research', 'scientists', 'discovery', 'health', 'medical'],
            'business': ['company', 'stock', 'market', 'economy', 'financial', 'business']
        }
        
        scores = {}
        for category, words in keywords.items():
            scores[category] = sum(1 for word in words if word in content)
        
        # Return category with highest score, or None if no clear winner
        if max(scores.values()) > 0:
            return max(scores, key=scores.get)
        return None

class SerpAPIHistoryExtractor:
    """Extract and import SerpAPI search history"""
    
    def __init__(self):
        self.categorizer = URLCategorizer()
        self.logger = SearchLogger()

    def import_from_manual_data(self, searches_data):
        """Import searches from manually provided data structure"""
        imported = 0
        
        for search_data in searches_data:
            try:
                # Extract search information
                query = search_data.get('query', '')
                timestamp = search_data.get('timestamp', datetime.now().isoformat())
                results = search_data.get('results', [])
                
                # Enhance results with domain info
                enhanced_results = enhance_search_results(results)
                
                # Categorize each result
                categorized_results = []
                for result in enhanced_results:
                    url = result.get('url', result.get('link', ''))
                    title = result.get('title', '')
                    snippet = result.get('snippet', result.get('summary', ''))
                    
                    # Determine category
                    category = self.categorizer.categorize_url(url)
                    if category == 'general':
                        # Try content-based categorization
                        content_category = self.categorizer.analyze_title_content(title, snippet)
                        if content_category:
                            category = content_category
                    
                    categorized_result = {
                        'title': title,
                        'url': url,
                        'summary': snippet,
                        'category': category,
                        'source': result.get('source', 'Unknown Source'),
                        'domain': result.get('domain', 'unknown')
                    }
                    categorized_results.append(categorized_result)
                
                # Log to database
                search_id = self.logger.log_search(
                    query=query,
                    search_type="imported",
                    results=categorized_results,
                    processing_time=0,
                    search_params={'source': 'serpapi_history'},
                    serpapi_response={'imported': True, 'timestamp': timestamp}
                )
                
                imported += 1
                print(f"✅ Imported search: {query[:50]}{'...' if len(query) > 50 else ''}")
                
            except Exception as e:
                print(f"❌ Error importing search: {e}")
                continue
        
        return imported

    def import_from_json_file(self, file_path):
        """Import searches from a JSON file"""
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            # Handle different JSON structures
            if isinstance(data, list):
                searches = data
            elif isinstance(data, dict) and 'searches' in data:
                searches = data['searches']
            else:
                searches = [data]  # Single search object
            
            return self.import_from_manual_data(searches)
            
        except Exception as e:
            print(f"❌ Error reading JSON file: {e}")
            return 0

    def create_sample_data(self):
        """Create sample search data for testing"""
        sample_searches = [
            {
                'query': 'Taylor Swift new album 2024',
                'timestamp': '2024-01-15T10:30:00',
                'results': [
                    {
                        'title': 'Taylor Swift Announces New Album Release Date',
                        'url': 'https://www.billboard.com/music/taylor-swift-new-album',
                        'snippet': 'Pop superstar Taylor Swift announced her upcoming album...'
                    },
                    {
                        'title': 'Taylor Swift Album Review - Rolling Stone',
                        'url': 'https://www.rollingstone.com/music/taylor-swift-review',
                        'snippet': 'Music review of the latest Taylor Swift album release...'
                    }
                ]
            },
            {
                'query': 'climate change latest research',
                'timestamp': '2024-01-14T14:20:00',
                'results': [
                    {
                        'title': 'New Climate Study Shows Accelerating Warming',
                        'url': 'https://www.nature.com/articles/climate-study-2024',
                        'snippet': 'Scientists report new findings on climate change impacts...'
                    },
                    {
                        'title': 'Climate Research Published in Science Journal',
                        'url': 'https://www.science.org/climate-research-2024',
                        'snippet': 'Latest research on global warming trends and predictions...'
                    }
                ]
            },
            {
                'query': 'AI artificial intelligence news',
                'timestamp': '2024-01-13T09:15:00',
                'results': [
                    {
                        'title': 'OpenAI Releases New AI Model',
                        'url': 'https://techcrunch.com/openai-new-model-release',
                        'snippet': 'Technology company OpenAI announced a breakthrough in AI...'
                    },
                    {
                        'title': 'The Future of Artificial Intelligence',
                        'url': 'https://www.wired.com/story/future-artificial-intelligence',
                        'snippet': 'Exploring the latest developments in AI technology...'
                    }
                ]
            }
        ]
        
        return self.import_from_manual_data(sample_searches)

def main():
    parser = argparse.ArgumentParser(description='SerpAPI History Extractor and Analyzer')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Import from JSON file
    import_parser = subparsers.add_parser('import', help='Import search history from JSON file')
    import_parser.add_argument('file', help='JSON file containing search history')
    
    # Create sample data
    sample_parser = subparsers.add_parser('sample', help='Create sample search data for testing')
    
    # Test categorization
    test_parser = subparsers.add_parser('test', help='Test URL categorization')
    test_parser.add_argument('url', help='URL to categorize')
    
    # Manual input mode
    manual_parser = subparsers.add_parser('manual', help='Manually input search data')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        print("\n" + "="*60)
        print("📋 HOW TO EXTRACT YOUR SERPAPI SEARCH HISTORY:")
        print("="*60)
        print("\n1. 🔍 OPTION 1: Browser Console Method")
        print("   a. Go to https://serpapi.com/searches")
        print("   b. Open browser developer tools (F12)")
        print("   c. Go to Console tab")
        print("   d. Paste this JavaScript code:")
        print("""
   // Extract search history from SerpAPI dashboard
   let searches = [];
   document.querySelectorAll('[data-search-id]').forEach(el => {
       const query = el.querySelector('.search-query')?.textContent?.trim();
       const timestamp = el.querySelector('.search-timestamp')?.textContent?.trim();
       if (query) {
           searches.push({
               query: query,
               timestamp: timestamp || new Date().toISOString(),
               results: [] // Results would need manual extraction
           });
       }
   });
   console.log(JSON.stringify(searches, null, 2));
        """)
        print("\n   e. Copy the JSON output and save to a file")
        print("   f. Run: python3 serpapi_history_extractor.py import your_file.json")
        
        print("\n2. 📝 OPTION 2: Manual CSV Export")
        print("   If you can export search history as CSV from SerpAPI:")
        print("   a. Convert CSV to JSON format")
        print("   b. Run the import command")
        
        print("\n3. 🧪 OPTION 3: Test with Sample Data")
        print("   python3 serpapi_history_extractor.py sample")
        
        print("\n4. 🔧 OPTION 4: Manual Input")
        print("   python3 serpapi_history_extractor.py manual")
        
        return
    
    extractor = SerpAPIHistoryExtractor()
    
    try:
        if args.command == 'import':
            imported = extractor.import_from_json_file(args.file)
            print(f"\n✅ Successfully imported {imported} searches!")
            
        elif args.command == 'sample':
            imported = extractor.create_sample_data()
            print(f"\n✅ Created {imported} sample searches for testing!")
            
        elif args.command == 'test':
            category = extractor.categorizer.categorize_url(args.url)
            print(f"\n🏷️  URL: {args.url}")
            print(f"📂 Category: {category}")
            
        elif args.command == 'manual':
            print("\n📝 Manual Search Entry Mode")
            print("Enter your searches one by one (press Ctrl+C when done):")
            
            searches = []
            try:
                while True:
                    query = input("\nSearch query: ").strip()
                    if not query:
                        continue
                    
                    # Simple manual entry - in real scenario you'd add more details
                    search_data = {
                        'query': query,
                        'timestamp': datetime.now().isoformat(),
                        'results': []  # Would be populated with actual results
                    }
                    searches.append(search_data)
                    print(f"✅ Added: {query}")
                    
            except KeyboardInterrupt:
                if searches:
                    imported = extractor.import_from_manual_data(searches)
                    print(f"\n✅ Imported {imported} searches!")
                else:
                    print("\n❌ No searches entered.")
                    
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()