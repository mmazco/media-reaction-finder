from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from search import search_news
from api.reddit import search_reddit_posts, get_title_from_url
from api.twitter import search_twitter_posts, get_trending_tweets
from summarize import summarize_text, get_openai_client
from api.search_logger import SearchLogger
import json as json_module
from api.meta_commentary import generate_audio_commentary
import os
import sqlite3
from concurrent.futures import ThreadPoolExecutor
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, unquote
import re
from datetime import datetime
from dotenv import load_dotenv

# File extensions that indicate downloadable files (security risk)
DOWNLOADABLE_FILE_EXTENSIONS = {
    # Documents
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp',
    '.rtf', '.tex', '.wpd', '.pdf',
    # Archives
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
    # Executables (high risk)
    '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.app', '.bat', '.cmd', '.sh',
    # Other binary formats
    '.bin', '.iso', '.img',
    # Media that auto-downloads
    '.mp3', '.wav', '.mp4', '.avi', '.mov', '.mkv',
    # Data files
    '.csv', '.json', '.xml', '.sql',
}

# URL patterns that suggest file downloads
FILE_DOWNLOAD_URL_PATTERNS = [
    r'/download/',
    r'/downloads/',
    r'/file/',
    r'/files/',
    r'/attachment/',
    r'/attachments/',
    r'[?&]download=',
    r'[?&]action=download',
    r'/personCV/',  # Academic CV pattern (like Georgia Tech)
    r'/cv\.',
    r'/resume\.',
]

def is_file_download_url(url):
    """
    Detect if a URL is likely to trigger a file download.
    Returns True if the URL appears to be a direct file download link.
    """
    if not url:
        return False
    
    try:
        # Decode URL-encoded characters
        decoded_url = unquote(url).lower()
        parsed = urlparse(decoded_url)
        path = parsed.path.lower()
        
        # Check for file extensions
        for ext in DOWNLOADABLE_FILE_EXTENSIONS:
            if path.endswith(ext):
                return True
        
        # Check for download URL patterns
        full_url = decoded_url
        for pattern in FILE_DOWNLOAD_URL_PATTERNS:
            if re.search(pattern, full_url, re.IGNORECASE):
                return True
        
        return False
    except Exception:
        return False

def add_file_download_flags(results):
    """
    Add is_file_download flag to each result in the list.
    """
    for result in results:
        url = result.get('url', '')
        result['is_file_download'] = is_file_download_url(url)
    return results

_CATEGORY_LABELS = ["Mainstream Coverage", "Analysis", "Opinion"]

def classify_web_results(results, article_title=None):
    """
    Classify each web result into a category with a one-line reason.
    Uses a single LLM call for all results to keep costs low.
    """
    if not results:
        return results

    titles_block = "\n".join(
        f'{i+1}. "{r.get("title", "")}" — {r.get("summary", "")[:120]}'
        for i, r in enumerate(results)
    )

    context = f'Article: "{article_title}"\n\n' if article_title else ""
    prompt = (
        f"{context}Classify each search result below into ONE of these categories: "
        f"{', '.join(_CATEGORY_LABELS)}.\n"
        "For each result, output ONLY a JSON array of objects with keys \"index\" (1-based), "
        "\"category\", and \"reason\" (one short sentence explaining why).\n\n"
        f"Results:\n{titles_block}\n\n"
        "Output ONLY valid JSON — no markdown fences, no commentary."
    )

    system_msg = "You classify news/web results. Respond with raw JSON only."
    raw = None

    # Try OpenAI first
    try:
        client = get_openai_client()
        if client:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            raw = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"⚠️ OpenAI classification failed, trying Gemini: {e}")

    # Fallback to Gemini
    if raw is None:
        try:
            import google.generativeai as genai
            gemini_key = os.getenv("GEMINI_API_KEY")
            if gemini_key:
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-2.0-flash')
                response = model.generate_content(f"{system_msg}\n\n{prompt}")
                raw = response.text.strip()
        except Exception as e:
            print(f"⚠️ Gemini classification also failed: {e}")

    if raw:
        try:
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
            classifications = json_module.loads(raw)
            lookup = {c["index"]: c for c in classifications}
            for i, result in enumerate(results):
                entry = lookup.get(i + 1, {})
                result["category_label"] = entry.get("category", "")
                result["category_reason"] = entry.get("reason", "")
        except Exception as e:
            print(f"⚠️ Classification parse failed (non-blocking): {e}")

    return results


