import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "agent_seen_posts.db")


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS seen_posts (
            post_id TEXT PRIMARY KEY,
            subreddit TEXT,
            keyword TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"""
    )
    conn.commit()
    return conn


def is_seen(post_id: str) -> bool:
    conn = _get_conn()
    row = conn.execute(
        "SELECT 1 FROM seen_posts WHERE post_id = ?", (post_id,)
    ).fetchone()
    conn.close()
    return row is not None


def mark_seen(post_id: str, subreddit: str = "", keyword: str = ""):
    conn = _get_conn()
    conn.execute(
        "INSERT OR IGNORE INTO seen_posts (post_id, subreddit, keyword) VALUES (?, ?, ?)",
        (post_id, subreddit, keyword),
    )
    conn.commit()
    conn.close()


def seen_count() -> int:
    conn = _get_conn()
    count = conn.execute("SELECT COUNT(*) FROM seen_posts").fetchone()[0]
    conn.close()
    return count
