import os
import requests
from dotenv import load_dotenv

load_dotenv()
SERP_API_KEY = os.getenv("SERPAPI_API_KEY")

def search_news(query, num_results=5, user_ip=None):
    url = "https://serpapi.com/search"
    params = {
        "q": query,
        "api_key": SERP_API_KEY,
        "num": num_results,
        "engine": "google",
        "hl": "en",
        "gl": "us"
    }

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
    
    return news_results