# Load environment variables (check both .env and .env.local)
load_dotenv()
load_dotenv('.env.local', override=True)

# Singleton search logger -- reused across all endpoints to avoid
# repeated DB init and connection overhead per request
logger = SearchLogger()

# Set up Flask - disable built-in static handling, we handle it ourselves for SPA support
app = Flask(__name__, static_folder=None)

def update_recommended_articles():
    """Update recommended flags on existing articles (runs every startup)"""
    try:
        recommended_urls = [
            'https://palestinenexus.com/articles/eugenicism',
            'https://jewishcurrents.org/portrait-of-a-campus-in-crisis',
            'https://substack.com/home/post/p-166396887',
            'https://ai-2027.com/',
            'https://askell.io/publications/',
            'https://ii.inc/web/blog/post/tle',
            'https://models.com/oftheminute/?p=168720',
            'https://substack.com/@trishestalks/p-176272631',
            'https://www.noemamag.com/building-a-prosocial-media-ecosystem/',
            # Iran collection
            'https://www.euronews.com/2026/01/05/tehrans-method-of-governance-has-reached-a-dead-end-former-top-adviser-tells-euronews',
            'https://www.jadaliyya.com/Details/46906',
            'https://carnegieendowment.org/research/2025/07/iran-israel-ai-war-propaganda-is-a-warning-to-the-world?lang=en',
            # AI collection
            'https://ai-frontiers.org/articles/ai-will-be-your-personal-political-proxy',
        ]
        conn = sqlite3.connect(logger.db_path)
        cursor = conn.cursor()
        for url in recommended_urls:
            cursor.execute('UPDATE curated_articles SET recommended = 1 WHERE url = ?', (url,))
        conn.commit()
        conn.close()
        print("⭐ Updated recommended articles")
    except Exception as e:
        print(f"⚠️ Error updating recommended: {e}")

