"""
Twitter/X API Integration for Media Reaction Finder
Uses Twitter API v2 with Bearer Token authentication
"""

import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
load_dotenv('.env.local', override=True)


def search_twitter_posts(query, limit=10):
    """
    Search for recent tweets related to a topic/keyword.
    
    Args:
        query: Search query string
        limit: Maximum number of tweets to return (default 10)
    
    Returns:
        List of tweet dictionaries with: text, author, url, engagement, created_at
    """
    bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
    
    if not bearer_token:
        print("❌ Twitter Bearer Token not configured")
        return []
    
    print(f"🐦 Searching Twitter for: {query[:50]}...")
    
    try:
        # Twitter API v2 recent search endpoint
        url = "https://api.twitter.com/2/tweets/search/recent"
        
        headers = {
            "Authorization": f"Bearer {bearer_token}",
            "User-Agent": "MediaReactionFinder/1.0"
        }
        
        # Build query parameters
        # If query already has -is:retweet, don't add additional filters
        if "-is:retweet" in query:
            search_query = query
        else:
            # Exclude retweets and replies for cleaner results
            search_query = f"{query} -is:retweet -is:reply lang:en"
        
        params = {
            "query": search_query,
            "max_results": max(min(limit, 100), 10),  # API min is 10, max is 100
            "tweet.fields": "created_at,public_metrics,author_id,conversation_id",
            "user.fields": "name,username,verified,profile_image_url",
            "expansions": "author_id"
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=15)
        
        if response.status_code == 401:
            print("❌ Twitter API authentication failed - check Bearer Token")
            return []
        
        if response.status_code == 429:
            print("⚠️ Twitter API rate limit exceeded")
            return []
        
        if response.status_code != 200:
            print(f"❌ Twitter API error: {response.status_code} - {response.text}")
            return []
        
        data = response.json()
        
        if not data.get("data"):
            print("📭 No tweets found for this query")
            return []
        
        # Build author lookup dictionary
        authors = {}
        if "includes" in data and "users" in data["includes"]:
            for user in data["includes"]["users"]:
                authors[user["id"]] = {
                    "name": user.get("name", ""),
                    "username": user.get("username", ""),
                    "verified": user.get("verified", False),
                    "profile_image": user.get("profile_image_url", "")
                }
        
        tweets = []
        for tweet in data["data"]:
            author_id = tweet.get("author_id", "")
            author = authors.get(author_id, {})
            metrics = tweet.get("public_metrics", {})
            
            # Calculate engagement score
            likes = metrics.get("like_count", 0)
            retweets = metrics.get("retweet_count", 0)
            replies = metrics.get("reply_count", 0)
            engagement = likes + (retweets * 2) + replies
            
            created_at_raw = tweet.get("created_at", "")
            created_at_display = ""
            created_at_iso = ""
            if created_at_raw:
                try:
                    dt = datetime.fromisoformat(created_at_raw.replace("Z", "+00:00"))
                    created_at_display = dt.strftime("%b %d, %Y")
                    created_at_iso = dt.isoformat()
                except:
                    created_at_display = created_at_raw
            
            tweet_data = {
                "id": tweet.get("id", ""),
                "text": tweet.get("text", ""),
                "author_name": author.get("name", "Unknown"),
                "author_username": author.get("username", ""),
                "author_verified": author.get("verified", False),
                "author_image": author.get("profile_image", ""),
                "url": f"https://twitter.com/{author.get('username', 'x')}/status/{tweet.get('id', '')}",
                "likes": likes,
                "retweets": retweets,
                "replies": replies,
                "engagement": engagement,
                "created_at": created_at_display,
                "created_at_iso": created_at_iso
            }
            tweets.append(tweet_data)
        
        # Sort by engagement
        tweets.sort(key=lambda x: x["engagement"], reverse=True)
        
        print(f"✅ Found {len(tweets)} tweets")
        return tweets[:limit]
        
    except requests.exceptions.Timeout:
        print("⚠️ Twitter API request timed out")
        return []
    except requests.exceptions.RequestException as e:
        print(f"❌ Twitter API request error: {e}")
        return []
    except Exception as e:
        print(f"❌ Error searching Twitter: {e}")
        return []


