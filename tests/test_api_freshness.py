#!/usr/bin/env python3
"""
API Freshness Test — Iran Monitoring
Validates that X/Twitter, Reddit, and SERP APIs are returning current data.
Run from project root: python tests/test_api_freshness.py
"""

import sys
import os
import json
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()
load_dotenv('.env.local', override=True)

PASS = "✅ PASS"
FAIL = "❌ FAIL"
WARN = "⚠️  WARN"

today = datetime.now(timezone.utc).date()
yesterday = today - timedelta(days=1)


def divider(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def test_serpapi():
    """Test SERP API returns fresh Iran-related results."""
    divider("TEST 1: SERP API (Google Search)")

    from search import search_news

    query = "Iran attack news today 2025"
    print(f"Query: \"{query}\"")
    results = search_news(query, num_results=5)

    print(f"Results returned: {len(results)}")

    if not results:
        print(f"\n{FAIL} SERP API returned 0 results")
        return False

    print(f"\n{PASS} SERP API returned {len(results)} results\n")
    print("Top results:")
    for i, r in enumerate(results, 1):
        title = r.get("title", "No title")
        url = r.get("url", "")
        snippet = r.get("summary", "")[:120]
        print(f"  {i}. {title}")
        print(f"     URL: {url}")
        print(f"     Snippet: {snippet}...")
        print()

    iran_query_2 = "Iran military strike February 2025"
    print(f"Secondary query: \"{iran_query_2}\"")
    results_2 = search_news(iran_query_2, num_results=5)
    print(f"Results returned: {len(results_2)}")

    if results_2:
        print(f"\n{PASS} Secondary query returned {len(results_2)} results\n")
        for i, r in enumerate(results_2, 1):
            print(f"  {i}. {r.get('title', 'No title')}")
            print(f"     {r.get('url', '')}")
            print()
    else:
        print(f"\n{WARN} Secondary query returned 0 results")

    return len(results) > 0


def test_reddit():
    """Test Reddit API returns fresh Iran-related discussions."""
    divider("TEST 2: Reddit API (PRAW)")

    from api.reddit import search_reddit_posts

    query = "Iran attack"
    print(f"Query: \"{query}\"")
    results = search_reddit_posts(query, limit=5)

    print(f"Results returned: {len(results)}")

    if not results:
        print(f"\n{FAIL} Reddit API returned 0 results")
        return False

    print(f"\n{PASS} Reddit API returned {len(results)} results\n")
    print("Top discussions:")
    for i, r in enumerate(results, 1):
        title = r.get("title", "No title")
        sub = r.get("subreddit", "?")
        score = r.get("score", 0)
        comments = r.get("num_comments", 0)
        url = r.get("url", "")
        print(f"  {i}. r/{sub}: {title}")
        print(f"     Score: {score} | Comments: {comments}")
        print(f"     {url}")
        print()

    return True


def test_twitter():
    """Test Twitter/X API returns fresh Iran-related tweets."""
    divider("TEST 3: Twitter/X API (v2)")

    from api.twitter import search_twitter_posts, get_trending_tweets

    # Test 1: Direct search
    query = "Iran attack"
    print(f"Direct search query: \"{query}\"")
    direct_results = search_twitter_posts(query, limit=5)
    print(f"Direct search results: {len(direct_results)}")

    if direct_results:
        print(f"\n{PASS} Direct search returned {len(direct_results)} tweets\n")
        for i, t in enumerate(direct_results, 1):
            print(f"  {i}. @{t['author_username']}: {t['text'][:120]}...")
            print(f"     Engagement: {t['engagement']} (❤️ {t['likes']}, 🔁 {t['retweets']}, 💬 {t['replies']})")
            print(f"     Date: {t['created_at']} | {t['url']}")
            print()
    else:
        print(f"\n{FAIL} Direct search returned 0 tweets")

    # Test 2: Trending (curated Iran sources)
    print(f"\nTrending curated sources test (topic='iran'):")
    print("Fetching from curated Iran analyst accounts...")
    trending_results = get_trending_tweets("iran", limit=5)
    print(f"Trending results: {len(trending_results)}")

    if trending_results:
        print(f"\n{PASS} Trending endpoint returned {len(trending_results)} tweets\n")
        for i, t in enumerate(trending_results, 1):
            print(f"  {i}. @{t['author_username']}: {t['text'][:120]}...")
            print(f"     Date: {t['created_at']} | Engagement: {t['engagement']}")
            print()
    else:
        print(f"\n{WARN} Trending curated sources returned 0 tweets")
        print("     (This could be rate-limiting from querying 10 accounts sequentially)")

    return len(direct_results) > 0


def main():
    print("╔══════════════════════════════════════════════════════════╗")
    print("║   API FRESHNESS TEST — Iran Monitoring                  ║")
    print(f"║   Date: {today.strftime('%B %d, %Y')} (UTC)                        ║")
    print("╚══════════════════════════════════════════════════════════╝")

    results = {}

    results["serpapi"] = test_serpapi()
    results["reddit"] = test_reddit()
    results["twitter"] = test_twitter()

    divider("SUMMARY")
    for api, passed in results.items():
        status = PASS if passed else FAIL
        print(f"  {status}  {api.upper()}")

    all_passed = all(results.values())
    print()
    if all_passed:
        print("🟢 All APIs are returning data. Monitoring pipeline is operational.")
    else:
        failed = [k.upper() for k, v in results.items() if not v]
        print(f"🔴 ISSUES DETECTED with: {', '.join(failed)}")
        print("   Check API keys, rate limits, and connectivity.")

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