def seed_collections_on_startup():
    """Seed collections if they don't exist (for fresh deployments)"""
    try:
        existing = logger.get_all_collections()
        
        # Only seed if no collections exist
        if len(existing) == 0:
            print("🌱 Seeding collections for fresh deployment...")
            
            # Create collections
            collections = [
                ('palestine', 'Palestine', '', "Coverage on Israel's genocide in Gaza and embracing Palestinian culture"),
                ('culture', 'Culture', '', 'Arts, music, and cultural commentary'),
                ('ai', 'AI', '', 'Artificial intelligence news and developments'),
                ('internet', 'Internet', '', 'Digital culture and online trends'),
                ('politics', 'Politics', '', 'Political news and analysis'),
            ]
            
            for tag, display_name, icon, description in collections:
                if not logger.get_collection_by_tag(tag):
                    logger.create_collection(tag, display_name, icon, description)
                    print(f"  ✅ Created '{display_name}' collection")
            
            # Add sample articles to collections
            # Format: (title, url, source, authors, date, summary, recommended)
            sample_articles = {
                'palestine': [
                    ('The eugenist history of the Zionist movement', 'https://palestinenexus.com/articles/eugenicism', 'Palestine Nexus', None, None, 'From the late 19th century through the 1950s, Zionist leaders adopted a selective immigration policy.', True),
                    ('Portrait of a Campus in Crisis', 'https://jewishcurrents.org/portrait-of-a-campus-in-crisis', 'Jewish Currents', None, None, 'An examination of campus dynamics amid the Israel-Palestine conflict.', True),
                    ('Palestinians Are on Their Own', 'https://substack.com/home/post/p-166396887', 'Substack', None, None, 'Analysis of the current political situation facing Palestinians.', True),
                    ('There Is No Peace in Gaza', 'https://www.newyorker.com/news/essay/there-is-no-peace-in-gaza', 'The New Yorker', None, None, 'An essay examining the ongoing conflict and humanitarian situation in Gaza.', False),
                    ('Israel\'s Genocide Continues Unabated', 'https://www.amnesty.org/en/latest/news/2025/11/israels-genocide-against-palestinians-in-gaza-continues-unabated-despite-ceasefire/', 'Amnesty International', None, None, 'Amnesty International reports on ongoing violations despite ceasefire.', False),
                    ('The Israel Lobby Is Melting Down', 'https://mondoweiss.net/2025/12/the-israel-lobby-is-melting-down-before-our-eyes/', 'Mondoweiss', None, None, 'Analysis of shifting political dynamics around Israel advocacy.', False),
                    ('Politics of Counting Gaza\'s Dead', 'https://arena.org.au/politics-of-counting-gazas-dead/', 'Arena', None, None, 'Examining the politics and challenges of documenting casualties in Gaza.', False),
                ],
                'ai': [
                    ('AI 2027: Predictions and Trajectories', 'https://ai-2027.com/', 'AI 2027', None, None, 'Forecasting the development and impact of AI through 2027.', True),
                    ('Amanda Askell Publications', 'https://askell.io/publications/', 'Askell.io', 'Amanda Askell', None, 'Research publications on AI alignment, ethics, and language models.', True),
                    ('Transfer Learning for Efficiency', 'https://ii.inc/web/blog/post/tle', 'ii.inc', None, None, 'Technical research on transfer learning efficiency in AI systems.', True),
                    ('How Does a Blind Model See the Earth', 'https://outsidetext.substack.com/p/how-does-a-blind-model-see-the-earth', 'Outside Text', None, None, 'Exploring how AI models without vision understand spatial concepts.', False),
                    ('Claude Character Research', 'https://www.anthropic.com/research/claude-character', 'Anthropic', None, None, "Anthropic's research on developing Claude's character and values.", False),
                    ('Chromaverse', 'https://dotdotdash.com/labs/chromaverse', 'dotdotdash', None, None, 'Interactive AI art and visualization project.', False),
                ],
                'culture': [
                    ('Models.com Feature', 'https://models.com/oftheminute/?p=168720', 'Models.com', None, None, 'Fashion and modeling industry spotlight and cultural commentary.', True),
                    ('Trishes Talks', 'https://substack.com/@trishestalks/p-176272631', 'Substack', 'Trishes', None, 'Cultural commentary and discussions on current trends.', True),
                    ('Christianity in Silicon Valley', 'https://www.vanityfair.com/news/story/christianity-was-borderline-illegal-in-silicon-valley-now-its-the-new-religion', 'Vanity Fair', None, None, 'Examining the rise of Christianity in Silicon Valley tech culture.', False),
                ],
                'politics': [
                    ('Building a Prosocial Media Ecosystem', 'https://www.noemamag.com/building-a-prosocial-media-ecosystem/', 'Noema Magazine', None, None, 'Exploring how to create media platforms that promote positive social outcomes.', True),
                ],
                'internet': [
                    ('Internet Archive Reaches Trillion', 'https://blog.archive.org/trillion', 'Internet Archive', None, None, 'The Internet Archive celebrates a major milestone in preserving digital history.', False),
                ],
            }
            
            for tag, articles in sample_articles.items():
                for title, url, source, authors, date, summary, recommended in articles:
                    logger.add_article_to_collection(tag, title, url, source, authors, date, summary)
                    if recommended:
                        conn = sqlite3.connect(logger.db_path)
                        cursor = conn.cursor()
                        cursor.execute('UPDATE curated_articles SET recommended = 1 WHERE url = ?', (url,))
                        conn.commit()
                        conn.close()
            
            print("🌱 Collections and articles seeded successfully!")
        else:
            print(f"📚 Found {len(existing)} existing collections")
    except Exception as e:
        print(f"⚠️ Error seeding collections: {e}")

