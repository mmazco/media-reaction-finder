import os
from dotenv import load_dotenv

load_dotenv()
load_dotenv('.env.local', override=True)

SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")

REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "mrf_growth_agent/1.0")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Subreddits ---

TIER_1_SUBREDDITS = [
    "journalism",
    "PublicRelations",
    "socialmedia",
    "marketing",
]

TIER_2_SUBREDDITS = [
    "media_criticism",
    "neutralnews",
    "outoftheloop",
    "startups",
]

TIER_3_SUBREDDITS = [
    "SEO",
    "artificial",
]

ALL_SUBREDDITS = TIER_1_SUBREDDITS + TIER_2_SUBREDDITS + TIER_3_SUBREDDITS

# --- Keywords ---

PRIMARY_KEYWORDS = [
    "media monitoring",
    "news aggregator",
    "article reactions",
    "track reactions",
    "media monitoring tool",
    "news analysis tool",
]

SECONDARY_KEYWORDS = [
    "social listening",
    "content tracking",
    "news sentiment",
    "discussion finder",
    "media bias tool",
    "balanced coverage",
    "compare news coverage",
]

ALL_KEYWORDS = PRIMARY_KEYWORDS + SECONDARY_KEYWORDS

# --- Filters ---

MIN_UPVOTES = 1
MIN_COMMENTS = 1
MAX_AGE_HOURS = 48
SKIP_AUTHORS = {"AutoModerator", "[deleted]"}

# --- Prompt templates ---

GEMINI_RELEVANCE_PROMPT = """Classify this Reddit post. Does the poster have a problem that a tool \
for finding media reactions, Reddit discussions, or public discourse \
around news articles could solve?

Reply in this exact format:
VERDICT: YES or NO
REASONING: One sentence explaining why.

Post title: {title}
Post body: {body}
Subreddit: r/{subreddit}"""

GPT_DRAFT_PROMPT = """You are drafting a Reddit comment. The person posting has a problem \
that Media Reaction Finder (mrf.up.railway.app) might help with — \
it aggregates reactions to articles from Reddit, the web, Substack, \
and X in one search.

Rules:
- Lead with genuine curiosity or a relevant personal experience
- Answer the poster's question fully before mentioning any tool
- Mention Media Reaction Finder ONLY when it directly solves the \
  problem being discussed — if it doesn't fit naturally, write a \
  helpful reply without mentioning it at all
- Keep responses conversational and under 120 words
- Include the URL (mrf.up.railway.app) only when explicitly \
  describing the tool
- Never say "I built this" — say "I've been using" or "there's a \
  tool called"
- Sound like a helpful Redditor, not a marketer
- Match the tone of r/{subreddit} — professional for r/journalism, \
  casual for r/startups, tactical for r/SEO

Post title: {title}
Post body: {body}
Subreddit: r/{subreddit}

Reply in this exact format:
TONE: One word describing the tone you're targeting for this subreddit
MRF_MENTIONED: YES or NO (did you include an MRF mention?)
DRAFT:
(your reply here)"""
