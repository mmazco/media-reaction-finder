# Product Roadmap

Items already shipped are in [backend_performance_improvements_19022026](../.cursor/plans/backend_performance_improvements_19022026_b8cdd256.plan.md). Raw feedback is in [userfeedback.md](userfeedback.md).

---

## Phase 1 — Give people a reason to open the app (Retention)

### A. Curated subreddit feed on homepage ✅

**Source:** Growth strategy — fellow user suggestion + our curation approach

> "Have you considered e.g. taking every front page article on HackerNews or Reddit and running it through your page? That way the user doesn't have to find an article to link."

The app currently requires users to arrive with an article in hand. A homepage feed from curated subreddits (r/worldnews, r/CriticalTheory, r/AI_Agents, r/PredictionsMarkets) showing top discussions every 24-48h solves the cold-start problem. PRAW already works, the trending endpoint pattern already exists, and caching keeps API costs low. Each card links through to a full reaction search so users naturally discover the core feature.

**Curated feed search process (`/api/curated-feed`):**

- **Sources:** Two Reddit sort modes per subreddit — `hot(limit=15)` first, then `top(time_filter='week', limit=10)` as fallback.
- **Filtering:** Posts with 0 comments are skipped at the backend. Stickied posts excluded. Deduplication by post ID across both sources.
- **Per post:** Top 2 comments fetched with author and score. No AI summaries on homepage (removed for performance — see Learnings L2).
- **Caching:** In-memory with 48-hour TTL. Server restart clears cache.
- **Click-through:** Clicking a curated post triggers a full reaction search using the post title as query. The source post appears first in results with a "Source" badge.
- **Why hot(limit=15) + weekly top fallback:** The original `hot(limit=4)` was too narrow for smaller subreddits like r/CriticalTheory where hot posts often have 0 comments. Widening the pool and adding a weekly top fallback ensures every subreddit surfaces posts with real discussion (see Learnings L1).

### B. Empty/missing state messaging ✅

**Source:** User #2

> "The related news + reddit reaction combo is sickkk, but notice reddit reaction doesn't always show up."

When Reddit returns nothing, the section vanishes with no explanation. A simple "No Reddit discussions found for this article" with a suggestion to try a broader topic search fixes a real UX gap. Same treatment for web results and any other empty section.

### C. Fix the "as an LLM I cannot..." leak ✅

**Source:** User #4

> "One of the Reddit posts had a link as the top comment and the LLM provided 'as an LLM I cannot search the web including the link...'"

If someone hits this on their first visit via the curated feed, it destroys trust. The summarisation prompt in `api/reddit.py` needs a guard: strip or paraphrase links before sending to the LLM, and add a fallback that returns the raw top comment instead.

---

## Phase 2 — Differentiate from Perplexity (Value prop)

### D. Result categorization with reasoning ✅

**Source:** Users #5, #7

> "My main unanswered question: what am I getting here that I wouldn't get at Perplexity?" — User #7

> "To use this it would have to have a high value output that I couldn't get from ChatGPT." — User #5

Label results as "Mainstream Coverage," "Analysis," "Opinion" with colour-coded badges. This maps the discourse landscape rather than just summarizing — the core differentiator from ChatGPT/Perplexity. The summarize pipeline is already in place; this layers a classification prompt on top.

### E. Reddit embeds alongside AI summaries ✅

**Source:** User #1 (most requested feature)

> "Under Reddit News, if there is a way to bring in the reddit embeds instead of an AI summary of the thread that may feel more natural."

Show 2-3 actual top comments with author/score, keep the AI summary as a TLDR above. Real voices instead of AI paraphrasing — the core value prop of the app.

---

## Phase 3 — Broaden input types (Utility)

### F. PDF and tweet URL support

**Source:** Users #3, #6

> "I tried a PDF and a tweet but neither worked." — User #6

PDFs cover academic/policy papers (fits the r/CriticalTheory audience). Tweet URLs cover social-media-native users. For PDFs: extract text with PyPDF2 or pdfplumber. For tweets: detect twitter.com/x.com URLs and use the existing Twitter API.

### G. Substack integration (two parts)

**Source:** Growth strategy — our discussion