def seed_iran_collection():
    """Seed Iran collection if it doesn't exist"""
    try:
        if not logger.get_collection_by_tag('iran'):
            logger.create_collection(
                'iran', 
                'Iran', 
                '', 
                'Articles on Iran, Iranian politics, opposition movements, and regional dynamics'
            )
            print("✅ Created 'Iran' collection")
            
            iran_articles = [
                ("Tehran's Method of Governance Has Reached a Dead End - Former Top Adviser Tells Euronews", 
                 'https://www.euronews.com/2026/01/05/tehrans-method-of-governance-has-reached-a-dead-end-former-top-adviser-tells-euronews', 
                 'Euronews', None, 'January 5, 2026', 
                 'A former top adviser discusses the challenges facing the Iranian government and its governance model.', True),
                ("In Pursuit of Whiteness: Why Iranian Monarchists Cheer Israel's Genocide", 
                 'https://www.jadaliyya.com/Details/46906', 
                 'Jadaliyya', 'Reza Zia-Ebrahimi', 'September 22, 2025', 
                 'Analysis of Iranian diaspora monarchists supporting Israel, examining dislocative nationalism and the pursuit of whiteness through internalised racial hierarchies and Islamophobia rooted in Western colonial epistemologies.', True),
                ("Iran's Political Opposition Jailed", 
                 'https://www.theatlantic.com/international/archive/2025/08/iran-political-opposition-jailed/683785/', 
                 'The Atlantic', None, 'August 2025', 
                 'Examination of the imprisonment of political opposition figures in Iran.', False),
                ('The Israeli Influence Operation in Iran Pushing to Reinstate the Shah Monarchy', 
                 'https://www.haaretz.com/israel-news/security-aviation/2025-10-03/ty-article-magazine/.premium/the-israeli-influence-operation-in-iran-pushing-to-reinstate-the-shah-monarchy/00000199-9f12-df33-a5dd-9f770d7a0000', 
                 'Haaretz', None, 'October 3, 2025', 
                 'Investigation into Israeli operations aimed at promoting monarchist restoration in Iran.', False),
            ]
            
            for title, url, source, authors, date, summary, recommended in iran_articles:
                logger.add_article_to_collection('iran', title, url, source, authors, date, summary)
            
            print(f"  📄 Added {len(iran_articles)} articles to Iran collection")
        else:
            print("📁 Iran collection already exists")
    except Exception as e:
        print(f"⚠️ Error seeding Iran collection: {e}")

