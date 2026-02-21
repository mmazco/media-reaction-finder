import os
import requests
import time
from dotenv import load_dotenv
from api.search_logger import SearchLogger

load_dotenv()
# Support both naming conventions for the SerpAPI key
SERP_API_KEY = os.getenv("SERPAPI_API_KEY") or os.getenv("SERPAPI_KEY")

# Initialize search logger
search_logger = SearchLogger()

def search_news(query, num_results=5, user_ip=None):
    start_time = time.time()
    
    # Check if API key is available
    if not SERP_API_KEY:
        print("⚠️  SERPAPI_API_KEY not set - web search will be disabled")
        return []
    
    url = "https://serpapi.com/search"
    params = {
        "q": query,
        "api_key": SERP_API_KEY,
        "num": num_results,
        "engine": "google",
        "hl": "en",
        "gl": "us"
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()
        results = data.get("organic_results", [])
        
        # Return list of dicts with title, url, and summary (like Reddit structure)
        news_results = []
        for res in results:
            news_results.append({
                "title": res.get("title", ""),
                "url": res.get("link", ""),
                "summary": res.get("snippet", "")  # SerpAPI provides snippets
            })
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Log the search (optional - don't fail if logging fails)
        try:
            search_logger.log_search(
                query=query,
                search_type="news",
                user_ip=user_ip,
                results=news_results,
                processing_time=processing_time,
                search_params=params,
                serpapi_response=data
            )
        except Exception as log_error:
            print(f"Warning: Failed to log search to database: {log_error}")
            # Continue without failing the search
        
        return news_results
        
    except Exception as e:
        # Log failed search (optional - don't fail if logging fails)
        processing_time = time.time() - start_time
        try:
            search_logger.log_search(
                query=query,
                search_type="news",
                user_ip=user_ip,
                results=[],
                processing_time=processing_time,
                search_params=params,
                serpapi_response={"error": str(e)}
            )
        except Exception as log_error:
            print(f"Warning: Failed to log failed search to database: {log_error}")
            # Continue without failing
        
        print(f"Error in search_news: {e}")
        return []


def search_substack(query, num_results=5, user_ip=None):
    """Search for Substack articles using two strategies to catch custom domains."""
    start_time = time.time()
    
    if not SERP_API_KEY:
        return []
    
    url = "https://serpapi.com/search"
    seen_urls = set()
    substack_results = []
    
    queries = [
        f"site:substack.com {query}",
        f'"substack" {query}',
    ]
    
    for search_query in queries:
        if len(substack_results) >= num_results:
            break
        try:
            params = {
                "q": search_query,
                "api_key": SERP_API_KEY,
                "num": num_results,
                "engine": "google",
                "hl": "en",
                "gl": "us"
            }
            response = requests.get(url, params=params)
            data = response.json()
            
            for res in data.get("organic_results", []):
                link = res.get("link", "")
                if link in seen_urls:
                    continue
                if "/p/" not in link:
                    continue
                seen_urls.add(link)
                substack_results.append({
                    "title": res.get("title", ""),
                    "url": link,
                    "summary": res.get("snippet", ""),
                    "type": "Substack"
                })
        except Exception as e:
            print(f"⚠️ Substack search query failed ({search_query[:40]}...): {e}")
            continue
    
    substack_results = substack_results[:num_results]
    processing_time = time.time() - start_time
    print(f"📰 Substack search returned {len(substack_results)} results in {processing_time:.2f}s")
    
    return substack_results


# Substack detection for web results on custom domains
SUBSTACK_SIGNALS = ['substack', 'restack', 'restacks']

def is_likely_substack(result):
    """Detect if a web result is a Substack article on a custom domain."""
    url = (result.get('url') or '').lower()
    snippet = (result.get('summary') or '').lower()
    title = (result.get('title') or '').lower()
    
    if 'substack.com' in url:
        return True
    if '/p/' not in url:
        return False
    combined = snippet + ' ' + title
    return any(signal in combined for signal in SUBSTACK_SIGNALS)