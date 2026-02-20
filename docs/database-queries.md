# Database Query Reference

SQLite database: `search_history.db`

Open in DBeaver or run from terminal:
```
sqlite3 -header -column search_history.db "YOUR QUERY"
```

---

## Search Activity

```sql
-- Total searches since launch
SELECT COUNT(*) as total_searches,
       DATE(MIN(timestamp)) as first_search,
       DATE(MAX(timestamp)) as latest_search
FROM searches;

-- Most searched queries
SELECT query, COUNT(*) as times
FROM searches
GROUP BY query
ORDER BY times DESC
LIMIT 10;

-- Searches per day
SELECT DATE(timestamp) as day, COUNT(*) as searches
FROM searches
GROUP BY day
ORDER BY day DESC;

-- Searches per week
SELECT strftime('%Y-W%W', timestamp) as week, COUNT(*) as searches
FROM searches
GROUP BY week
ORDER BY week DESC;

-- Total searches by type (url vs text)
SELECT search_type, COUNT(*) as total
FROM searches
GROUP BY search_type;

-- Recent searches (last 20)
SELECT id, query, search_type, timestamp, results_count,
       ROUND(processing_time, 2) as seconds
FROM searches
ORDER BY timestamp DESC
LIMIT 20;

-- Searches with zero results (potential issues)
SELECT query, timestamp, search_type
FROM searches
WHERE results_count = 0
ORDER BY timestamp DESC;
```

## Performance

```sql
-- Average processing time
SELECT ROUND(AVG(processing_time), 3) as avg_seconds,
       ROUND(MIN(processing_time), 3) as fastest,
       ROUND(MAX(processing_time), 3) as slowest
FROM searches
WHERE processing_time > 0;

-- Average processing time per day (trend)
SELECT DATE(timestamp) as day,
       COUNT(*) as searches,
       ROUND(AVG(processing_time), 3) as avg_seconds
FROM searches
WHERE processing_time > 0
GROUP BY day
ORDER BY day DESC
LIMIT 14;

-- Slowest searches (potential bottlenecks)
SELECT query, ROUND(processing_time, 2) as seconds, timestamp
FROM searches
WHERE processing_time > 0
ORDER BY processing_time DESC
LIMIT 10;
```

## Collections

```sql
-- Articles per collection
SELECT c.tag, c.tag_display_name, COUNT(a.id) as articles
FROM curated_collections c
LEFT JOIN curated_articles a ON c.id = a.collection_id
GROUP BY c.id
ORDER BY articles DESC;

-- All articles in a specific collection
SELECT a.title, a.source, a.authors, a.date, a.recommended, a.url
FROM curated_articles a
JOIN curated_collections c ON a.collection_id = c.id
WHERE c.tag = 'politics'
ORDER BY a.recommended DESC, a.added_at DESC;

-- Recommended articles across all collections
SELECT a.title, a.source, c.tag_display_name as collection
FROM curated_articles a
JOIN curated_collections c ON a.collection_id = c.id
WHERE a.recommended = 1
ORDER BY c.tag;

-- Recently added articles
SELECT a.title, a.source, c.tag as collection, a.added_at
FROM curated_articles a
JOIN curated_collections c ON a.collection_id = c.id
ORDER BY a.added_at DESC
LIMIT 10;
```

## Search Results

```sql
-- Most common sources appearing in results
SELECT source, COUNT(*) as appearances
FROM search_results
WHERE source IS NOT NULL AND source != ''
GROUP BY source
ORDER BY appearances DESC
LIMIT 15;

-- Results for a specific search (replace ID)
SELECT title, url, result_type, category, source
FROM search_results
WHERE search_id = 265;

-- Most linked domains in results
SELECT
  REPLACE(REPLACE(url, 'https://', ''), 'http://', '') as domain,
  COUNT(*) as times
FROM search_results
WHERE url IS NOT NULL
GROUP BY SUBSTR(url, 1, INSTR(SUBSTR(url, 9), '/') + 8)
ORDER BY times DESC
LIMIT 15;
```

## Cache

```sql
-- Current cache status
SELECT
  (SELECT COUNT(*) FROM cached_searches) as search_entries,
  (SELECT COUNT(*) FROM cached_commentary) as commentary_entries;

-- Cached searches with age
SELECT query,
       created_at,
       ROUND(julianday('now') - julianday(created_at), 1) as days_old
FROM cached_searches
ORDER BY created_at DESC;

-- Cached commentary with audio size
SELECT query,
       LENGTH(text) as text_chars,
       LENGTH(audio_base64) as audio_chars,
       ROUND(LENGTH(audio_base64) / 1370.0, 0) as approx_kb,
       created_at
FROM cached_commentary
ORDER BY created_at DESC;

-- Total cache storage used
SELECT
  ROUND(SUM(LENGTH(audio_base64)) / 1048576.0, 2) as commentary_mb,
  ROUND(SUM(LENGTH(results_json)) / 1048576.0, 2) as searches_mb
FROM (
  SELECT audio_base64, NULL as results_json FROM cached_commentary
  UNION ALL
  SELECT NULL, results_json FROM cached_searches
);

-- Expired search cache entries (older than 7 days)
SELECT query, created_at,
       ROUND(julianday('now') - julianday(created_at), 1) as days_old
FROM cached_searches
WHERE created_at <= datetime('now', '-7 days');
```

## Daily Analytics

```sql
-- Daily summary (pre-aggregated)
SELECT date, total_searches, unique_queries,
       ROUND(avg_results_count, 1) as avg_results,
       most_common_query
FROM search_analytics
ORDER BY date DESC
LIMIT 14;
```

---

## Table Reference

| Table | Purpose | Key columns |
|---|---|---|
| `searches` | Every search query logged | query, search_type, timestamp, results_count, processing_time |
| `search_results` | Individual results per search | search_id (FK), title, url, result_type, category, source |
| `search_analytics` | Daily aggregated stats | date, total_searches, unique_queries |
| `curated_collections` | Named article collections | tag, tag_display_name, description |
| `curated_articles` | Articles in collections | collection_id (FK), title, url, source, recommended |
| `cached_searches` | Cached search results (7-day TTL) | query_hash, results_json, created_at |
| `cached_commentary` | Cached audio commentary (permanent) | query_hash, text, audio_base64, created_at |