# Seed collections on startup (use file lock to run once across Gunicorn workers)
_seed_lock_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.seed_lock')
def _run_startup_tasks():
    try:
        # Atomic file creation: only the first worker to create this file proceeds
        fd = os.open(_seed_lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.close(fd)
    except FileExistsError:
        return
    
    try:
        seed_collections_on_startup()
        seed_iran_collection()
        update_recommended_articles()
        logger.clear_expired_cache()
    finally:
        # Clean up lock file so next restart can seed again
        try:
            os.remove(_seed_lock_path)
        except OSError:
            pass

_run_startup_tasks()

# Enable CORS - more permissive in production
if os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('PORT'):
    # Production: allow all origins
    CORS(app, allow_headers=['Content-Type'], methods=['GET', 'POST'])
else:
    # Development: restrict to localhost
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
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',  # Removed 'br' (brotli) to avoid decoding issues
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
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
        
        print(f"📄 Response status: {response.status_code}, content length: {len(response.content)}", flush=True)
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract title
        title = None
        if soup.title:
            # Handle both simple titles and nested elements
            title_string = soup.title.string
            if title_string:
                title = title_string.strip()
            else:
                # Fallback to get_text() if string is None (nested elements)
                title = soup.title.get_text().strip()
            print(f"📰 Extracted title: {title[:50] if title else 'None'}...", flush=True)
        else:
            print("⚠️ No title tag found in HTML", flush=True)
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
        
        # Check if content extraction likely failed due to bot detection
        # (status 200 but empty or very minimal content)
        if len(content) < 200:
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.replace('www.', '')
            
            # Known premium publishers that often block cloud IPs
            premium_publishers = ['vanityfair.com', 'wired.com', 'newyorker.com', 'nytimes.com', 
                                  'wsj.com', 'bloomberg.com', 'ft.com', 'economist.com', 
                                  'washingtonpost.com', 'theathletic.com']
            
            is_premium = any(pub in domain for pub in premium_publishers)
            
            if is_premium:
                print(f"⚠️  Premium publisher detected ({domain}) - content extraction limited")
                error_msg = f"Summary not available — {domain} blocks automated content extraction from cloud servers. Reactions and discussions below are still available."
            else:
                error_msg = "Summary not available — article content could not be extracted (possible paywall, JavaScript rendering, or access restrictions). Reactions below are still available."
            
            return {
                'title': title or 'Article',
                'source': source or domain or 'Unknown Source',
                'date': date_published or 'Date not available',
                'content': content,  # Keep whatever we got
                'url': url,
                'error': error_msg
            }
        
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

@app.route('/api/reactions/check', methods=['POST'])
def check_cached_reactions():
    """
    Check if cached search results exist for a query.
    Returns cached results if available, otherwise returns null.
    """
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        if not query:
            return jsonify({'cached': False, 'results': None})
        
        cached = logger.get_cached_search(query)
        
        if cached:
            print(f"✅ Found cached search results for: {query[:50]}...")
            return jsonify({
                'cached': True,
                'results': cached
            })
        
        return jsonify({'cached': False, 'results': None})
        
    except Exception as e:
        print(f"Error checking cached search: {e}")
        return jsonify({'cached': False, 'results': None})

@app.route('/api/reactions/clear-cache', methods=['POST'])
def clear_search_cache():
    """
    Clear cached search results for a specific query.
    Useful when a scrape fails and you want to retry.
    """
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        cleared = logger.clear_search_cache(query)
        
        if cleared:
            print(f"✅ Cache cleared for: {query[:50]}...")
            return jsonify({'success': True, 'message': 'Cache cleared successfully'})
        else:
            return jsonify({'success': False, 'message': 'No cache found for this query'})
            
    except Exception as e:
        print(f"Error clearing cache: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reactions', methods=['POST'])
def get_reactions():
    """
    Main endpoint to search for news and Reddit reactions.
    Now with caching - checks cache first, returns cached results if available.
    """
    try:
        data = request.get_json()
        query = data.get('query', '')
        skip_cache = data.get('skip_cache', False)
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
        
        # Check cache first (skipped when frontend already checked via /api/reactions/check)
        if not skip_cache:
            cached = logger.get_cached_search(query)
            if cached:
                print(f"✅ Returning cached search results for: {query[:50]}...")
                cached['cached'] = True
                return jsonify(cached)
        
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
                # Include title in context so LLM knows the author's name
                summary_task = f"""Provide a concise 100-word summary of this article.

ARTICLE TITLE: {article_title}
SOURCE: {article_metadata.get('source', 'Unknown')}

Highlight the main points and key information. Use the author's name from the title if present - do NOT guess or invent names."""
                article_metadata['summary'] = summarize_text(article_metadata['content'], summary_task)
            else:
                # Use error message if available, otherwise generic message
                if 'error' in article_metadata:
                    article_metadata['summary'] = article_metadata['error']
                else:
                    article_metadata['summary'] = "Summary not available — this publisher may block automated content extraction. Reactions and discussions are still available below."
                
            print(f"🧠 Extracted article: {article_title}")
        
        # Search news - use smarter query for URLs
        print("📰 Searching news...")
        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        
        # If URL was provided and we have article metadata, search with title + domain exclusion
        # This finds external reactions rather than pages from the same site
        search_query = query
        if query.startswith('http') and article_metadata:
            try:
                query_domain = urlparse(query).netloc.replace('www.', '').lower()
                source = article_metadata.get('source', '')
                title = article_metadata.get('title', '')
                
                # Build a smarter search query that finds reactions
                if title and title != 'Article':
                    # Use title in quotes for exact match, add source, exclude original domain
                    search_query = f'"{title}" {source} -site:{query_domain}'
                    print(f"🔍 Using smart search query: {search_query[:80]}...")
            except Exception as e:
                print(f"Warning: Could not build smart query, using URL: {e}")
        
        # Run web search and Reddit search in parallel
        with ThreadPoolExecutor(max_workers=2) as executor:
            news_future = executor.submit(search_news, search_query, user_ip=user_ip)
            reddit_future = executor.submit(search_reddit_posts, query, article_title=article_title)
            
            news_results = news_future.result(timeout=30)
            reddit_results = reddit_future.result(timeout=30)
        
        # Filter out results from the same domain if query is a URL (backup filter)
        if query.startswith('http'):
            try:
                query_domain = urlparse(query).netloc.replace('www.', '').lower()
                news_results = [
                    result for result in news_results 
                    if result.get('url', '') != query and 
                    urlparse(result.get('url', '')).netloc.replace('www.', '').lower() != query_domain
                ]
                print(f"🔍 Filtered out results from domain: {query_domain}")
            except Exception as e:
                print(f"Warning: Could not parse URL for filtering: {e}")
        
        # Filter Reddit URLs out of web results — they belong in the Reddit section
        news_results = [
            r for r in news_results
            if 'reddit.com' not in (r.get('url', '') or '').lower()
        ]
        
        # Deduplicate web results against Reddit results by title similarity
        reddit_titles = {(r.get('title') or '').lower().strip() for r in reddit_results}
        news_results = [
            r for r in news_results
            if (r.get('title') or '').lower().strip() not in reddit_titles
        ]
        
        # Add file download flags to web results for security warnings
        news_results = add_file_download_flags(news_results)
        
        # Classify web results (non-blocking — failures leave results untagged)
        news_results = classify_web_results(news_results, article_title=article_title)
        
        # Format response to match frontend expectations
        response = {
            'web': news_results,  # Frontend expects 'web' key for web search results
            'reddit': reddit_results,
            'article': article_metadata,  # Include article metadata if URL was provided
            'cached': False
        }
        
        # Cache the results for future requests
        try:
            logger.cache_search(query, response)
            print(f"💾 Cached search results for: {query[:50]}...")
        except Exception as cache_error:
            print(f"⚠️ Failed to cache search results: {cache_error}")
        
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
        archive = logger.get_shared_archive(limit=limit)
        return jsonify({'archive': archive})
    except Exception as e:
        print(f"Error getting archive: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Media Reaction Finder API is running'
    })


CURATED_SUBREDDITS = [
    {'name': 'worldnews', 'label': 'r/worldnews'},
    {'name': 'CriticalTheory', 'label': 'r/CriticalTheory'},
    {'name': 'AI_Agents', 'label': 'r/AI_Agents'},
    {'name': 'PredictionsMarkets', 'label': 'r/PredictionsMarkets'}
]

_curated_cache = {'data': None, 'fetched_at': None}

@app.route('/api/curated-feed', methods=['GET'])
def curated_feed():
    from datetime import timedelta
    import praw

    now = datetime.utcnow()
    if _curated_cache['data'] and _curated_cache['fetched_at']:
        age = now - _curated_cache['fetched_at']
        if age < timedelta(hours=48):
            return jsonify(_curated_cache['data'])

    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent = os.getenv("REDDIT_USER_AGENT")
    if not all([client_id, client_secret, user_agent]):
        return jsonify({'error': 'Reddit credentials missing'}), 500

    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent
    )

    from api.reddit import _fetch_top_comments, _clean_text_for_llm, _has_llm_refusal

    channels = []
    for sub_info in CURATED_SUBREDDITS:
        try:
            subreddit = reddit.subreddit(sub_info['name'])
            posts = []
            seen_ids = set()

            for source in [subreddit.hot(limit=15), subreddit.top(time_filter='week', limit=10)]:
                for post in source:
                    if post.stickied or post.id in seen_ids:
                        continue
                    seen_ids.add(post.id)
                    if post.num_comments == 0:
                        continue
                    top_comments = _fetch_top_comments(reddit, post.permalink, limit=2)

                    posts.append({
                        'title': post.title,
                        'url': f"https://www.reddit.com{post.permalink}",
                        'permalink': post.permalink,
                        'score': post.score,
                        'num_comments': post.num_comments,
                        'created_utc': post.created_utc,
                        'top_comments': top_comments
                    })
                    if len(posts) >= 3:
                        break
                if len(posts) >= 3:
                    break
            channels.append({
                'subreddit': sub_info['name'],
                'label': sub_info['label'],
                'posts': posts
            })
        except Exception as e:
            print(f"⚠️ Failed to fetch r/{sub_info['name']}: {e}")
            channels.append({
                'subreddit': sub_info['name'],
                'label': sub_info['label'],
                'posts': []
            })

    _curated_cache['data'] = channels
    _curated_cache['fetched_at'] = now
    return jsonify(channels)


