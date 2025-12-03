from flask import Flask, request, jsonify
from flask_cors import CORS
# For local development - use direct imports
try:
    from search import search_news
    from reddit import search_reddit_posts, get_title_from_url
    from summarize import summarize_text
    from search_logger import SearchLogger
except ImportError:
    # For Vercel deployment - use relative imports
    from .search import search_news
    from .reddit import search_reddit_posts, get_title_from_url
    from .summarize import summarize_text
    from .search_logger import SearchLogger

import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS - allow all origins in production (Vercel), restrict in development
if os.getenv('VERCEL_ENV'):
    # Production: allow all origins for Vercel deployment
    CORS(app, allow_headers=['Content-Type'], methods=['GET', 'POST'])
else:
    # Development: restrict to localhost
    CORS(app, origins=['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'], allow_headers=['Content-Type'], methods=['GET', 'POST'])

# Analytics module removed to fix import issues

def extract_article_metadata(url):
    """
    Extract title, source, date, and content from an article URL
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract title
        title = None
        
        # Try OpenGraph and meta tags first
        og_title = soup.find('meta', property='og:title')
        if og_title and og_title.get('content'):
            title = og_title.get('content').strip()
            print(f"✅ Found title from og:title: {title}")
        
        # Try h1 tag
        if not title:
            h1 = soup.find('h1')
            if h1:
                title = h1.get_text().strip()
                print(f"✅ Found title from h1: {title}")
        
        # Fallback to page title
        if not title and soup.title:
            title = soup.title.string.strip()
            print(f"✅ Found title from <title> tag: {title}")
            # Clean title by removing site name after | or -
            if "|" in title:
                title = title.split("|")[0].strip()
            elif " - " in title:
                parts = title.split(" - ")
                if len(parts) > 1:
                    title = parts[0].strip()
        
        # Extract source/publication
        source = None
        # Try different meta tags for publication
        source_selectors = [
            'meta[property="og:site_name"]',
            'meta[name="author"]',
            'meta[property="article:publisher"]',
            'meta[name="publisher"]'
        ]
        
        for selector in source_selectors:
            meta_tag = soup.select_one(selector)
            if meta_tag and meta_tag.get('content'):
                source = meta_tag.get('content')
                break
        
        # Fallback to domain name
        if not source:
            parsed_url = urlparse(url)
            source = parsed_url.netloc.replace('www.', '')
        
        # Extract publish date
        date_published = None
        date_selectors = [
            'meta[property="article:published_time"]',
            'meta[name="publish_date"]',
            'meta[name="date"]',
            'meta[property="og:published_time"]',
            'meta[name="article:published"]',
            'meta[itemprop="datePublished"]',
            'time[datetime]',
            'time[class*="publish"]',
            'time[class*="date"]',
            '[class*="publish-date"]',
            '[class*="article-date"]'
        ]
        
        for selector in date_selectors:
            date_elements = soup.select(selector)
            for date_element in date_elements:
                date_content = None
                # Try different attributes
                for attr in ['content', 'datetime', 'data-date', 'data-timestamp']:
                    if date_element.get(attr):
                        date_content = date_element.get(attr)
                        break
                
                # If no attribute found, try text content
                if not date_content and date_element.text.strip():
                    date_content = date_element.text.strip()
                
                if date_content:
                    try:
                        # Try different date formats
                        date_obj = None
                        date_formats = [
                            '%Y-%m-%dT%H:%M:%S%z',  # ISO format with timezone
                            '%Y-%m-%dT%H:%M:%S.%f%z',  # ISO format with microseconds
                            '%Y-%m-%dT%H:%M:%S',  # ISO format without timezone
                            '%Y-%m-%d %H:%M:%S',  # Common datetime format
                            '%Y-%m-%d',  # Just date
                            '%B %d, %Y',  # Month name, day, year
                            '%d %B %Y',  # Day, month name, year
                            '%Y/%m/%d',  # Date with slashes
                            '%d/%m/%Y',  # Date with slashes (European)
                            '%m/%d/%Y'   # Date with slashes (US)
                        ]
                        
                        # Clean the date string
                        date_content = date_content.strip()
                        if date_content.endswith('Z'):
                            date_content = date_content[:-1] + '+00:00'
                        
                        # Try each format
                        for fmt in date_formats:
                            try:
                                date_obj = datetime.strptime(date_content, fmt)
                                break
                            except:
                                continue
                        
                        # If no format worked but we have a timestamp
                        if not date_obj and date_content.isdigit():
                            try:
                                date_obj = datetime.fromtimestamp(int(date_content))
                            except:
                                pass
                        
                        if date_obj:
                            # Validate date is not in the future
                            current_date = datetime.now()
                            if date_obj > current_date:
                                continue
                            
                            date_published = date_obj.strftime('%B %d, %Y')
                            break
                    except:
                        continue
                
                if date_published:
                    break
            
            if date_published:
                break
        
        # Extract article content for summarization
        content = ""
        content_selectors = [
            'article',
            '[role="main"]',
            '.article-content',
            '.post-content',
            '.entry-content',
            '.story-content',
            '.article-body',
            '.post-body',
            'main',
            '[class*="content"]',
            '[class*="article"]',
            '[class*="story"]'
        ]
        
        print(f"🔍 Trying {len(content_selectors)} content selectors...")
        for selector in content_selectors:
            content_element = soup.select_one(selector)
            if content_element:
                # Remove script, style, nav, header, footer elements
                for unwanted in content_element(["script", "style", "nav", "header", "footer", "aside", "form"]):
                    unwanted.decompose()
                extracted = content_element.get_text()
                if len(extracted.strip()) > 200:  # Only accept if substantial content
                    content = extracted
                    print(f"✅ Found content with selector '{selector}': {len(content)} chars")
                    break
                else:
                    print(f"⏭️  Selector '{selector}' found but too short: {len(extracted.strip())} chars")
        
        # Fallback to all paragraphs
        if not content or len(content.strip()) < 200:
            print("🔄 Falling back to paragraph extraction...")
            paragraphs = soup.find_all('p')
            content = ' '.join([p.get_text() for p in paragraphs])
            print(f"   Extracted from {len(paragraphs)} paragraphs: {len(content)} chars")
        
        # Clean and limit content
        content = re.sub(r'\s+', ' ', content).strip()
        content = content[:5000]  # Limit for API processing
        
        print(f"📊 Final content length after cleaning: {len(content)} chars")
        
        return {
            'title': title or 'Article',
            'source': source or 'Unknown Source',
            'date': date_published or 'Date not available',
            'content': content,
            'url': url
        }
        
    except Exception as e:
        print(f"Error extracting article metadata: {e}")
        return {
            'title': 'Article',
            'source': 'Unknown Source', 
            'date': 'Date not available',
            'content': '',
            'url': url
        }

@app.route('/api/reactions', methods=['POST'])
def get_reactions():
    """
    Main endpoint to search for news and Reddit reactions
    """
    try:
        print("Starting get_reactions endpoint...")
        data = request.get_json()
        print(f"Received data: {data}")
        query = data.get('query', '')
        print(f"Extracted query: {query}")
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
        
        # Extract article metadata if URL is provided
        article_metadata = None
        article_title = None
        
        if query.startswith('http'):
            print(f"🔍 Extracting article metadata from URL...")
            article_metadata = extract_article_metadata(query)
            article_title = article_metadata['title']
            
            # Debug: Show what content was extracted
            content_length = len(article_metadata.get('content', ''))
            print(f"📄 Content extracted: {content_length} characters")
            if content_length > 0:
                print(f"   First 100 chars: {article_metadata['content'][:100]}...")
            
            # Generate article summary if content is available
            if article_metadata.get('content') and len(article_metadata['content'].strip()) > 100:
                print(f"📝 Generating article summary with OpenAI...")
                summary_task = "Provide a concise 100-word summary of this article, highlighting the main points and key information."
                article_metadata['summary'] = summarize_text(article_metadata['content'], summary_task)
                print(f"   Summary result: {article_metadata['summary'][:100]}...")
            else:
                warning_msg = "Summary not available - unable to extract sufficient article content (may be paywalled or blocked)"
                article_metadata['summary'] = warning_msg
                print(f"⚠️  {warning_msg}")
                
            print(f"🧠 Extracted article: {article_title}")
        
        # Search news
        print("📰 Searching news...")
        try:
            user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
            print(f"User IP: {user_ip}")
            news_results = search_news(query, user_ip=user_ip)
            print(f"News search completed. Found {len(news_results) if news_results else 0} results")
        except Exception as news_error:
            print(f"Error during news search: {str(news_error)}")
            news_results = []
        
        # Search Reddit - for URLs, pass the URL and article title for hybrid search
        print("📣 Searching Reddit...")
        try:
            # Debug: Test Reddit credentials directly in main function
            print("🔍 Testing Reddit API credentials...")
            reddit_client_id = os.getenv("REDDIT_CLIENT_ID")
            reddit_client_secret = os.getenv("REDDIT_CLIENT_SECRET") 
            reddit_user_agent = os.getenv("REDDIT_USER_AGENT")
            
            print(f"Reddit credentials status:")
            print(f"  Client ID: {'Present' if reddit_client_id else 'MISSING'}")
            print(f"  Client Secret: {'Present' if reddit_client_secret else 'MISSING'}")
            print(f"  User Agent: {'Present' if reddit_user_agent else 'MISSING'}")
            
            if reddit_client_id and reddit_client_secret and reddit_user_agent:
                print(f"  Client ID (first 8 chars): {reddit_client_id[:8]}...")
                print(f"  User Agent: {reddit_user_agent}")
            
            print("Calling search_reddit_posts...")
            # Pass article title for hybrid topic-based search
            reddit_results = search_reddit_posts(query, article_title=article_title)
            print(f"Reddit search completed. Found {len(reddit_results) if reddit_results else 0} results")
        except Exception as reddit_error:
            print(f"Error during Reddit search: {str(reddit_error)}")
            # Don't fail completely if Reddit search fails
            reddit_results = []
        
        # Filter out results from the same domain (don't show same website)
        if query.startswith('http'):
            # Extract domain from URL
            def get_domain(url):
                try:
                    parsed = urlparse(url)
                    # Remove 'www.' prefix for comparison
                    domain = parsed.netloc.lower().replace('www.', '')
                    return domain
                except:
                    return ''
            
            query_domain = get_domain(query)
            print(f"🔍 Original article domain: {query_domain}")
            
            # Filter web results - exclude same domain
            original_web_count = len(news_results) if news_results else 0
            news_results = [r for r in (news_results or []) 
                           if get_domain(r.get('url', '')) != query_domain]
            filtered_count = original_web_count - len(news_results)
            if filtered_count > 0:
                print(f"🔄 Filtered out {filtered_count} result(s) from same domain ({query_domain})")
            
            # Reddit results are fine - those are discussions, not articles from same site
            # But still filter if someone literally posted to the same domain
            original_reddit_count = len(reddit_results) if reddit_results else 0
            reddit_results = [r for r in (reddit_results or []) 
                             if get_domain(r.get('url', '')) != query_domain]
            if original_reddit_count > len(reddit_results):
                print(f"🔄 Filtered out {original_reddit_count - len(reddit_results)} Reddit result(s) from same domain")
        
        # Format response to match frontend expectations
        response = {
            'web': news_results,  # Frontend expects web search results
            'reddit': reddit_results,
            'article': article_metadata  # Include article metadata if URL was provided
        }
        
        # Log to SQLite
        try:
            logger = SearchLogger()
            all_results = []
            
            # Store the main article if it's a URL search
            if article_metadata:
                print(f"Logging article metadata: {article_metadata}")  # Debug print
                all_results.append({
                    'title': article_metadata.get('title', ''),
                    'url': query,
                    'summary': article_metadata.get('summary', ''),
                    'source': article_metadata.get('source', ''),
                    'date': article_metadata.get('date', ''),
                    'result_type': 'web'
                })
            
            print(f"Logging {len(all_results)} results to SQLite")  # Debug print
            
            # Store news results
            if news_results:
                all_results.extend([{
                    'title': article.get('title', ''),
                    'url': article.get('url', ''),
                    'summary': article.get('summary', ''),
                    'source': article.get('source', urlparse(article.get('url', '')).netloc),
                    'result_type': 'web'
                } for article in news_results])
            
            # Store reddit results    
            if reddit_results:
                all_results.extend([{
                    'title': post.get('title', ''),
                    'url': post.get('url', ''),
                    'summary': post.get('summary', ''),
                    'source': 'Reddit',
                    'result_type': 'reddit'
                } for post in reddit_results])

            # Log the search
            logger.log_search(
                query=query,
                search_type='url' if query.startswith('http') else 'text',
                user_ip=user_ip,
                results=all_results
            )
        except Exception as e:
            print(f"Error logging to SQLite: {e}")  # This will show us any errors
            # Don't return error - allow the search to succeed even if logging fails
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in search endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/summarize', methods=['POST'])
def summarize():
    """
    Endpoint to summarize text content
    """
    try:
        data = request.get_json()
        text = data.get('text', '')
        task = data.get('task', 'Summarize this content and classify its sentiment.')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        summary = summarize_text(text, task)
        
        return jsonify({
            'summary': summary,
            'original_length': len(text),
            'summary_length': len(summary)
        })
        
    except Exception as e:
        print(f"Error in summarize endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/collections', methods=['GET'])
def get_collections():
    """
    Get all curated collections with article counts
    """
    try:
        logger = SearchLogger()
        collections = logger.get_all_collections()
        return jsonify({'collections': collections})
    except Exception as e:
        print(f"Error getting collections: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/collections/<tag>', methods=['GET'])
def get_collection(tag):
    """
    Get articles in a specific collection
    """
    try:
        logger = SearchLogger()
        collection = logger.get_collection_by_tag(tag)
        if not collection:
            return jsonify({'error': 'Collection not found'}), 404
        
        articles = logger.get_collection_articles(tag)
        return jsonify({
            'collection': collection,
            'articles': articles
        })
    except Exception as e:
        print(f"Error getting collection {tag}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/collections/<tag>/add', methods=['POST'])
def add_to_collection(tag):
    """
    Add an article to a curated collection
    """
    try:
        data = request.get_json()
        url = data.get('url')
        title = data.get('title')
        source = data.get('source')
        authors = data.get('authors')
        date = data.get('date')
        summary = data.get('summary')
        
        if not url or not title:
            return jsonify({'error': 'URL and title are required'}), 400
        
        logger = SearchLogger()
        article_id = logger.add_article_to_collection(
            tag, title, url, source, authors, date, summary
        )
        
        if article_id:
            return jsonify({'success': True, 'article_id': article_id})
        else:
            return jsonify({'error': 'Article already exists in collection'}), 409
    except Exception as e:
        print(f"Error adding to collection: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/archive', methods=['GET'])
def get_archive():
    """
    Get shared search archive for all users
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        logger = SearchLogger()
        archive = logger.get_shared_archive(limit=limit)
        return jsonify({'archive': archive})
    except Exception as e:
        print(f"Error getting archive: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'message': 'Media Reaction Finder API is running'
    })

if __name__ == '__main__':
    # Use PORT environment variable for Railway, fallback to 5002 for local dev
    port = int(os.environ.get('PORT', 5002))
    print(f"🚀 Starting Media Reaction Finder API on port {port}")
    app.run(debug=False, host='0.0.0.0', port=port)

# For deployment
app = app