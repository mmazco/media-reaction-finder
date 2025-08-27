import os
import requests
import time
from dotenv import load_dotenv
from search_logger import SearchLogger

load_dotenv()
SERP_API_KEY = os.getenv("SERPAPI_API_KEY")

# Initialize search logger
search_logger = SearchLogger()

def search_news(query, num_results=5, user_ip=None):
    start_time = time.time()
    
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