@app.route('/api/twitter', methods=['POST'])
def get_twitter_reactions():
    """
    Search for tweets related to a topic or query.
    
    Expects JSON body with:
    - query: Search query string
    - limit: Optional number of tweets (default 10)
    
    Returns:
    - tweets: Array of tweet objects with text, author, engagement, url
    """
    try:
        data = request.get_json()
        query = data.get('query', '')
        limit = data.get('limit', 10)
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        print(f"🐦 Twitter search request for: {query[:50]}...")
        tweets = search_twitter_posts(query, limit=limit)
        
        return jsonify({
            'tweets': tweets,
            'count': len(tweets),
            'query': query
        })
        
    except Exception as e:
        print(f"Error in Twitter endpoint: {e}")
        return jsonify({'error': str(e), 'tweets': []}), 500

@app.route('/api/trending/<topic>', methods=['GET'])
def get_trending_reactions(topic):
    """
    Get combined reactions (Reddit, Web, Twitter) for a trending topic.
    
    Args:
        topic: Topic name (e.g., 'iran', 'ai-governance')
    
    Returns:
    - reddit: Reddit posts
    - web: Web search results
    - twitter: Twitter posts
    """
    try:
        print(f"📈 Fetching trending reactions for: {topic}")
        
        # Topic-specific search queries
        topic_queries = {
            'iran': 'Iran attack strike military US nuclear 2026',
            'ai-governance': 'AI governance regulation policy',
            'climate-tech': 'climate technology renewable energy innovation',
        }
        
        query = topic_queries.get(topic.lower(), topic.replace('-', ' '))
        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        
        with ThreadPoolExecutor(max_workers=3) as executor:
            reddit_future = executor.submit(search_reddit_posts, query, limit=5)
            web_future = executor.submit(search_news, query, user_ip=user_ip)
            twitter_future = executor.submit(get_trending_tweets, topic, limit=10)
            
            reddit_results = reddit_future.result(timeout=30)
            web_results = web_future.result(timeout=30)[:5]
            twitter_results = twitter_future.result(timeout=30)
        
        return jsonify({
            'topic': topic,
            'query': query,
            'reddit': reddit_results,
            'web': web_results,
            'twitter': twitter_results
        })
        
    except Exception as e:
        print(f"Error fetching trending reactions: {e}")
        return jsonify({'error': str(e)}), 500

