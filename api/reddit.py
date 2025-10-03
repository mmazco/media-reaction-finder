import praw
import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
# For local development - use direct imports
try:
    from summarize import summarize_text
except ImportError:
    # For Vercel deployment - use relative imports
    from .summarize import summarize_text

load_dotenv()

def search_reddit_posts(query, limit=5, article_title=None):
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
        seen_permalinks = set()  # Track post IDs to avoid duplicates

        # If query is a URL, use hybrid approach: URL + Topic search
        if query.startswith("http"):
            print(f"🔍 Hybrid Search Strategy for URL: {query}")
            
            # Clean the URL (remove query params and trailing slashes)
            stripped_url = query.split("?")[0].rstrip("/")
            
            # PHASE 1: Search for exact URL matches (specific article discussions)
            print(f"📍 Phase 1: Searching for exact URL matches...")
            try:
                url_search = reddit.subreddit("all").search(
                    f'url:"{stripped_url}"', 
                    limit=limit * 2,
                    sort="relevance"
                )
                
                for post in url_search:
                    try:
                        num_comments = post.num_comments if hasattr(post, 'num_comments') else 0
                        if num_comments < 2:
                            continue
                        
                        if post.permalink not in seen_permalinks:
                            post_data = {
                                "title": post.title,
                                "url": f"https://reddit.com{post.permalink}",
                                "selftext": post.selftext if hasattr(post, 'selftext') else "",
                                "num_comments": num_comments,
                                "score": post.score if hasattr(post, 'score') else 0,
                                "match_type": "url_exact"  # Tag for debugging
                            }
                            results.append(post_data)
                            seen_permalinks.add(post.permalink)
                            print(f"  ✓ Found URL match: {post.title[:50]}... ({num_comments} comments)")

                    except Exception as e:
                        print(f"Error processing post: {e}")
                        continue
                        
            except Exception as e:
                print(f"URL search failed: {e}")
            
            # PHASE 2: Search by article title/topic (broader discussions)
            if article_title and len(results) < limit * 2:
                # Clean the title: remove site names, common words, and short words
                topic_query = article_title
                
                # Remove site name suffixes
                for suffix in [' | NOEMA', ' - The New York Times', ' | CNN', ' - BBC', ' - The Guardian', '| NYT', '| WSJ']:
                    if suffix in topic_query:
                        topic_query = topic_query.split(suffix)[0].strip()
                
                # Remove very common/generic words that cause noise
                common_words = ['building', 'creating', 'making', 'new', 'how', 'why', 'what', 'the', 'a', 'an']
                words = topic_query.split()
                # Keep only meaningful words (longer than 3 chars, not common)
                filtered_words = [w for w in words if len(w) > 3 and w.lower() not in common_words]
                
                # If we filtered everything, use original; otherwise use filtered
                if len(filtered_words) >= 2:
                    topic_query = ' '.join(filtered_words)
                
                print(f"📰 Phase 2: Searching by topic: '{topic_query[:60]}...'")
                print(f"   (cleaned from: '{article_title[:60]}...')")
                try:
                    
                    topic_search = reddit.subreddit("all").search(
                        topic_query, 
                        limit=limit * 3,
                        sort="relevance",
                        time_filter="month"
                    )
                    
                    for post in topic_search:
                        try:
                            num_comments = post.num_comments if hasattr(post, 'num_comments') else 0
                            if num_comments < 2:
                                continue
                            
                            # Skip if we already have this post
                            if post.permalink in seen_permalinks:
                                continue
                            
                            post_data = {
                                "title": post.title,
                                "url": f"https://reddit.com{post.permalink}",
                                "selftext": post.selftext if hasattr(post, 'selftext') else "",
                                "num_comments": num_comments,
                                "score": post.score if hasattr(post, 'score') else 0,
                                "match_type": "topic"  # Tag for debugging
                            }
                            results.append(post_data)
                            seen_permalinks.add(post.permalink)
                            print(f"  ✓ Found topic match: {post.title[:50]}... ({num_comments} comments)")
                            
                        except Exception as e:
                            print(f"Error processing topic post: {e}")
                            continue
                            
                except Exception as e:
                    print(f"Topic search failed: {e}")
            
            # PHASE 3: Fallback - search by URL text if still need more results
            if len(results) < limit:
                print(f"🔄 Phase 3: Fallback URL text search...")
                try:
                    text_url_search = reddit.subreddit("all").search(
                        stripped_url, 
                        limit=limit * 2,
                        sort="relevance"
                    )
                    
                    for post in text_url_search:
                        if post.permalink in seen_permalinks:
                            continue
                        
                        num_comments = post.num_comments if hasattr(post, 'num_comments') else 0
                        if num_comments < 2:
                            continue
                            
                        try:
                            post_data = {
                                "title": post.title,
                                "url": f"https://reddit.com{post.permalink}",
                                "selftext": post.selftext if hasattr(post, 'selftext') else "",
                                "num_comments": num_comments,
                                "score": post.score if hasattr(post, 'score') else 0,
                                "match_type": "url_text"
                            }
                            results.append(post_data)
                            seen_permalinks.add(post.permalink)

                        except Exception as e:
                            print(f"Error processing post: {e}")
                            continue
                            
                except Exception as e:
                    print(f"Text URL search failed: {e}")
                    
        else:
            # For non-URL queries, do a regular text search
            try:
                # Fetch more than needed since we'll filter out low-engagement posts
                search_results = reddit.subreddit("all").search(
                    query, 
                    limit=limit * 3,  # Fetch 3x to account for filtering
                    sort="relevance", 
                    time_filter="month"
                )
                
                for post in search_results:
                    try:
                        # Skip posts with no meaningful discussion (fewer than 2 comments)
                        num_comments = post.num_comments if hasattr(post, 'num_comments') else 0
                        if num_comments < 2:
                            print(f"  ⏭️  Skipping post with {num_comments} comments: {post.title[:50]}...")
                            continue
                        
                        post_data = {
                            "title": post.title,
                            "url": f"https://reddit.com{post.permalink}",
                            "selftext": post.selftext if hasattr(post, 'selftext') else "",
                            "num_comments": num_comments,
                            "score": post.score if hasattr(post, 'score') else 0
                        }

                        results.append(post_data)
                        
                        # Stop if we have enough results
                        if len(results) >= limit:
                            break

                    except Exception as e:
                        print(f"Error processing post: {e}")
                        continue

            except Exception as e:
                print(f"Reddit search failed: {e}")

        # Sort results by engagement (prioritize URL matches, then by score + comments)
        # URL matches get priority, then sort by engagement score
        def engagement_score(post):
            # URL exact matches get bonus points
            match_bonus = 1000 if post.get('match_type') == 'url_exact' else 0
            # Calculate engagement: upvotes + (comments * 2) to weight discussion higher
            engagement = post.get('score', 0) + (post.get('num_comments', 0) * 2)
            return match_bonus + engagement
        
        results.sort(key=engagement_score, reverse=True)
        
        print(f"📊 Found {len(results)} total Reddit discussions")
        print(f"   - Returning top {min(limit, len(results))} by engagement")
        
        # Generate AI summaries for top results with meaningful content
        top_results = results[:limit]
        for post in top_results:
            selftext = post.get('selftext', '').strip()
            if selftext and len(selftext) > 100:  # Only summarize posts with substantial content
                try:
                    print(f"🤖 Generating summary for: {post['title'][:50]}...")
                    summary_task = "Provide a very brief 2-sentence summary of this Reddit post's main point and sentiment."
                    post['summary'] = summarize_text(selftext[:2000], summary_task)  # Limit to 2000 chars
                except Exception as e:
                    print(f"Error generating summary: {e}")
                    # Use first 200 chars as fallback
                    post['summary'] = selftext[:200] + "..." if len(selftext) > 200 else selftext
            else:
                # For posts without content or short posts, create a basic summary
                post['summary'] = f"Reddit discussion with {post['num_comments']} comments"
        
        # Return only the requested number of results (limit to 5)
        return top_results

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