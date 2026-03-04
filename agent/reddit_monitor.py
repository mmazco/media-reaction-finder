"""
Reddit Growth Agent — find opportunities, draft replies, notify via Slack.

Usage:
    python -m agent.reddit_monitor          # full run
    python -m agent.reddit_monitor --dry    # search only, no Slack
"""

import argparse
import json
import re
import time
from datetime import datetime, timezone

import google.generativeai as genai
import praw
import requests
from openai import OpenAI

from agent.config import (
    ALL_KEYWORDS,
    ALL_SUBREDDITS,
    GEMINI_API_KEY,
    GEMINI_RELEVANCE_PROMPT,
    GPT_DRAFT_PROMPT,
    MAX_AGE_HOURS,
    MIN_COMMENTS,
    MIN_UPVOTES,
    OPENAI_API_KEY,
    REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET,
    REDDIT_USER_AGENT,
    SKIP_AUTHORS,
    SLACK_WEBHOOK_URL,
)
from agent.dedup import is_seen, mark_seen, seen_count


def init_reddit():
    return praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT,
    )


def search_subreddits(reddit):
    """Search all subreddit×keyword combos. Returns deduplicated list of candidates."""
    candidates = {}
    now = datetime.now(timezone.utc)

    for sub_name in ALL_SUBREDDITS:
        subreddit = reddit.subreddit(sub_name)
        for keyword in ALL_KEYWORDS:
            try:
                for post in subreddit.search(keyword, sort="new", time_filter="day", limit=10):
                    if post.id in candidates:
                        continue
                    if is_seen(post.id):
                        continue

                    age_hours = (now - datetime.fromtimestamp(post.created_utc, tz=timezone.utc)).total_seconds() / 3600
                    if age_hours > MAX_AGE_HOURS:
                        continue
                    if post.score < MIN_UPVOTES:
                        continue
                    if post.num_comments < MIN_COMMENTS:
                        continue
                    if post.stickied:
                        continue
                    if str(post.author) in SKIP_AUTHORS:
                        continue

                    candidates[post.id] = {
                        "id": post.id,
                        "title": post.title,
                        "body": (post.selftext or "")[:1500],
                        "subreddit": sub_name,
                        "score": post.score,
                        "num_comments": post.num_comments,
                        "url": f"https://reddit.com{post.permalink}",
                        "age_hours": round(age_hours, 1),
                        "keyword": keyword,
                    }
            except Exception as e:
                print(f"  [!] Error searching r/{sub_name} for '{keyword}': {e}")

    return list(candidates.values())


def classify_relevance(post):
    """Stage 2: Gemini Flash relevance gate. Returns (verdict, reasoning)."""
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash-lite")

    prompt = GEMINI_RELEVANCE_PROMPT.format(
        title=post["title"],
        body=post["body"][:800],
        subreddit=post["subreddit"],
    )

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        verdict_match = re.search(r"VERDICT:\s*(YES|NO)", text, re.IGNORECASE)
        reasoning_match = re.search(r"REASONING:\s*(.+)", text, re.IGNORECASE)

        verdict = verdict_match.group(1).upper() if verdict_match else "NO"
        reasoning = reasoning_match.group(1).strip() if reasoning_match else text[:200]

        return verdict, reasoning
    except Exception as e:
        print(f"  [!] Gemini error for post {post['id']}: {e}")
        return "NO", f"Error: {e}"


def draft_reply(post):
    """Stage 3: GPT-4o-mini drafts a natural Reddit reply. Returns (tone, mrf_mentioned, draft)."""
    client = OpenAI(api_key=OPENAI_API_KEY)

    prompt = GPT_DRAFT_PROMPT.format(
        title=post["title"],
        body=post["body"][:800],
        subreddit=post["subreddit"],
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=300,
        )
        text = response.choices[0].message.content.strip()

        tone_match = re.search(r"TONE:\s*(.+)", text, re.IGNORECASE)
        mrf_match = re.search(r"MRF_MENTIONED:\s*(YES|NO)", text, re.IGNORECASE)
        draft_match = re.search(r"DRAFT:\s*\n?([\s\S]+)", text, re.IGNORECASE)

        tone = tone_match.group(1).strip() if tone_match else "conversational"
        mrf_mentioned = mrf_match.group(1).upper() if mrf_match else "UNKNOWN"
        draft = draft_match.group(1).strip() if draft_match else text

        return tone, mrf_mentioned, draft
    except Exception as e:
        print(f"  [!] GPT error for post {post['id']}: {e}")
        return "unknown", "NO", f"Error drafting reply: {e}"


