import praw
import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

def search_reddit_posts(query, limit=5):
    try:
        # Debug: Check if credentials are available
        client_id = os.getenv("REDDIT_CLIENT_ID")
        client_secret = os.getenv("REDDIT_CLIENT_SECRET")
        user_agent = os.getenv("REDDIT_USER_AGENT")
        
        print(f"🔐 Reddit credentials check:")
        print(f"  - Client ID: {'✓ Present' if client_id else '✗ Missing'}")
        print(f"  - Client Secret: {'✓ Present' if client_secret else '✗ Missing'}")
        print(f"  - User Agent: {'✓ Present' if user_agent else '✗ Missing'}")
        
        if not all([client_id, client_secret, user_agent]):
            print("❌ Missing Reddit API credentials")
            return []
        
        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent=user_agent,
            check_for_async=False
        )
        
        reddit.read_only = True
        
        # Test Reddit connection
        try:
            # Simple test to verify authentication works
            test_subreddit = reddit.subreddit("test")
            print(f"✓ Reddit API connection test successful")
        except Exception as auth_error:
            print(f"❌ Reddit API authentication failed: {auth_error}")
            return []
        
        results = []

        # If query is a URL, prioritize URL search
        if query.startswith("http"):
            print(f"🔍 Searching Reddit for URL: {query}")
            
            # Clean the URL (remove query params and trailing slashes)
            stripped_url = query.split("?")[0].rstrip("/")
            
            try:
                # First, try to find posts that link to this exact URL
                url_search = reddit.subreddit("all").search(
                    f'url:"{stripped_url}"', 
                    limit=limit,
                    sort="relevance"
                )
                
                for post in url_search:
                    try:
                        post_data = {
                            "title": post.title,
                            "url": f"https://reddit.com{post.permalink}",
                            "selftext": post.selftext if hasattr(post, 'selftext') else ""
                        }

                        results.append(post_data)

                    except Exception as e:
                        print(f"Error processing post: {e}")
                        continue
                        
            except Exception as e:
                print(f"URL search failed: {e}")
            
            # If we didn't find enough URL matches, search by the text of the URL
            # (sometimes people post URLs as text without proper linking)
            if len(results) < limit:
                try:
                    text_url_search = reddit.subreddit("all").search(
                        stripped_url, 
                        limit=limit - len(results),
                        sort="relevance"
                    )
                    
                    for post in text_url_search:
                        # Skip if we already have this post
                        if any(r['url'] == f"https://reddit.com{post.permalink}" for r in results):
                            continue
                            
                        try:
                            post_data = {
                            "title": post.title,
                            "url": f"https://reddit.com{post.permalink}",
                            "selftext": post.selftext if hasattr(post, 'selftext') else ""
                        }

                            results.append(post_data)

                        except Exception as e:
                            print(f"Error processing post: {e}")
                            continue
                            
                except Exception as e:
                    print(f"Text URL search failed: {e}")
                    
        else:
            # For non-URL queries, do a regular text search
            try:
                search_results = reddit.subreddit("all").search(
                    query, 
                    limit=limit, 
                    sort="relevance", 
                    time_filter="month"
                )
                
                for post in search_results:
                    try:
                        post_data = {
                            "title": post.title,
                            "url": f"https://reddit.com{post.permalink}",
                            "selftext": post.selftext if hasattr(post, 'selftext') else ""
                        }

                        results.append(post_data)

                    except Exception as e:
                        print(f"Error processing post: {e}")
                        continue

            except Exception as e:
                print(f"Reddit search failed: {e}")

        return results

    except Exception as e:
        print(f"Error initializing Reddit client: {e}")
        print("Please check your Reddit API credentials in the .env file")
        return []

def get_title_from_url(url):
    try:
        response = requests.get(url, timeout=5)
        soup = BeautifulSoup(response.content, 'html.parser')
        title = soup.title.string.strip()

        # Clean title by removing anything after a | or -
        if "|" in title:
            title = title.split("|")[0].strip()
        elif "-" in title:
            title = title.split("-")[0].strip()

        return title
    except:
        return None