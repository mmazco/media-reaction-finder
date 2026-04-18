"""Curated Substack authors — profile data + latest posts from RSS feeds."""

import time
import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from email.utils import parsedate_to_datetime

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
    {
        "name": "Séamus Malekafzali",
        "handle": "seamusmalek",
        "bio": "Freelance journalist writing about the Middle East and obscure film.",
        "publication": "Séamus Malekafzali",
        "subscribers": "",
        "category": "News",
        "leaderboard": "#31 Rising in World Politics",
        "profile_url": "https://substack.com/@seamusmalek",
        # Substack profile pages (substack.com/@handle/posts) aggregate posts across all
        # publications a user contributes to. There's no single RSS feed for that, but the
        # internal profile/posts API returns the same stream. Use it to surface his latest
        # work across Séamus Malekafzali, Burnt Nitrate, Turbulence Pod, etc.
        "profile_user_id": 11128948,
        "profile_image": None,
    },
    {
        "name": "Shanaka Anslem Perera",
        "handle": "shanakaanslemperera",
        "bio": "Independent analyst mapping money, geopolitics, AI, science, and sovereignty. Author of The Ascent Begins.",
        "publication": "The Ascent Begins",
        "subscribers": "21K+",
        "category": "News",
        "leaderboard": "#17 Rising in Finance",
        "profile_url": "https://substack.com/@shanakaanslemperera",
        "feed_url": "https://shanakaanslemperera.substack.com/feed",
        "linkedin": "shanakaanslemperera",
        "profile_image": "https://substack-post-media.s3.amazonaws.com/public/images/ad2b747b-7717-4ea6-8bf9-250ee9c93bd4_1320x990.jpeg",
    },
]

_authors_cache = {"data": None, "fetched_at": None}
CACHE_TTL = timedelta(hours=72)


def _is_rss_xml(text):
    if not text or len(text) < 50:
        return False
    s = text.lstrip("\ufeff \t\n\r")
    return s.startswith("<?xml") and "<rss" in s[:2000] or s[:500].lstrip().startswith("<rss")


def _parse_pub_date(text):
    if not text:
        return None
    try:
        return parsedate_to_datetime(text.strip())
    except Exception:
        return None


def _posts_from_rss_root(root):
    """Return all <item>s as normalized posts, sorted newest-first by pubDate."""
    items = root.findall(".//item")
    if not items:
        return []

    parsed = []
    for item in items:
        title_el = item.find("title")
        link_el = item.find("link")
        pub_date_el = item.find("pubDate")
        title = (title_el.text or "").strip() if title_el is not None else ""
        link = (link_el.text or "").strip() if link_el is not None else ""
        if not title or not link:
            continue
        raw_date = pub_date_el.text.strip() if pub_date_el is not None and pub_date_el.text else None
        parsed.append({
            "title": title,
            "url": link,
            "date": raw_date,
            "_dt": _parse_pub_date(raw_date),
        })

    if not parsed:
        return []

    parsed.sort(key=lambda p: p["_dt"] or datetime.min, reverse=True)
    return [{"title": p["title"], "url": p["url"], "date": p["date"]} for p in parsed]


def _latest_post_from_rss_root(root):
    posts = _posts_from_rss_root(root)
    return posts[0] if posts else None


def _fetch_public_profile(handle, timeout=6):
    """Fetch a Substack user's public_profile (name, photo, primary publication)."""
    try:
        resp = requests.get(
            f"https://substack.com/api/v1/user/{handle}/public_profile",
            timeout=timeout,
            headers={"User-Agent": "MediaReactionFinder/1.0"},
        )
        if resp.status_code != 200:
            return None
        return resp.json()
    except Exception as e:
        print(f"⚠️ Public profile fetch failed for @{handle}: {e}")
        return None


def _fetch_profile_posts(profile_user_id, timeout=8, limit=5):
    """Fetch posts from Substack's profile/posts API.

    Returns a list of posts sorted newest-first, each with title/url/date.
    Mirrors what's shown at substack.com/@<handle>/posts — aggregated across
    every publication the user contributes to.
    """
    try:
        resp = requests.get(
            "https://substack.com/api/v1/profile/posts",
            params={"profile_user_id": profile_user_id, "limit": limit},
            timeout=timeout,
            headers={"User-Agent": "MediaReactionFinder/1.0"},
        )
        if resp.status_code != 200:
            return []
        data = resp.json()
    except Exception as e:
        print(f"⚠️ Profile posts fetch failed for user {profile_user_id}: {e}")
        return []

    posts = data.get("posts", []) if isinstance(data, dict) else []
    normalized = []
    for p in posts:
        title = (p.get("title") or "").strip()
        url = (p.get("canonical_url") or "").strip()
        if not title or not url:
            continue
        normalized.append({
            "title": title,
            "url": url,
            "date": p.get("post_date"),
            "publication": ((p.get("publishedBylines") or [{}])[0].get("publicationUsers") or [{}])[0].get("publication", {}).get("name")
                or p.get("publication_name"),
            "type": p.get("type"),
        })

    def _key(p):
        d = _parse_pub_date(p["date"])
        return d or datetime.min
    normalized.sort(key=_key, reverse=True)
    return normalized


def _fetch_author_feed(author, timeout=8):
    """Fetch RSS feed(s) or profile API, extracting avatar and latest post.

    Supports feed_url, feed_urls, or profile_user_id. When profile_user_id is
    present, the Substack profile posts API is used as the primary source so
    the card reflects the aggregated feed at substack.com/@<handle>/posts.
    """
    entry = {
        **author,
        "latest_post": None,
        "recent_posts": [],
        "avatar_url": author.get("profile_image"),
    }

    profile_user_id = author.get("profile_user_id")
    if profile_user_id:
        if not entry["avatar_url"] and author.get("handle"):
            profile = _fetch_public_profile(author["handle"], timeout=timeout)
            if profile and profile.get("photo_url"):
                entry["avatar_url"] = profile["photo_url"]
        posts = _fetch_profile_posts(profile_user_id, timeout=timeout, limit=5)
        if posts:
            entry["recent_posts"] = posts[:5]
            entry["latest_post"] = {
                "title": posts[0]["title"],
                "url": posts[0]["url"],
                "date": posts[0].get("date"),
            }
            return entry
        # Fall through to RSS if the API call failed and a feed is configured.

    urls = author.get("feed_urls")
    if urls:
        feed_urls = [u for u in urls if u]
    else:
        feed_urls = [author["feed_url"]] if author.get("feed_url") else []

    if not feed_urls:
        return entry

    all_posts = []
    channel_image_url = None

    for feed_url in feed_urls:
        try:
            resp = requests.get(
                feed_url, timeout=timeout, headers={"User-Agent": "MediaReactionFinder/1.0"}
            )
            if resp.status_code != 200 or not _is_rss_xml(resp.text):
                continue
            root = ET.fromstring(resp.text)

            if not channel_image_url:
                img = root.find(".//image/url")
                if img is not None and img.text:
                    channel_image_url = img.text.strip()

            all_posts.extend(_posts_from_rss_root(root))
        except Exception as e:
            print(f"⚠️ RSS fetch failed for {feed_url}: {e}")

    if not entry["avatar_url"] and channel_image_url:
        entry["avatar_url"] = channel_image_url

    all_posts.sort(key=lambda p: _parse_pub_date(p.get("date")) or datetime.min, reverse=True)

    if all_posts:
        entry["latest_post"] = {
            "title": all_posts[0]["title"],
            "url": all_posts[0]["url"],
            "date": all_posts[0].get("date"),
        }

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
