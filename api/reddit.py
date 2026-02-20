import re
import praw
import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from summarize import summarize_text

_LLM_REFUSAL_PATTERNS = [
    'as an ai', 'as an llm', 'as a language model', 'i cannot browse',
    'i cannot access', 'i cannot visit', 'i cannot open', 'i cannot search',
    'i cannot follow', 'i\'m unable to access', 'i am unable to access'
]


def _clean_text_for_llm(text):
    """Strip URLs and markdown link syntax so the LLM doesn't try to browse them."""
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    text = re.sub(r'https?://\S+', '[link]', text)
    return text


def _has_llm_refusal(text):
    lower = text.lower()
    return any(p in lower for p in _LLM_REFUSAL_PATTERNS)


def _fetch_top_comments(reddit_client, permalink, limit=3):
    """Fetch the top-level comments for a post, sorted by score."""
    try:
        submission_id = permalink.split('/comments/')[1].split('/')[0]
        submission = reddit_client.submission(id=submission_id)
        submission.comment_sort = 'best'
        submission.comments.replace_more(limit=0)
        comments = []
        for comment in submission.comments[:limit]:
            body = comment.body.strip()
            if not body or body == '[deleted]' or body == '[removed]':
                continue
            comments.append({
                'author': str(comment.author) if comment.author else '[deleted]',
                'body': body[:500],
                'score': comment.score
            })
        return comments
    except Exception as e:
        print(f"⚠️ Could not fetch comments: {e}")
        return []

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
            
            # Extract key topic words early for relevance filtering
            key_topic_words = []
            if article_title:
                # Clean and extract key words from article title
                clean_title = article_title
                for suffix in [' | NOEMA', ' - The New York Times', ' | CNN', ' - BBC', ' - The Guardian', '| NYT', '| WSJ', ' | TIME', '| TIME']:
                    if suffix in clean_title:
                        clean_title = clean_title.split(suffix)[0].strip()
                
                for word in clean_title.split():
                    clean_word = word.strip('.,!?()[]"\'').lower()
                    if len(clean_word) >= 4:
                        # Prioritize proper nouns (names, places) and specific terms
                        if word[0].isupper() or clean_word.isdigit():
                            key_topic_words.append(clean_word)
                        elif len(clean_word) >= 5:
                            key_topic_words.append(clean_word)
                
                print(f"🔑 Key topic words for filtering: {key_topic_words[:10]}")
            
            # PHASE 1: Search for exact URL matches (specific article discussions)
            print(f"📍 Phase 1: Searching for exact URL matches...")
            try:
                # Try exact URL search first
                url_search = reddit.subreddit("all").search(
                    f'url:"{stripped_url}"', 
                    limit=limit * 2,
                    sort="relevance",
                    time_filter="year"
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
                                "permalink": post.permalink,
                                "subreddit": str(post.subreddit) if hasattr(post, 'subreddit') else "unknown",
                                "selftext": post.selftext if hasattr(post, 'selftext') else "",
                                "num_comments": num_comments,
                                "score": post.score if hasattr(post, 'score') else 0,
                                "match_type": "url_exact"
                            }
                            results.append(post_data)
                            seen_permalinks.add(post.permalink)
                            print(f"  ✓ Found exact URL match: {post.title[:50]}... ({num_comments} comments)")

                    except Exception as e:
                        print(f"Error processing post: {e}")
                        continue
                        
            except Exception as e:
                print(f"Exact URL search failed: {e}")
            
            # PHASE 2: Search by article title/topic (broader discussions)
            if article_title and len(results) < limit * 2:
                # Clean the title: remove site names, common words, and short words
                topic_query = article_title
                
                # Remove site name suffixes
                for suffix in [' | NOEMA', ' - The New York Times', ' | CNN', ' - BBC', ' - The Guardian', '| NYT', '| WSJ', ' | TIME', '| TIME']:
                    if suffix in topic_query:
                        topic_query = topic_query.split(suffix)[0].strip()
                
                # Remove very common/generic words that cause noise
                common_words = ['building', 'creating', 'making', 'new', 'how', 'why', 'what', 'the', 'a', 'an', 
                               'this', 'that', 'time', 'isn', 'like', 'quite', 'just', 'about', 'from', 'with', 'have']
                words = topic_query.split()
                # Keep only meaningful words (longer than 3 chars, not common)
                filtered_words = [w for w in words if len(w) > 3 and w.lower() not in common_words]
                
                print(f"🔑 Using key topic words for relevance: {key_topic_words[:8]}")
                
                # If we filtered everything, use original; otherwise use filtered
                if len(filtered_words) >= 2:
                    topic_query = ' '.join(filtered_words)
                
                print(f"📰 Phase 2: Searching by topic: '{topic_query[:60]}...'")
                print(f"   (cleaned from: '{article_title[:60]}...')")
                try:
                    
                    topic_search = reddit.subreddit("all").search(
                        topic_query, 
                        limit=limit * 5,  # Fetch more to filter
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
                            
                            # RELEVANCE CHECK: Post title/content must contain at least one key topic word
                            post_title_lower = post.title.lower()
                            post_selftext_lower = (post.selftext if hasattr(post, 'selftext') else "").lower()
                            subreddit_name = str(post.subreddit).lower() if hasattr(post, 'subreddit') else ""
                            
                            # Check if any key topic word appears in the post
                            relevance_score = 0
                            matched_words = []
                            for key_word in key_topic_words:
                                if key_word in post_title_lower or key_word in post_selftext_lower or key_word in subreddit_name:
                                    relevance_score += 1
                                    matched_words.append(key_word)
                            
                            # Require at least 1 key word match (or 2 if we have many key words)
                            min_matches = 2 if len(key_topic_words) > 4 else 1
                            if relevance_score < min_matches:
                                print(f"  ⏭️  Skipping irrelevant: {post.title[:40]}... (no key words matched)")
                                continue
                            
                            post_data = {
                                "title": post.title,
                                "url": f"https://reddit.com{post.permalink}",
                                "permalink": post.permalink,
                                "subreddit": str(post.subreddit) if hasattr(post, 'subreddit') else "unknown",
                                "selftext": post.selftext if hasattr(post, 'selftext') else "",
                                "num_comments": num_comments,
                                "score": post.score if hasattr(post, 'score') else 0,
                                "match_type": "topic",
                                "relevance_score": relevance_score,
                                "matched_words": matched_words
                            }
                            results.append(post_data)
                            seen_permalinks.add(post.permalink)
                            print(f"  ✓ Found topic match: {post.title[:50]}... ({num_comments} comments, matched: {matched_words})")
                            
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
                                "permalink": post.permalink,
                                "subreddit": str(post.subreddit) if hasattr(post, 'subreddit') else "unknown",
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
                            "permalink": post.permalink,
                            "subreddit": str(post.subreddit) if hasattr(post, 'subreddit') else "unknown",
                            "selftext": post.selftext if hasattr(post, 'selftext') else "",
                            "num_comments": num_comments,
                            "score": post.score if hasattr(post, 'score') else 0,
                            "match_type": "topic"
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
        
        top_results = results[:limit]

        # Fetch top comments first so we can use them for summaries if needed
        for post in top_results:
            permalink = post.get('permalink', '')
            if permalink:
                post['top_comments'] = _fetch_top_comments(reddit, permalink, limit=2)

        for post in top_results:
            selftext = post.get('selftext', '').strip()
            if selftext and len(selftext) > 100:
                try:
                    print(f"🤖 Generating summary for: {post['title'][:50]}...")
                    cleaned = _clean_text_for_llm(selftext[:2000])
                    summary_task = (
                        "Provide a very brief 2-sentence summary of this Reddit post's main point and sentiment. "
                        "Ignore any [link] placeholders — summarize only the written text."
                    )
                    summary = summarize_text(cleaned, summary_task)
                    if _has_llm_refusal(summary):
                        print(f"⚠️ LLM refusal detected, using raw text fallback")
                        summary = selftext[:200] + "..." if len(selftext) > 200 else selftext
                    post['summary'] = summary
                except Exception as e:
                    print(f"Error generating summary: {e}")
                    post['summary'] = selftext[:200] + "..." if len(selftext) > 200 else selftext
            elif post.get('top_comments') and len(post['top_comments']) > 0:
                try:
                    comment_text = ' '.join([c.get('body', '')[:300] for c in post['top_comments'][:3]])
                    if len(comment_text) > 80:
                        cleaned = _clean_text_for_llm(comment_text[:2000])
                        summary = summarize_text(
                            cleaned,
                            f"Based on these Reddit comments about '{post['title'][:100]}', provide a brief 2-sentence summary of the key reactions and sentiment."
                        )
                        if _has_llm_refusal(summary):
                            post['summary'] = ''
                        else:
                            post['summary'] = summary
                    else:
                        post['summary'] = ''
                except Exception:
                    post['summary'] = ''
            else:
                post['summary'] = ''
        
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