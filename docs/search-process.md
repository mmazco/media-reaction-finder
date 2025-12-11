# Search Process Documentation

## Overview

When a user submits a query, the system searches for reactions across web and Reddit, then combines results.

## Input Types

| Type | Detection | Example |
|------|-----------|---------|
| URL | Starts with `http` | `https://nytimes.com/article...` |
| Text | Everything else | `AI regulation debate` |

## Search Flow

```
User Input
    ↓
┌─────────────────────────────────────┐
│  URL?  →  Extract Article Metadata  │
│         (title, source, date, content)
│         Generate AI summary         │
└─────────────────────────────────────┘
    ↓
┌──────────────────┬──────────────────┐
│   Web Search     │   Reddit Search  │
│   (SerpAPI)      │   (PRAW)         │
└──────────────────┴──────────────────┘
    ↓
Filter same-domain results
    ↓
Combine & Display
```

## Web Search (`api/search.py`)

- Uses SerpAPI Google search
- Passes raw query (URL or text) directly
- Returns: title, url, snippet
- **No distinction** between article reactions vs topic coverage

## Reddit Search (`api/reddit.py`)

### For URL queries (3 phases):

| Phase | Strategy | Purpose |
|-------|----------|---------|
| 1 | `url:"stripped-url"` | Find posts linking to exact article |
| 2 | Search by article title | Find topic discussions |
| 3 | Search URL as text | Fallback |

### For text queries:
- Single search on r/all
- Sorted by relevance, filtered to last month

### Filtering:
- Skips posts with < 2 comments
- Deduplicates by permalink
- Tags results with `match_type`: `url_exact`, `topic`, or `url_text`

### Sorting:
- URL exact matches get priority (+1000 bonus)
- Then by engagement: `score + (num_comments × 2)`

## Result Structure

```json
{
  "web": [...],      // Web search results
  "reddit": [...],   // Reddit discussions
  "article": {       // Only for URL queries
    "title": "",
    "source": "",
    "date": "",
    "summary": "",
    "url": ""
  }
}
```

## Current Limitations

1. **Web search doesn't distinguish** between direct article reactions vs general topic coverage
2. **Reddit phases are merged** into single list despite different intents
3. **No explicit "reactions to this article" vs "topic discussion" split** in UI

## Files

| File | Purpose |
|------|---------|
| `api/reactions.py` | Main endpoint, orchestrates search |
| `api/search.py` | SerpAPI web search |
| `api/reddit.py` | Reddit search via PRAW |
| `api/summarize.py` | OpenAI summarization |
| `frontend/App.jsx` | UI, displays combined results |

