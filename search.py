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


def search_substack(query, num_results=3, user_ip=None):
    """Search for Substack articles relevant to the query using SerpAPI site:substack.com"""
    start_time = time.time()
    
    if not SERP_API_KEY:
        return []
    
    url = "https://serpapi.com/search"
    params = {
        "q": f"site:substack.com {query}",
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
        
        substack_results = []
        for res in results:
            link = res.get("link", "")
            if "/p/" not in link:
                continue
            substack_results.append({
                "title": res.get("title", ""),
                "url": link,
                "summary": res.get("snippet", ""),
                "type": "Substack"
            })
        
        processing_time = time.time() - start_time
        print(f"📰 Substack search returned {len(substack_results)} results in {processing_time:.2f}s")
        
        return substack_results
        
    except Exception as e:
        print(f"Error in search_substack: {e}")
        return []