def format_slack_message(post, reasoning, tone, mrf_mentioned, draft):
    """Build the multi-stage Slack notification."""
    word_count = len(draft.split())
    mrf_count = draft.lower().count("media reaction finder") + draft.lower().count("mrf")
    age_str = f"{post['age_hours']}h ago" if post["age_hours"] < 24 else f"{round(post['age_hours']/24, 1)}d ago"

    quoted_draft = "\n".join(f"> {line}" for line in draft.split("\n"))

    return (
        f":dart: *New Reddit opportunity*\n\n"
        f":round_pushpin: *r/{post['subreddit']}* · :arrow_up: {post['score']} · "
        f":speech_balloon: {post['num_comments']} · {age_str}\n"
        f"*\"{post['title']}\"*\n"
        f"{post['url']}\n\n"
        f"───────────────────────────────\n\n"
        f":mag: *Stage 1 — Search*\n"
        f"Found via keyword \"{post['keyword']}\" in r/{post['subreddit']}\n"
        f"Post age: {age_str} · :arrow_up: {post['score']} · :speech_balloon: {post['num_comments']} · "
        f"Not stickied · Not bot\n"
        f"Dedup: New post (first time seen)\n\n"
        f":white_check_mark: *Stage 2 — Relevance gate (Gemini Flash)*\n"
        f"Verdict: YES\n"
        f"Reasoning: {reasoning}\n\n"
        f":writing_hand: *Stage 3 — Draft reply (GPT-4o-mini)*\n"
        f"Tone target: r/{post['subreddit']} — {tone}\n"
        f"MRF mention: {'Yes' if mrf_mentioned == 'YES' else 'No'}\n\n"
        f"{quoted_draft}\n\n"
        f"Word count: {word_count} · MRF mentions: {mrf_count}\n\n"
        f"───────────────────────────────\n\n"
        f":point_right: Reply to this thread: {post['url']}\n\n"
        f"React: :white_check_mark: replied · :fast_forward: skipped · :eyes: later · :clipboard: backlog"
    )


def send_slack(message):
    if not SLACK_WEBHOOK_URL:
        print("  [!] SLACK_WEBHOOK_URL not set — skipping notification")
        return False
    try:
        resp = requests.post(
            SLACK_WEBHOOK_URL,
            json={"text": message},
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        return resp.status_code == 200
    except Exception as e:
        print(f"  [!] Slack error: {e}")
        return False


def run(dry_run=False):
    print(f"\n{'='*50}")
    print(f"  Reddit Growth Agent — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"  Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"  Subreddits: {len(ALL_SUBREDDITS)} · Keywords: {len(ALL_KEYWORDS)}")
    print(f"  Previously seen posts: {seen_count()}")
    print(f"{'='*50}\n")

    reddit = init_reddit()

    print("[1/5] Searching subreddits...")
    candidates = search_subreddits(reddit)
    print(f"  Found {len(candidates)} new candidates\n")

    if not candidates:
        print("  No new posts found. Done.")
        return

    relevant = []
    print(f"[2/5] Running relevance gate (Gemini Flash) on {len(candidates)} posts...")
    for post in candidates:
        verdict, reasoning = classify_relevance(post)
        print(f"  r/{post['subreddit']}: \"{post['title'][:60]}...\" → {verdict}")
        if verdict == "YES":
            post["reasoning"] = reasoning
            relevant.append(post)
        mark_seen(post["id"], post["subreddit"], post["keyword"])
        time.sleep(0.5)

    print(f"\n  {len(relevant)} posts passed relevance gate\n")

    if not relevant:
        print("  No relevant posts. Done.")
        return

    print(f"[3/5] Drafting replies (GPT-4o-mini) for {len(relevant)} posts...")
    opportunities = []
    for post in relevant:
        tone, mrf_mentioned, draft = draft_reply(post)
        post["tone"] = tone
        post["mrf_mentioned"] = mrf_mentioned
        post["draft"] = draft
        opportunities.append(post)
        print(f"  r/{post['subreddit']}: drafted ({len(draft.split())} words, MRF: {mrf_mentioned})")
        time.sleep(0.5)

    print(f"\n[4/5] Sending {len(opportunities)} Slack notifications...")
    sent = 0
    for post in opportunities:
        message = format_slack_message(
            post, post["reasoning"], post["tone"], post["mrf_mentioned"], post["draft"]
        )
        if dry_run:
            print(f"\n--- DRY RUN: Would send to Slack ---")
            print(message)
            print(f"--- END ---\n")
            sent += 1
        else:
            if send_slack(message):
                sent += 1
                print(f"  ✓ Sent: r/{post['subreddit']} — \"{post['title'][:50]}...\"")
            else:
                print(f"  ✗ Failed: r/{post['subreddit']} — \"{post['title'][:50]}...\"")
            time.sleep(1)

    print(f"\n[5/5] Summary")
    print(f"  Candidates found: {len(candidates)}")
    print(f"  Passed relevance gate: {len(relevant)}")
    print(f"  Slack notifications sent: {sent}")
    print(f"  Total seen posts: {seen_count()}")
    print(f"\nDone.\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reddit Growth Agent")
    parser.add_argument("--dry", action="store_true", help="Dry run — no Slack notifications")
    args = parser.parse_args()
    run(dry_run=args.dry)
