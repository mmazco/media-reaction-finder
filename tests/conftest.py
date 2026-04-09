"""Shared fixtures for media-reaction-finder tests."""

import pytest


# ---------------------------------------------------------------------------
# SerpAPI fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def serpapi_organic_results():
    """Typical organic_results payload from SerpAPI."""
    return {
        "organic_results": [
            {
                "title": "Breaking: Major Event",
                "link": "https://example.com/article-1",
                "snippet": "A short summary of article 1.",
            },
            {
                "title": "Analysis of the Event",
                "link": "https://example.com/article-2",
                "snippet": "A short summary of article 2.",
            },
        ]
    }


@pytest.fixture
def serpapi_substack_results():
    """SerpAPI results containing Substack article links."""
    return {
        "organic_results": [
            {
                "title": "Deep Dive on Substack",
                "link": "https://author.substack.com/p/deep-dive",
                "snippet": "Substack analysis piece.",
            },
            {
                "title": "Newsletter Update",
                "link": "https://author.substack.com/p/newsletter-update",
                "snippet": "Weekly newsletter on substack.",
            },
            {
                "title": "Non-article page",
                "link": "https://author.substack.com/about",
                "snippet": "About the author.",
            },
        ]
    }


# ---------------------------------------------------------------------------
# OpenAI / Gemini fixtures
# ---------------------------------------------------------------------------

class FakeChoice:
    """Mimics openai ChatCompletion choice."""

    def __init__(self, content: str):
        self.message = type("msg", (), {"content": content})()


class FakeCompletion:
    """Mimics openai ChatCompletion response."""

    def __init__(self, content: str):
        self.choices = [FakeChoice(content)]


@pytest.fixture
def fake_openai_response():
    return FakeCompletion("This is a concise summary.")


class FakeGeminiResponse:
    """Mimics google.generativeai GenerateContentResponse."""

    def __init__(self, text: str):
        self.text = text


@pytest.fixture
def fake_gemini_response():
    return FakeGeminiResponse("Gemini fallback summary.")
