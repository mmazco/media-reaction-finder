from flask import Flask, request, jsonify
from flask_cors import CORS
from api.search import search_news
from api.reddit import search_reddit_posts, get_title_from_url
from api.summarize import summarize_text
from api.analytics import analytics_bp
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re
from datetime import datetime
from dotenv import load_dotenv
from api.search_logger import SearchLogger

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

# Register analytics blueprint
app.register_blueprint(analytics_bp)

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
        if soup.title:
            title = soup.title.string.strip()
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
            'main'
        ]
        
        for selector in content_selectors:
            content_element = soup.select_one(selector)
            if content_element:
                # Remove script and style elements
                for script in content_element(["script", "style"]):
                    script.decompose()
                content = content_element.get_text()
                break
        
        # Fallback to all paragraphs
        if not content:
            paragraphs = soup.find_all('p')
            content = ' '.join([p.get_text() for p in paragraphs])
        
        # Clean and limit content
        content = re.sub(r'\s+', ' ', content).strip()
        content = content[:5000]  # Limit for API processing
        
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
            
            # Generate article summary if content is available
            if article_metadata['content']:
                print(f"📝 Generating article summary...")
                summary_task = "Provide a concise 100-word summary of this article, highlighting the main points and key information."
                article_metadata['summary'] = summarize_text(article_metadata['content'], summary_task)
            else:
                article_metadata['summary'] = "Summary not available - unable to extract article content."
                
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
        
        # Search Reddit - for URLs, pass the URL directly
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
            reddit_results = search_reddit_posts(query)
            print(f"Reddit search completed. Found {len(reddit_results) if reddit_results else 0} results")
        except Exception as reddit_error:
            print(f"Error during Reddit search: {str(reddit_error)}")
            # Don't fail completely if Reddit search fails
            reddit_results = []
        
        # Add summaries to Reddit posts
        for post in reddit_results:
            try:
                if post.get("comments"):
                    combined = " ".join(post["comments"][:5])
                    print(f"Summarizing comments for post: {post.get('title', '')[:50]}...")
                    post["summary"] = summarize_text(combined)
            except Exception as summary_error:
                print(f"Error summarizing post: {str(summary_error)}")
                post["summary"] = "Error generating summary"
        
        # Format response to match frontend expectations
        response = {
            'news': news_results,  # Frontend expects list of [title, link] tuples
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
    # Run the Flask app on port 5002 to avoid conflicts
    print("🚀 Starting Media Reaction Finder API on http://localhost:5002")
    app.run(debug=True, port=5002)

# For Vercel deployment
app = app