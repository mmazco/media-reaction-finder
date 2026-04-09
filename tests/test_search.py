"""Unit tests for search.py — search_news, search_substack, is_likely_substack."""

from unittest.mock import patch, MagicMock
import pytest


# ── search_news ──────────────────────────────────────────────────────────────


class TestSearchNews:
    """Tests for the search_news function."""

    @patch("search.requests.get")
    @patch("search.SERP_API_KEY", "fake-key")
    def test_returns_formatted_results(self, mock_get, serpapi_organic_results):
        mock_get.return_value.json.return_value = serpapi_organic_results

        from search import search_news

        results = search_news("test query", num_results=2)

        assert len(results) == 2
        assert results[0]["title"] == "Breaking: Major Event"
        assert results[0]["url"] == "https://example.com/article-1"
        assert results[0]["summary"] == "A short summary of article 1."

    @patch("search.requests.get")
    @patch("search.SERP_API_KEY", "fake-key")
    def test_respects_num_results_param(self, mock_get, serpapi_organic_results):
        mock_get.return_value.json.return_value = serpapi_organic_results

        from search import search_news

        search_news("test", num_results=10)
        called_params = mock_get.call_args[1]["params"]
        assert called_params["num"] == 10

    @patch("search.SERP_API_KEY", None)
    def test_returns_empty_when_no_api_key(self):
        from search import search_news

        results = search_news("anything")
        assert results == []

    @patch("search.requests.get", side_effect=Exception("network down"))
    @patch("search.SERP_API_KEY", "fake-key")
    def test_returns_empty_on_request_exception(self, mock_get):
        from search import search_news

        results = search_news("query")
        assert results == []

    @patch("search.requests.get")
    @patch("search.SERP_API_KEY", "fake-key")
    def test_logs_search_on_success(self, mock_get, serpapi_organic_results):
        mock_get.return_value.json.return_value = serpapi_organic_results

        from search import search_news, search_logger

        with patch.object(search_logger, "log_search") as mock_log:
            search_news("test query", user_ip="1.2.3.4")
            mock_log.assert_called_once()
            call_kwargs = mock_log.call_args[1]
            assert call_kwargs["query"] == "test query"
            assert call_kwargs["user_ip"] == "1.2.3.4"
            assert call_kwargs["search_type"] == "news"

    @patch("search.requests.get")
    @patch("search.SERP_API_KEY", "fake-key")
    def test_survives_logging_failure(self, mock_get, serpapi_organic_results):
        mock_get.return_value.json.return_value = serpapi_organic_results

        from search import search_news, search_logger

        with patch.object(search_logger, "log_search", side_effect=Exception("db error")):
            results = search_news("test query")
            # Should still return results even if logging fails
            assert len(results) == 2

    @patch("search.requests.get")
    @patch("search.SERP_API_KEY", "fake-key")
    def test_handles_empty_organic_results(self, mock_get):
        mock_get.return_value.json.return_value = {"organic_results": []}

        from search import search_news

        results = search_news("obscure query")
        assert results == []

    @patch("search.requests.get")
    @patch("search.SERP_API_KEY", "fake-key")
    def test_handles_missing_fields_in_results(self, mock_get):
        mock_get.return_value.json.return_value = {
            "organic_results": [{"title": "Only Title"}]
        }

        from search import search_news

        results = search_news("partial")
        assert results[0]["title"] == "Only Title"
        assert results[0]["url"] == ""
        assert results[0]["summary"] == ""


# ── search_substack ──────────────────────────────────────────────────────────


class TestSearchSubstack:
    """Tests for the search_substack function."""

    @patch("search.requests.get")
    @patch("search.SERP_API_KEY", "fake-key")
    def test_returns_substack_articles(self, mock_get, serpapi_substack_results):
        mock_get.return_value.json.return_value = serpapi_substack_results

        from search import search_substack

        results = search_substack("analysis")

        # Should only include links with /p/ in the path
        assert all("/p/" in r["url"] for r in results)
        assert all(r.get("type") == "Substack" for r in results)

    @patch("search.requests.get")
    @patch("search.SERP_API_KEY", "fake-key")
    def test_filters_non_article_urls(self, mock_get, serpapi_substack_results):
        mock_get.return_value.json.return_value = serpapi_substack_results

        from search import search_substack

        results = search_substack("analysis")
        urls = [r["url"] for r in results]
        assert "https://author.substack.com/about" not in urls

    @patch("search.requests.get")
    @patch("search.SERP_API_KEY", "fake-key")
    def test_deduplicates_across_queries(self, mock_get):
        # Both query strategies return the same article
        same_results = {
            "organic_results": [
                {
                    "title": "Duplicate Post",
                    "link": "https://author.substack.com/p/duplicate",
                    "snippet": "Same article found twice.",
                }
            ]
        }
        mock_get.return_value.json.return_value = same_results

        from search import search_substack

        results = search_substack("topic", num_results=5)
        assert len(results) == 1  # deduped

    @patch("search.SERP_API_KEY", None)
    def test_returns_empty_when_no_api_key(self):
        from search import search_substack

        results = search_substack("topic")
        assert results == []

    @patch("search.requests.get")
    @patch("search.SERP_API_KEY", "fake-key")
    def test_caps_at_num_results(self, mock_get):
        many_results = {
            "organic_results": [
                {
                    "title": f"Post {i}",
                    "link": f"https://author.substack.com/p/post-{i}",
                    "snippet": f"Snippet {i}",
                }
                for i in range(10)
            ]
        }
        mock_get.return_value.json.return_value = many_results

        from search import search_substack

        results = search_substack("topic", num_results=3)
        assert len(results) <= 3

    @patch("search.requests.get", side_effect=Exception("timeout"))
    @patch("search.SERP_API_KEY", "fake-key")
    def test_handles_request_failure_gracefully(self, mock_get):
        from search import search_substack

        results = search_substack("topic")
        assert results == []


# ── is_likely_substack ───────────────────────────────────────────────────────


class TestIsLikelySubstack:
    """Tests for the is_likely_substack heuristic."""

    def test_detects_substack_dot_com(self):
        from search import is_likely_substack

        result = {"url": "https://author.substack.com/p/my-post", "summary": "", "title": ""}
        assert is_likely_substack(result) is True

    def test_detects_custom_domain_with_signal(self):
        from search import is_likely_substack

        result = {
            "url": "https://custom-domain.com/p/article-slug",
            "summary": "Posted on substack newsletter",
            "title": "Article Title",
        }
        assert is_likely_substack(result) is True

    def test_detects_restack_signal(self):
        from search import is_likely_substack

        result = {
            "url": "https://custom.com/p/article",
            "summary": "This post has restacks from other authors",
            "title": "",
        }
        assert is_likely_substack(result) is True

    def test_rejects_non_substack_url(self):
        from search import is_likely_substack

        result = {
            "url": "https://nytimes.com/2024/01/01/article",
            "summary": "Regular news article.",
            "title": "News",
        }
        assert is_likely_substack(result) is False

    def test_rejects_p_url_without_signal(self):
        from search import is_likely_substack

        result = {
            "url": "https://blog.example.com/p/random-post",
            "summary": "Nothing special here.",
            "title": "Blog Post",
        }
        assert is_likely_substack(result) is False

    def test_handles_missing_fields(self):
        from search import is_likely_substack

        result = {}
        assert is_likely_substack(result) is False

    def test_case_insensitive(self):
        from search import is_likely_substack

        result = {
            "url": "https://AUTHOR.SUBSTACK.COM/p/POST",
            "summary": "",
            "title": "",
        }
        assert is_likely_substack(result) is True
