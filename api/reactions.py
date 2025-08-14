from flask import Flask, request, jsonify
from flask_cors import CORS
from search import search_news
from reddit import search_reddit_posts, get_title_from_url
from summarize import summarize_text
from analytics import analytics_bp
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
                article_metadata['summary'] = "Summary not available - unable to extract article content."
                
            print(f"🧠 Extracted article: {article_title}")
        
        # Search news
        print("📰 Searching news...")
        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        news_results = search_news(query, user_ip=user_ip)
        
        # Search Reddit - for URLs, pass the URL directly
        print("📣 Searching Reddit...")
        
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