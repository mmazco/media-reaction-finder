from flask import Flask, request, jsonify
from flask_cors import CORS
from search import search_news
from reddit import search_reddit_posts, get_title_from_url
from summarize import summarize_text
# from api.analytics import analytics_bp
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
# Enable CORS for the frontend running on localhost:5173, 5174, 5175, 5176
CORS(app, origins=['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'], allow_headers=['Content-Type'], methods=['GET', 'POST'])

# Register analytics blueprint
# app.register_blueprint(analytics_bp)

def extract_article_metadata(url):
    """
    Extract title, source, date, and content from an article URL
    """
    try:
        # More comprehensive headers to avoid bot detection
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        }
        
        # Add a session for better handling
        session = requests.Session()
        session.headers.update(headers)
        
        response = session.get(url, timeout=15, allow_redirects=True)
        
        # Check for specific error codes that indicate access restrictions
        if response.status_code == 401:
            print(f"⚠️  Access denied (401) for {url} - likely paywall or subscription required")
        elif response.status_code == 403:
            print(f"⚠️  Forbidden (403) for {url} - likely bot detection or regional restriction")
        elif response.status_code == 429:
            print(f"⚠️  Rate limited (429) for {url} - too many requests")
        
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
            'time[datetime]'
        ]
        
        for selector in date_selectors:
            date_element = soup.select_one(selector)
            if date_element:
                date_content = date_element.get('content') or date_element.get('datetime')
                if date_content:
                    try:
                        # Parse various date formats
                        if 'T' in date_content:
                            date_obj = datetime.fromisoformat(date_content.replace('Z', '+00:00'))
                        else:
                            date_obj = datetime.strptime(date_content, '%Y-%m-%d')
                        
                        # Validate date is not in the future
                        current_date = datetime.now()
                        if date_obj > current_date:
                            # If date is in future, likely parsing error - skip this date
                            continue
                            
                        date_published = date_obj.strftime('%B %d, %Y')
                        break
                    except:
                        continue
        
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
        
    except requests.exceptions.HTTPError as e:
        error_msg = f"HTTP error extracting article: {e}"
        print(error_msg)
        
        # Try to extract basic info from URL for better fallback
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.replace('www.', '')
        
        # Create a more informative error message based on status code
        if hasattr(e.response, 'status_code'):
            if e.response.status_code == 401:
                error_msg = "Article requires subscription or login to access content."
            elif e.response.status_code == 403:
                error_msg = "Access to article content is restricted (bot detection or regional restrictions)."
            elif e.response.status_code == 429:
                error_msg = "Too many requests - article content temporarily unavailable."
            else:
                error_msg = f"Unable to access article content (HTTP {e.response.status_code})."
        
        return {
            'title': f'Article from {domain}',
            'source': domain.split('.')[0].capitalize() if domain else 'Unknown Source',
            'date': 'Date not available',
            'content': '',
            'url': url,
            'error': error_msg
        }
        
    except Exception as e:
        error_msg = f"Error extracting article metadata: {e}"
        print(error_msg)
        
        # Try to extract basic info from URL for better fallback
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.replace('www.', '') if parsed_url.netloc else 'Unknown Source'
        
        return {
            'title': f'Article from {domain}' if domain != 'Unknown Source' else 'Article',
            'source': domain.split('.')[0].capitalize() if domain != 'Unknown Source' else 'Unknown Source',
            'date': 'Date not available',
            'content': '',
            'url': url,
            'error': error_msg
        }

@app.route('/api/reactions', methods=['POST'])
def get_reactions():
    """
    Main endpoint to search for news and Reddit reactions
    """
    try:
        data = request.get_json()
        query = data.get('query', '')
        
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
                # Use error message if available, otherwise generic message
                if 'error' in article_metadata:
                    article_metadata['summary'] = article_metadata['error']
                else:
                    article_metadata['summary'] = "Summary not available - unable to extract article content."
                
            print(f"🧠 Extracted article: {article_title}")
        
        # Search news
        print("📰 Searching news...")
        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        news_results = search_news(query, user_ip=user_ip)
        
        # Search Reddit - for URLs, pass the URL directly
        print("📣 Searching Reddit...")
        reddit_results = search_reddit_posts(query)
        
        # Add summaries to Reddit posts
        for post in reddit_results:
            if post.get("comments"):
                combined = " ".join(post["comments"][:5])
                post["summary"] = summarize_text(combined)
        
        # Format response to match frontend expectations
        response = {
            'news': news_results,  # Frontend expects list of [title, link] tuples
            'reddit': reddit_results,
            'article': article_metadata  # Include article metadata if URL was provided
        }
        
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