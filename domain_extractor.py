#!/usr/bin/env python3
"""
Enhanced domain extraction for search results
"""

from urllib.parse import urlparse
import re

def extract_domain_info(url):
    """Extract domain and clean source name from URL"""
    try:
        parsed = urlparse(url.lower())
        domain = parsed.netloc.replace('www.', '')
        
        # Map domains to clean source names
        domain_to_source = {
            'cnn.com': 'CNN',
            'bbc.com': 'BBC News',
            'bbc.co.uk': 'BBC',
            'reuters.com': 'Reuters',
            'ap.org': 'Associated Press',
            'bloomberg.com': 'Bloomberg',
            'wsj.com': 'Wall Street Journal',
            'nytimes.com': 'The New York Times',
            'washingtonpost.com': 'The Washington Post',
            'theguardian.com': 'The Guardian',
            'npr.org': 'NPR',
            'abc.com': 'ABC News',
            'cbsnews.com': 'CBS News',
            'nbcnews.com': 'NBC News',
            'foxnews.com': 'Fox News',
            'politico.com': 'Politico',
            'axios.com': 'Axios',
            'thehill.com': 'The Hill',
            'newsweek.com': 'Newsweek',
            'time.com': 'TIME',
            'usatoday.com': 'USA Today',
            'latimes.com': 'Los Angeles Times',
            'nypost.com': 'New York Post',
            'techcrunch.com': 'TechCrunch',
            'wired.com': 'Wired',
            'theverge.com': 'The Verge',
            'ars-technica.com': 'Ars Technica',
            'arstechnica.com': 'Ars Technica',
            'engadget.com': 'Engadget',
            'gizmodo.com': 'Gizmodo',
            'mashable.com': 'Mashable',
            'venturebeat.com': 'VentureBeat',
            'zdnet.com': 'ZDNet',
            'cnet.com': 'CNET',
            'spotify.com': 'Spotify',
            'soundcloud.com': 'SoundCloud',
            'youtube.com': 'YouTube',
            'bandcamp.com': 'Bandcamp',
            'last.fm': 'Last.fm',
            'genius.com': 'Genius',
            'pitchfork.com': 'Pitchfork',
            'rollingstone.com': 'Rolling Stone',
            'billboard.com': 'Billboard',
            'allmusic.com': 'AllMusic',
            'discogs.com': 'Discogs',
            'variety.com': 'Variety',
            'hollywoodreporter.com': 'The Hollywood Reporter',
            'ew.com': 'Entertainment Weekly',
            'tmz.com': 'TMZ',
            'people.com': 'People',
            'usmagazine.com': 'Us Weekly',
            'deadline.com': 'Deadline',
            'vulture.com': 'Vulture',
            'avclub.com': 'The A.V. Club',
            'rottentomatoes.com': 'Rotten Tomatoes',
            'imdb.com': 'IMDb',
            'metacritic.com': 'Metacritic',
            'espn.com': 'ESPN',
            'si.com': 'Sports Illustrated',
            'bleacherreport.com': 'Bleacher Report',
            'cbssports.com': 'CBS Sports',
            'nbcsports.com': 'NBC Sports',
            'foxsports.com': 'Fox Sports',
            'nfl.com': 'NFL',
            'nba.com': 'NBA',
            'mlb.com': 'MLB',
            'nhl.com': 'NHL',
            'nature.com': 'Nature',
            'science.org': 'Science',
            'cell.com': 'Cell',
            'pnas.org': 'PNAS',
            'nejm.org': 'New England Journal of Medicine',
            'scientificamerican.com': 'Scientific American',
            'newscientist.com': 'New Scientist',
            'livescience.com': 'Live Science',
            'sciencedaily.com': 'Science Daily',
            'nasa.gov': 'NASA',
            'nih.gov': 'NIH',
            'cdc.gov': 'CDC',
            'who.int': 'WHO',
            'vogue.com': 'Vogue',
            'harpersbazaar.com': "Harper's Bazaar",
            'elle.com': 'Elle',
            'gq.com': 'GQ',
            'esquire.com': 'Esquire',
            'artnews.com': 'Art News',
            'artforum.com': 'Artforum',
            'frieze.com': 'Frieze',
            'hyperallergic.com': 'Hyperallergic',
            'metmuseum.org': 'The Met',
            'moma.org': 'MoMA',
            'guggenheim.org': 'Guggenheim',
            'tate.org.uk': 'Tate',
            'louvre.fr': 'Louvre',
            'smithsonianmag.com': 'Smithsonian Magazine',
            'nationalgeographic.com': 'National Geographic',
            'marketwatch.com': 'MarketWatch',
            'ft.com': 'Financial Times',
            'barrons.com': "Barron's",
            'investopedia.com': 'Investopedia',
            'nasdaq.com': 'NASDAQ',
            'nyse.com': 'NYSE',
            'morningstar.com': 'Morningstar',
            'benzinga.com': 'Benzinga',
            'ticketmaster.com': 'Ticketmaster'
        }
        
        # Try exact match first
        if domain in domain_to_source:
            return {
                'domain': domain,
                'source': domain_to_source[domain]
            }
        
        # Try partial matches for complex domains
        for known_domain, source_name in domain_to_source.items():
            if known_domain in domain:
                return {
                    'domain': domain,
                    'source': source_name
                }
        
        # Fallback: create a clean source name from domain
        clean_source = domain.split('.')[0].replace('-', ' ').replace('_', ' ').title()
        if clean_source.lower() in ['www', 'mobile', 'm', 'app']:
            clean_source = domain.split('.')[1].replace('-', ' ').replace('_', ' ').title()
        
        return {
            'domain': domain,
            'source': clean_source
        }
        
    except Exception as e:
        return {
            'domain': 'unknown',
            'source': 'Unknown Source'
        }

def enhance_search_results(results):
    """Enhance search results with domain information"""
    enhanced = []
    
    for result in results:
        url = result.get('url', '')
        domain_info = extract_domain_info(url)
        
        enhanced_result = result.copy()
        enhanced_result['domain'] = domain_info['domain']
        
        # Use provided source or extracted source
        if 'source' not in result or not result['source']:
            enhanced_result['source'] = domain_info['source']
        
        enhanced.append(enhanced_result)
    
    return enhanced

if __name__ == '__main__':
    # Test the extractor
    test_urls = [
        'https://www.cnn.com/politics/news',
        'https://techcrunch.com/openai-news',
        'https://www.billboard.com/music/taylor-swift',
        'https://www.nasa.gov/webb-telescope',
        'https://unknown-site.com/article'
    ]
    
    for url in test_urls:
        info = extract_domain_info(url)
        print(f"{url} -> {info['source']} ({info['domain']})")