# Debug endpoints -- only registered in local development
if not os.getenv('RAILWAY_ENVIRONMENT'):
    @app.route('/api/debug-keys', methods=['GET'])
    def debug_keys():
        """Check if API keys are configured (does not expose actual keys)"""
        return jsonify({
            'SERPAPI_API_KEY': 'configured' if (os.getenv("SERPAPI_API_KEY") or os.getenv("SERPAPI_KEY")) else 'MISSING',
            'REDDIT_CLIENT_ID': 'configured' if os.getenv("REDDIT_CLIENT_ID") else 'MISSING',
            'REDDIT_CLIENT_SECRET': 'configured' if os.getenv("REDDIT_CLIENT_SECRET") else 'MISSING',
            'REDDIT_USER_AGENT': 'configured' if os.getenv("REDDIT_USER_AGENT") else 'MISSING',
            'OPENAI_API_KEY': 'configured' if os.getenv("OPENAI_API_KEY") else 'MISSING',
            'GEMINI_API_KEY': 'configured' if os.getenv("GEMINI_API_KEY") else 'MISSING',
            'TWITTER_BEARER_TOKEN': 'configured' if os.getenv("TWITTER_BEARER_TOKEN") else 'MISSING',
            'environment': 'local'
        })

    @app.route('/api/debug-tts', methods=['GET'])
    def debug_tts():
        """Test TTS functionality with a simple message."""
        from api.meta_commentary import text_to_speech_openai, text_to_speech_gemini
        
        test_text = "This is a test of the text to speech system."
        result = {
            'test_text': test_text,
            'openai_key_configured': bool(os.getenv("OPENAI_API_KEY")),
            'gemini_key_configured': bool(os.getenv("GEMINI_API_KEY")),
        }
        
        try:
            openai_result = text_to_speech_openai(test_text)
            result['openai_tts'] = 'success' if openai_result and openai_result.get('audio') else 'failed - no audio returned'
        except Exception as e:
            result['openai_tts'] = f'error: {str(e)}'
        
        return jsonify(result)

@app.route('/api/meta-commentary/check', methods=['POST'])
def check_cached_commentary():
    """
    Check if cached commentary exists for an article.
    Returns the cached audio if available, otherwise returns null.
    """
    try:
        data = request.get_json()
        article = data.get('article', {})
        
        cache_key = article.get('url') or article.get('title', '')
        
        if cache_key:
            cached = logger.get_cached_commentary(cache_key)
            
            if cached and cached.get('audio'):
                print(f"✅ Found cached commentary for: {cache_key[:50]}...")
                return jsonify({
                    'text': cached['text'],
                    'audio': cached['audio'],
                    'mime_type': cached['mime_type'],
                    'cached': True
                })
        
        return jsonify({'cached': False, 'audio': None})
        
    except Exception as e:
        print(f"❌ Error checking cached commentary: {e}")
        return jsonify({'cached': False, 'audio': None})