Substack is article-rich and aligns with the app's audience. The official Substack Developer API and RSS feeds each serve a different purpose for us.

#### API findings

The [Substack Developer API](https://support.substack.com/hc/en-us/articles/45099095296916-Substack-Developer-API) is a **profile lookup tool, not a content API**. The only endpoint is:

```
GET https://substack.com/profile/search/linkedin/{linkedin-handle}
```

It returns profile metadata (handle, profileUrl, leaderboard rank, publication name, category label, bestseller tier, approximate free subscribers, follower count). It does **not** return articles, post feeds, or content. Access requires a Substack account + agreement to their API Terms of Use via a Google Form, with 3-5 business day approval.

**Limitations:** Requires a LinkedIn handle as input (self-reported, unverified by Substack). Not all profiles are queryable. Data refreshes daily, not real-time. Rate limits may apply.

#### G1. Substack in search results (SerpAPI `site:substack.com`)

When a user searches for a topic or URL, run an additional SerpAPI query with `site:substack.com` to surface relevant Substack articles. Display these with a **Substack source badge** (distinct from Web and Reddit badges) in the results. This uses existing infrastructure (SerpAPI) and positions Substack as a higher-signal opinion/analysis source.

**Implementation:** Add a parallel SerpAPI call with `site:substack.com {query}`, return results under a new `substack` key, display in a dedicated "Substack" section or interleaved with web results using a Substack badge.

#### G2. Curated Substack authors on homepage

A homepage section (below curated topics, above or alongside top discussions) featuring 4 handpicked Substack authors. For each author:

- **Profile metadata** from the Substack API (publication name, category, subscriber count, bestseller tier) — looked up by LinkedIn handle, cached long-term since profile data changes rarely.
- **What they write about** — a short editorial description (hardcoded or pulled from the publication tagline).
- **Latest post** via RSS feed (`{publication}.substack.com/feed`) — title, date, excerpt.

The 4 authors and their LinkedIn handles are curated by us (no user input). The API calls are lightweight GETs, cached for 48-72 hours. RSS feeds are fetched on the same schedule.

**Efficiency considerations:**
- Cache aggressively — author profiles change rarely, RSS feeds update at most daily.
- Fetch in parallel on server startup or first homepage load, then serve from cache.
- Keep the UI compact: author avatar/name + one-liner + latest post title as a link. Expand on click if needed.
- Avoid blocking the homepage render — load this section async like the Reddit curated feed.

**Next step:** Maryam to provide top 4 author examples + their LinkedIn handles. Then: apply for Substack API access, build the endpoint, integrate RSS feeds.

---

## Phase 4 — Architecture & Distribution

### H. Componentize the frontend

**Source:** Internal architecture need

`App.jsx` is ~3,000+ lines. Splitting into SearchPage, CollectionsPage, TrendingPage, Sidebar, ResultCard etc. unblocks every frontend change in Phases 1-3. Consider doing a lightweight split as part of Phase 1 rather than a standalone task.

### I. Chrome extension

**Source:** Users #3, #5

> "Would love this as a Chrome extension, so I can just hit a hot-key when looking at an article." — User #3

> "It would have to be embedded in the flow from seeing the article." — User #5

Distribution play. Build once the core loop (visit homepage → discover content → search reactions → come back tomorrow) is solid.

### J. Bluesky integration

**Source:** User #3

> "Include bsky reactions!"

Bluesky's API is open and straightforward. Adds a third reaction source alongside Reddit and web results, broadening coverage for media/politics/tech topics.

### K. YouTube transcript analysis

**Source:** User #4

> "Searching YouTube and providing sentiment from video transcripts could be cool?"

Pull transcripts via youtube-transcript-api and run sentiment/summary. A unique feature no competitor offers.

---

## Already Shipped

### Core features

| Item | Phase | Status |
| --- | --- | --- |
| Curated subreddit feed on homepage (hot + weekly top fallback, 0-comment filter) | 1A | ✅ Done |
| Curated topics section on homepage (above top discussions) | 1A | ✅ Done |
| Curated post click-through with "Source" badge in results | 1A | ✅ Done |
| Empty/missing state messaging (Reddit, web, no results) | 1B | ✅ Done |
| Fix LLM refusal leak (link stripping, raw-comment fallback) | 1C | ✅ Done |
| Result categorization — Mainstream Coverage / Analysis / Opinion badges | 2D | ✅ Done |
| Reddit top comments alongside AI summaries | 2E | ✅ Done |

### Search quality

| Item | Phase | Status |
| --- | --- | --- |
| Filter Reddit URLs out of web results (they belong in the Reddit section) | 2D | ✅ Done |
| Cross-section deduplication — web results deduplicated against Reddit by title | 2D | ✅ Done |
| Filter out 0-comment Reddit posts from all sections | 1A | ✅ Done |
| Ban origin URL from results | Infra | ✅ Done |
| Hide failed summary labels ("Unable to summarize", "Summarization unavailable") | 2E | ✅ Done |
| AI summaries generated from top comments when selftext is empty | 2E | ✅ Done |

### UI / UX

| Item | Phase | Status |
| --- | --- | --- |
| Sidebar redesign (floating hamburger menu, dark mode toggle) | UI | ✅ Done |
| Search bar restyling (Oboe-inspired rounded input with send button) | UI | ✅ Done |
| Homepage spacing improvements (title, sections, form) | UI | ✅ Done |
| Sentence case consistency across all headings and labels | UI | ✅ Done |
| Reddit card consistency (speech bubble + comment count across all sections) | UI | ✅ Done |
| Loading message for "Top discussions" section | UI | ✅ Done |
| Long text overflow fix (word-break on Reddit comments) | UI | ✅ Done |
| IranPoliticalGraph left padding fix (sidebar overlap) | UI | ✅ Done |
| Design system documentation (`docs/design-system.md`) | UI | ✅ Done |
| Font consistency — Georgia headings, Arial body | UI | ✅ Done |
| Sidebar history simplified to plain text list | UI | ✅ Done |
| Example articles on homepage | 1A | ✅ Done |

### Infrastructure

| Item | Phase | Status |
| --- | --- | --- |
| Cache TTL (7-day search, permanent commentary) | Infra | ✅ Done |
| Curated feed cache — 48-hour in-memory TTL | Infra | ✅ Done |
| Parallelize API calls (ThreadPoolExecutor) | Infra | ✅ Done |
| Pin dependency versions | Infra | ✅ Done |
| Dead code removal (api/reactions.py, api/search.py, api/reactions_local.py) | Infra | ✅ Done |
| Singleton SearchLogger | Infra | ✅ Done |
| Startup task guards (file lock) | Infra | ✅ Done |
| Debug endpoint security (local only) | Infra | ✅ Done |
| Remove duplicate Reddit summarization calls | Infra | ✅ Done |

---

## Learnings & Process Notes

Things we discovered the hard way. Reference these before making similar changes.

### L1. Small subreddits need wider fetch windows

**Context:** r/CriticalTheory curated feed returned zero posts.

**Root cause:** `subreddit.hot(limit=4)` only checked 4 posts. After filtering stickied posts and 0-comment posts, nothing was left.

**Fix:** Widened to `hot(limit=15)` with a `top(time_filter='week', limit=10)` fallback. Deduplication by post ID across both sources prevents repeats.

**Rule of thumb:** Any subreddit with < 50k members likely needs the fallback path. If we add new subreddits in the future, test with the wider window first.

### L2. AI summaries on the homepage kill load time

**Context:** Homepage felt slow and "buggy" — content appeared in stages with a multi-second gap.

**Root cause:** The `/api/curated-feed` endpoint was calling the LLM to generate a 2-sentence summary for every curated post (up to 12 posts × ~1-2s per LLM call). This blocked the entire response.

**Fix:** Removed summary generation from the curated feed endpoint entirely. AI summaries are only generated on the search results page (when the user clicks through). Homepage now returns raw post data + top comments only.

**Rule of thumb:** Never block a page load on LLM calls. Generate AI content on demand (user action), not speculatively.

### L3. "Unable to summarize content" leaks to the UI

**Context:** Search results displayed "Unable to summarize content" as a visible label when the LLM failed.

**Root cause:** `summarize.py` returned the literal string "Unable to summarize content" on Gemini failure and "Summarization unavailable" when no API keys were configured. The frontend rendered these strings as summaries.

**Fix:** Backend now returns empty string on failure. Frontend also filters out any summary starting with "Unable to" or "Summarization unavailable" to catch stale cached results.

**Rule of thumb:** Error states from the backend should never be user-visible text. Return empty/null and let the frontend decide how (or whether) to indicate missing data.

### L4. Reddit URLs appear in web search results

**Context:** A search returned Reddit threads labelled as "Web" results, duplicating content already in the Reddit section.

**Root cause:** SerpAPI's Google search returns Reddit threads as organic results. These were passed through to the web section without filtering.

**Fix:** Added two backend filters before web result classification: (1) remove any result with `reddit.com` in the URL, (2) deduplicate by title against the Reddit results.

**Rule of thumb:** Any new content source added to web search (e.g., Bluesky, YouTube) will need the same cross-source deduplication treatment.

### L5. Stale cache causes "ghost" labels and old data

**Context:** After updating classification labels from 5 categories to 3, old labels ("Unique Take", "Critical Perspective") kept appearing.

**Root cause:** `cached_searches` in SQLite had no TTL expiry, so results cached weeks ago were served forever.

**Fix:** Added 7-day TTL to search cache. Commentary cache remains permanent (it's a produced artifact tied to a specific article). When deploying label/schema changes, manually clear the `cached_searches` table.

**Rule of thumb:** After any change to result structure, labels, or summary logic, clear `cached_searches` to avoid stale data persisting for up to 7 days.

### L6. React stale closures break async flows

**Context:** Clicking a curated Reddit post triggered a search, but the "source post" data was lost by the time the search response arrived.

**Root cause:** The source post was stored in React state (`setCuratedSourcePost`), but `performSearch` captured the old state value in a closure before the state update propagated.

**Fix:** Pass the source post directly as a function argument to `performSearch` instead of relying on state. This bypasses the async state update entirely.

**Rule of thumb:** When a value is needed synchronously inside an async function, pass it as a parameter — don't rely on React state that was just set.

### L7. Meta commentary fails for topic searches

**Context:** Clicking "Generate commentary" on search results from a curated post (topic search) returned "Failed to generate commentary."

**Root cause:** The `article` state was `null` for topic-based searches (no URL was analysed), so the backend received an empty object and couldn't generate commentary.

**Fix:** Frontend passes a fallback article object `{ title: query, source: 'Topic Search', summary: '' }` when the real `article` state is null.

**Rule of thumb:** Any feature that depends on `article` state must handle the topic-search case where no article metadata exists.

### L8. Curated feed cache requires server restart to refresh

**Context:** The curated feed uses in-memory caching (`_curated_cache` dict in `app.py`). Unlike the SQLite search cache, this has no persistent store.

**Current behaviour:** Cache lives for 48 hours. A server restart (deploy, crash, manual restart) clears it and forces a fresh fetch on next request.

**Implication:** If subreddit lists change or a post is problematic, restarting the Flask server is the quickest way to force a refresh. There is no admin endpoint to clear the cache without restarting.

---

## Process Checklist

Reference before making changes to avoid repeat mistakes.

### After changing result structure, labels, or summary logic
1. Clear `cached_searches` table: `DELETE FROM cached_searches`
2. Restart Flask server (clears in-memory curated feed cache)
3. Hard refresh browser (clears frontend state)

### After adding a new subreddit to the curated feed
1. Test with `hot(limit=15)` — check if it returns posts with comments
2. If the subreddit has < 50k members, verify the `top(time_filter='week')` fallback is producing results
3. Restart Flask server to clear the curated cache

### After modifying the summarization pipeline
1. Verify `summarize.py` never returns user-visible error strings (should return empty string on failure)
2. Check both Direct reactions and Topic discussions sections in the frontend for any hard-coded fallback text
3. Clear `cached_searches` to purge stale summaries

### After adding a new content source (web, social, etc.)
1. Add cross-source deduplication in `app.py` (filter URLs of source X from section Y)
2. Add title-based deduplication against existing sections
3. Verify the new source's results don't appear as "Web" results via SerpAPI