def get_trending_tweets(topic, limit=10):
    """
    Get trending tweets for a specific topic.
    Fetches from credible sources individually to ensure variety.
    
    Args:
        topic: Topic name (e.g., "Iran", "AI Governance")
        limit: Number of tweets to return
    
    Returns:
        List of tweet dictionaries
    """
    # Credible sources for specific topics
    iran_sources = [
        "ryangrim",         # Ryan Grim - journalist, Drop Site News
        "RyanRozbiani",     # Ryan Rozbiani - Iran analyst
        "CArdakani",        # Chirinne Ardakani
        "SMohyeddin",       # Samira Mohyeddin
        "realazadeh",       # Azi
        "yarbatman",        # Esfandyar Batmanghelidj
        "maralkay",         # Maral Karimi - journalist
        "yashar",           # Yashar Ali - journalist
        "m4h007",           # Majid Hosseini
        "S_Mahendrarajah",  # Sascha Mahendrarajah
        "DropSiteNews",     # Drop Site News
        "SinaToossi",       # Sina Toossi - Iran analyst
    ]
    
    if topic.lower() == "iran":
        iran_keywords = "(Iran OR Tehran OR IRGC OR Persian OR nuclear OR sanctions OR strike OR bombing)"
        
        # Phase 1: Fetch Iran-relevant tweets from each curated account
        account_tweets = {}
        for account in iran_sources:
            try:
                tweets = search_twitter_posts(f"from:{account} {iran_keywords} -is:retweet", limit=10)
                account_tweets[account] = tweets
                print(f"   → Got {len(tweets)} Iran-relevant tweets from @{account}")
            except Exception as e:
                print(f"   → Error fetching from @{account}: {e}")
                account_tweets[account] = []
        
        # Phase 2: Broad search for high-engagement Iran attack tweets from anyone
        try:
            broad_tweets = search_twitter_posts("Iran (attack OR strike OR war OR military OR nuclear) -is:retweet -is:reply lang:en", limit=10)
            print(f"   → Got {len(broad_tweets)} tweets from broad Iran search")
        except Exception as e:
            print(f"   → Error in broad search: {e}")
            broad_tweets = []
        
        # Priority 1: One Iran-relevant tweet per curated account (newest from each)
        curated_tweets = []
        for account in iran_sources:
            tweets = account_tweets.get(account, [])
            tweets.sort(key=lambda t: t.get("created_at_iso", ""), reverse=True)
            if tweets:
                curated_tweets.append(tweets[0])
        
        curated_tweets.sort(key=lambda t: t.get("created_at_iso", ""), reverse=True)
        
        result = []
        seen_ids = set()
        for t in curated_tweets:
            result.append(t)
            seen_ids.add(t.get("id"))
            if len(result) >= limit:
                break
        
        # Priority 2: Fill remaining slots with broad search (high-relevance from anyone)
        if len(result) < limit:
            broad_tweets.sort(key=lambda t: t.get("created_at_iso", ""), reverse=True)
            for t in broad_tweets:
                if t.get("id") not in seen_ids:
                    result.append(t)
                    seen_ids.add(t.get("id"))
                if len(result) >= limit:
                    break
        
        curated_count = min(len(curated_tweets), limit)
        broad_count = len(result) - curated_count
        print(f"✅ Total: {len(result)} tweets ({curated_count} curated, {broad_count} broad)")
        return result[:limit]
    
    # Default for other topics
    topic_queries = {
        "ai governance": "AI (governance OR regulation OR policy OR safety) -crypto",
        "climate tech": "climate (technology OR innovation OR renewable OR energy) -crypto -nft",
    }
    query = topic_queries.get(topic.lower(), topic)
    return search_twitter_posts(query, limit=limit)


# Test function
if __name__ == "__main__":
    print("Testing Twitter API...")
    tweets = get_trending_tweets("iran", limit=5)
    for i, tweet in enumerate(tweets, 1):
        print(f"\n{i}. @{tweet['author_username']}: {tweet['text'][:100]}...")
        print(f"   Engagement: {tweet['engagement']} | {tweet['url']}")

