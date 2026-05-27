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


def _word_present(keyword, text):
    """Check if keyword appears as a whole word in text (not as a substring).
    For short keywords (<=3 chars) this avoids false positives like 'la' in 'elaborate'."""
    if len(keyword) <= 3:
        return bool(re.search(r'\b' + re.escape(keyword) + r'\b', text))
    return keyword in text


def _extract_key_phrases(title_words):
    """Extract adjacent-word phrases (bigrams) from title words.
    These are much more specific than individual words — 'city attorney'
    as a phrase filters far better than 'city' + 'attorney' separately."""
    phrases = []
    for i in range(len(title_words) - 1):
        bigram = f"{title_words[i]} {title_words[i+1]}"
        phrases.append(bigram)
    return phrases


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
            key_phrases = []
            if article_title:
                # Clean and extract key words from article title
                clean_title = article_title
                for suffix in [' | NOEMA', ' - The New York Times', ' | CNN', ' - BBC', ' - The Guardian', '| NYT', '| WSJ', ' | TIME', '| TIME']:
                    if suffix in clean_title:
                        clean_title = clean_title.split(suffix)[0].strip()
                # Also strip "– Site Name" or "| Site Name" patterns
                for sep in [' – ', ' — ', ' | ']:
                    if sep in clean_title:
                        clean_title = clean_title.split(sep)[0].strip()
                
                # Generic verbs/adverbs/adjectives that match too broadly
                # across Reddit — keep contextual nouns (city, state, etc.)
                # since they provide specificity when combined via min_matches
                _generic_words = {
                    'running', 'people', 'story',
                    'says', 'said', 'year', 'years', 'first', 'last', 'every',
                    'going', 'getting', 'looking', 'want', 'need', 'help',
                    'money', 'back', 'life', 'work', 'long', 'real',
                    'part', 'open', 'high', 'full', 'good', 'best', 'after',
                    'still', 'does', 'much', 'many', 'most', 'more', 'over',
                    'take', 'make', 'come', 'know', 'think', 'could', 'would',
                    'should', 'being', 'here', 'when', 'where', 'which',
                    # Source/meta words that leak from article titles
                    'news', 'report', 'reports', 'update', 'updates',
                    'video', 'watch', 'read', 'opinion', 'editorial',
                    'across', 'persist',
                }
                
                _source_abbreviations = {'ap', 'bbc', 'cnn', 'nyt', 'wsj'}
                _stop_words = {
                    'is', 'are', 'was', 'were', 'be', 'been', 'am',
                    'do', 'did', 'has', 'had', 'have', 'will', 'shall',
                    'the', 'an', 'of', 'to', 'in', 'on', 'at', 'by',
                    'for', 'or', 'and', 'nor', 'but', 'so', 'yet',
                    'it', 'its', 'he', 'she', 'we', 'they', 'me',
                    'as', 'if', 'no', 'not', 'up', 'out', 'off',
                }
                
                for word in clean_title.split():
                    clean_word = word.strip('.,!?()[]"\'').lower()
                    # Normalize period-separated abbreviations: "L.A." -> "la"
                    normalized = clean_word.replace('.', '')
                    if normalized in _generic_words or normalized in _stop_words:
                        continue
                    # Check if the word is an ALL-CAPS abbreviation
                    stripped = word.strip('.,!?()[]"\'').replace('.', '')
                    if normalized in _source_abbreviations:
                        continue
                    if stripped.isupper() and len(normalized) >= 2:
                        key_topic_words.append(normalized)
                    elif len(normalized) >= 4:
                        if word[0].isupper() or normalized.isdigit():
                            key_topic_words.append(normalized)
                        elif len(normalized) >= 5:
                            key_topic_words.append(normalized)
                
                # Also extract bigram phrases for high-precision matching
                key_phrases = _extract_key_phrases([w.lower() for w in key_topic_words])
                print(f"🔑 Key topic words for filtering: {key_topic_words[:10]}")
                print(f"🔑 Key phrases for filtering: {key_phrases[:5]}")
            
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
                
                # Only strip true stop words from the search query — keep
                # contextual nouns like "city", "state" that narrow the search
                _search_stop_words = {
                    'building', 'creating', 'making', 'new', 'how', 'why', 'what', 'the', 'a', 'an',
                    'this', 'that', 'isn', 'like', 'quite', 'just', 'about', 'from', 'with', 'have',
                    'going', 'getting', 'looking', 'want', 'need', 'help', 'does', 'being',
                    'says', 'said', 'running', 'who', 'are', 'for', 'its', 'can', 'will',
                }
                words = topic_query.split()
                filtered_words = [
                    w for w in words
                    if (w.isupper() and len(w) >= 2) or (len(w) > 3 and w.lower() not in _search_stop_words)
                ]
                
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
                            
                            # Check if any key topic word appears in the post (whole-word for short keywords)
                            relevance_score = 0
                            matched_words = []
                            combined_text = f"{post_title_lower} {post_selftext_lower} {subreddit_name}"
                            for key_word in key_topic_words:
                                if _word_present(key_word, post_title_lower) or _word_present(key_word, post_selftext_lower) or _word_present(key_word, subreddit_name):
                                    relevance_score += 1
                                    matched_words.append(key_word)
                            
                            # Bonus: matching a key phrase (bigram) is a strong relevance signal
                            phrase_matched = False
                            if key_phrases:
                                for phrase in key_phrases:
                                    if phrase in combined_text:
                                        phrase_matched = True
                                        relevance_score += 2
                                        matched_words.append(f'PHRASE:"{phrase}"')
                                        break
                            
                            # Require EITHER a phrase match OR a high keyword-count threshold.
                            # Phrases are essential for short/common-word titles ("LA City Attorney")
                            # but too rigid for longer distinctive titles ("Iran ceasefire mideast").
                            if not phrase_matched:
                                if len(key_topic_words) <= 3:
                                    # Few keywords and all common: phrases are the only reliable signal
                                    if key_phrases:
                                        print(f"  ⏭️  Skipping irrelevant: {post.title[:40]}... (no phrase match)")
                                        continue
                                    elif relevance_score < len(key_topic_words):
                                        print(f"  ⏭️  Skipping irrelevant: {post.title[:40]}... ({relevance_score}/{len(key_topic_words)} words)")
                                        continue
                                else:
                                    # Many keywords: require ~50% to match
                                    min_matches = max(3, (len(key_topic_words) + 1) // 2)
                                    if relevance_score < min_matches:
                                        print(f"  ⏭️  Skipping irrelevant: {post.title[:40]}... ({relevance_score}/{min_matches} needed)")
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
                        
                        # Apply same relevance filter as Phase 2
                        if key_topic_words:
                            post_title_lower = post.title.lower()
                            post_selftext_lower = (post.selftext if hasattr(post, 'selftext') else "").lower()
                            subreddit_name = str(post.subreddit).lower() if hasattr(post, 'subreddit') else ""
                            combined_text = f"{post_title_lower} {post_selftext_lower} {subreddit_name}"
                            matched = sum(
                                1 for kw in key_topic_words
                                if _word_present(kw, post_title_lower) or _word_present(kw, post_selftext_lower) or _word_present(kw, subreddit_name)
                            )
                            has_phrase = key_phrases and any(p in combined_text for p in key_phrases)
                            if not has_phrase:
                                if len(key_topic_words) <= 3:
                                    if key_phrases or matched < len(key_topic_words):
                                        print(f"  ⏭️  Phase 3 skipping irrelevant: {post.title[:40]}...")
                                        continue
                                elif matched < max(3, (len(key_topic_words) + 1) // 2):
                                    print(f"  ⏭️  Phase 3 skipping irrelevant: {post.title[:40]}...")
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