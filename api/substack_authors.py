"""Curated Substack authors — profile data + latest posts from RSS feeds."""

import time
import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

CURATED_AUTHORS = [
    {
        "name": "Ryan Grim",
        "handle": "ryangrim",
        "bio": "Reporter for Drop Site, co-host of Breaking Points. Author of We've Got People, The Squad, and This Is Your Country On Drugs.",
        "publication": "Drop Site News",
        "subscribers": "671K+",
        "category": "News",
        "profile_url": "https://www.dropsitenews.com/",
        "feed_url": "https://www.dropsitenews.com/feed",
        "linkedin": "ryan-grim-7408675",
        "profile_image": "https://substack-post-media.s3.amazonaws.com/public/images/edaeaa11-4322-4732-86b8-3cb754a225bc_458x510.png",
    },
    {
        "name": "Anu",
        "handle": "anu",
        "bio": "Essays about people, technology, art & the future. Founder, writer, doctor.",
        "publication": "Working Theorys",
        "subscribers": "16K+",
        "category": "Tech",
        "leaderboard": "#40 Rising in Business",
        "profile_url": "https://substack.com/@anu",
        "feed_url": "https://anu.substack.com/feed",
        "linkedin": "anuatluru",
        "profile_image": "https://substack-post-media.s3.amazonaws.com/public/images/bc884943-1df3-4cfd-8d66-1c04d001cdd1_500x500.jpeg",
    },
    {
        "name": "Catherine Liu",
        "handle": "cliuanon",
        "bio": "Author of Virtue Hoarders, American Idyll, and Traumatized. Critic of political, cultural, and social infantilisation.",
        "publication": "CLiuAnon",
        "subscribers": "11K+",
        "category": "Culture",
        "profile_url": "https://substack.com/@cliuanon",
        "feed_url": "https://cliuanon.substack.com/feed",
        "linkedin": "catherine-liu-342651aa",
        "profile_image": "https://substack-post-media.s3.amazonaws.com/public/images/ba4ec678-b0e1-40d4-b5bc-05afe7d0141a_317x317.png",
    },
    {
        "name": "Juan Sebastián Pinto",
        "handle": "cafepinto",
        "bio": "Writing about tech and civil rights. Former storyteller in the AI industry. Published in Forbes, Dwell, and The Guardian.",
        "publication": "Ziggurat",
        "subscribers": "3.6K+",
        "category": "Tech",
        "profile_url": "https://www.zig.art/",
        "feed_url": "https://www.zig.art/feed",
        "linkedin": "jsebastianpinto",
        "profile_image": "https://substack-post-media.s3.amazonaws.com/public/images/b9ee0a44-723e-4938-bd61-994a61676113_569x569.png",
    },
    {
        "name": "Nader Dabit",
        "handle": "nader",
        "bio": "Software engineer, author, and teacher. Growth at Cognition.",
        "publication": "Nader's Thoughts",
        "subscribers": "1.7K+",
        "category": "Tech",
        "profile_url": "https://substack.com/@nader",
        "feed_url": "https://nader.substack.com/feed",
        "linkedin": "naderdabit",
        "profile_image": "https://substack-post-media.s3.amazonaws.com/public/images/d40f5972-2f71-4c94-860c-5648e16ba9f7_1024x1024.png",
    },
]

_authors_cache = {"data": None, "fetched_at": None}
CACHE_TTL = timedelta(hours=72)


def _fetch_author_feed(author, timeout=8):
    """Fetch a single author's RSS feed, extracting avatar and latest post in one request."""
    entry = {**author, "latest_post": None, "avatar_url": author.get("profile_image")}
    try:
        resp = requests.get(author["feed_url"], timeout=timeout, headers={"User-Agent": "MediaReactionFinder/1.0"})
        if resp.status_code != 200 or not resp.text.startswith("<?xml"):
            return entry
        root = ET.fromstring(resp.text)

        if not entry["avatar_url"]:
            img = root.find(".//image/url")
            if img is not None and img.text:
                entry["avatar_url"] = img.text.strip()

        item = root.find(".//item")
        if item is not None:
            title_el = item.find("title")
            link_el = item.find("link")
            pub_date_el = item.find("pubDate")
            title = title_el.text.strip() if title_el is not None and title_el.text else None
            link = link_el.text.strip() if link_el is not None and link_el.text else None
            if title and link:
                entry["latest_post"] = {
                    "title": title,
                    "url": link,
                    "date": pub_date_el.text.strip() if pub_date_el is not None and pub_date_el.text else None,
                }
    except Exception as e:
        print(f"⚠️ RSS fetch failed for {author['feed_url']}: {e}")
    return entry


def get_curated_authors():
    """Return curated authors with latest posts. Cached for 72 hours."""
    from concurrent.futures import ThreadPoolExecutor

    now = datetime.utcnow()
    if _authors_cache["data"] and _authors_cache["fetched_at"] and (now - _authors_cache["fetched_at"]) < CACHE_TTL:
        return _authors_cache["data"]

    print("📰 Fetching curated Substack author feeds...")
    start = time.time()

    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(_fetch_author_feed, CURATED_AUTHORS))

    elapsed = time.time() - start
    print(f"📰 Fetched {len(results)} Substack authors in {elapsed:.2f}s")

    _authors_cache["data"] = results
    _authors_cache["fetched_at"] = now
    return results