@app.route('/api/meta-commentary', methods=['POST'])
def meta_commentary():
    """
    Generate AI meta-commentary on article discourse with audio.
    Uses caching to avoid regenerating audio for the same article.
    
    Expects JSON body with:
    - article: object with title, source, summary
    - web: array of web search results
    - reddit: array of reddit discussions
    
    Returns:
    - text: the generated commentary
    - audio: base64-encoded audio (mp3)
    - mime_type: audio mime type
    - cached: boolean indicating if result was from cache
    """
    try:
        print("🎙️ Starting meta-commentary generation...")
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        article = data.get('article', {})
        web_results = data.get('web', [])
        reddit_results = data.get('reddit', [])
        
        # Use article URL as cache key (most reliable identifier)
        cache_key = article.get('url') or article.get('title', '')
        
        if cache_key:
            try:
                cached = logger.get_cached_commentary(cache_key)
                if cached and cached.get('audio'):
                    print(f"✅ Returning cached commentary for: {cache_key[:50]}...")
                    return jsonify({
                        'text': cached['text'],
                        'audio': cached['audio'],
                        'mime_type': cached['mime_type'],
                        'cached': True
                    })
            except Exception as cache_check_error:
                print(f"⚠️ Cache check failed (continuing without cache): {cache_check_error}")
        
        print(f"📝 Article: {article.get('title', 'No title')[:50]}...")
        print(f"🌐 Web results: {len(web_results)}")
        print(f"👽 Reddit results: {len(reddit_results)}")
        
        # Generate new audio commentary with robust error handling
        try:
            result = generate_audio_commentary(article, web_results, reddit_results)
        except Exception as gen_error:
            print(f"❌ Audio commentary generation failed: {gen_error}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'error': f'Audio generation failed: {str(gen_error)}',
                'text': None,
                'audio': None
            }), 500
        
        text = result.get('text', '')
        audio = result.get('audio')
        
        print(f"✅ Commentary generated: {len(text)} chars")
        print(f"🔊 Audio generated: {'Yes' if audio else 'No'}")
        
        # Cache the result if successful
        if cache_key and audio:
            try:
                logger.cache_commentary(
                    cache_key,
                    text,
                    audio,
                    result.get('mime_type', 'audio/mp3')
                )
                print(f"💾 Cached commentary for: {cache_key[:50]}...")
            except Exception as cache_error:
                print(f"⚠️ Failed to cache commentary: {cache_error}")
        
        # Return text even if audio failed
        response_data = {
            'text': text,
            'audio': audio,
            'mime_type': result.get('mime_type', 'audio/mp3'),
            'cached': False
        }
        
        if result.get('error'):
            response_data['warning'] = result.get('error_message', 'Audio generation had issues')
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Error in meta-commentary endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'text': None, 'audio': None}), 500

# Serve static files and SPA routing
# Primary: Vite build output. Fallback: project root (favicons, etc.)
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
STATIC_ROOT = os.path.join(PROJECT_ROOT, 'frontend', 'dist')

@app.route('/')
def serve_index():
    """Serve the main index.html"""
    return send_from_directory(STATIC_ROOT, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files or fallback to index.html for SPA routing"""
    dist_path = os.path.join(STATIC_ROOT, path)
    if os.path.isfile(dist_path):
        return send_from_directory(STATIC_ROOT, path)
    
    root_path = os.path.join(PROJECT_ROOT, path)
    if os.path.isfile(root_path):
        return send_from_directory(PROJECT_ROOT, path)
    
    return send_from_directory(STATIC_ROOT, 'index.html')

if __name__ == '__main__':
    # Use PORT environment variable for Railway, fallback to 5002 for local dev
    port = int(os.environ.get('PORT', 5002))
    print(f"🚀 Starting Media Reaction Finder API on port {port}")
    app.run(debug=False, host='0.0.0.0', port=port)

# For deployment
app = app