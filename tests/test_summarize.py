"""Unit tests for summarize.py — get_openai_client, summarize_text."""

from unittest.mock import patch, MagicMock
import pytest


# ── get_openai_client ────────────────────────────────────────────────────────


class TestGetOpenaiClient:
    """Tests for lazy OpenAI client initialization."""

    def setup_method(self):
        # Reset the cached client between tests
        import summarize
        summarize._client = None

    @patch("summarize.os.getenv", return_value="sk-test-key")
    @patch("summarize.OpenAI")
    def test_creates_client_when_key_present(self, mock_openai_cls, mock_getenv):
        from summarize import get_openai_client

        client = get_openai_client()
        mock_openai_cls.assert_called_once_with(api_key="sk-test-key")
        assert client is not None

    @patch("summarize.os.getenv", return_value=None)
    def test_returns_none_when_key_missing(self, mock_getenv):
        from summarize import get_openai_client

        client = get_openai_client()
        assert client is None

    @patch("summarize.os.getenv", return_value="sk-test-key")
    @patch("summarize.OpenAI")
    def test_caches_client_on_subsequent_calls(self, mock_openai_cls, mock_getenv):
        from summarize import get_openai_client

        client1 = get_openai_client()
        client2 = get_openai_client()
        # Only constructed once
        mock_openai_cls.assert_called_once()
        assert client1 is client2


# ── summarize_text ───────────────────────────────────────────────────────────


class TestSummarizeText:
    """Tests for summarize_text with OpenAI primary + Gemini fallback."""

    def setup_method(self):
        import summarize
        summarize._client = None

    @patch("summarize.get_openai_client")
    def test_returns_openai_summary(self, mock_get_client, fake_openai_response):
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_openai_response
        mock_get_client.return_value = mock_client

        from summarize import summarize_text

        result = summarize_text("Some long article text here.")
        assert result == "This is a concise summary."

    @patch("summarize.get_openai_client")
    def test_passes_custom_task_to_openai(self, mock_get_client, fake_openai_response):
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_openai_response
        mock_get_client.return_value = mock_client

        from summarize import summarize_text

        summarize_text("text", task="Analyze the sentiment.")
        call_kwargs = mock_client.chat.completions.create.call_args[1]
        system_msg = call_kwargs["messages"][0]["content"]
        assert "Analyze the sentiment." in system_msg

    @patch("summarize.os.getenv", return_value="gemini-key")
    @patch("summarize.genai")
    @patch("summarize.get_openai_client")
    def test_falls_back_to_gemini_on_openai_failure(
        self, mock_get_client, mock_genai, mock_getenv, fake_gemini_response
    ):
        # OpenAI raises
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("rate limit")
        mock_get_client.return_value = mock_client

        # Gemini succeeds
        mock_model = MagicMock()
        mock_model.generate_content.return_value = fake_gemini_response
        mock_genai.GenerativeModel.return_value = mock_model

        from summarize import summarize_text

        result = summarize_text("Some text")
        assert result == "Gemini fallback summary."

    @patch("summarize.get_openai_client", return_value=None)
    @patch("summarize.os.getenv", return_value="gemini-key")
    @patch("summarize.genai")
    def test_uses_gemini_when_openai_client_is_none(
        self, mock_genai, mock_getenv, mock_get_client, fake_gemini_response
    ):
        mock_model = MagicMock()
        mock_model.generate_content.return_value = fake_gemini_response
        mock_genai.GenerativeModel.return_value = mock_model

        from summarize import summarize_text

        result = summarize_text("text")
        assert result == "Gemini fallback summary."

    @patch("summarize.os.getenv", return_value=None)
    @patch("summarize.get_openai_client")
    def test_returns_empty_when_both_fail(self, mock_get_client, mock_getenv):
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("openai down")
        mock_get_client.return_value = mock_client

        from summarize import summarize_text

        result = summarize_text("text")
        assert result == ""

    @patch("summarize.get_openai_client")
    def test_uses_gpt4_model(self, mock_get_client, fake_openai_response):
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_openai_response
        mock_get_client.return_value = mock_client

        from summarize import summarize_text

        summarize_text("text")
        call_kwargs = mock_client.chat.completions.create.call_args[1]
        assert call_kwargs["model"] == "gpt-4"

    @patch("summarize.get_openai_client")
    def test_uses_low_temperature(self, mock_get_client, fake_openai_response):
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_openai_response
        mock_get_client.return_value = mock_client

        from summarize import summarize_text

        summarize_text("text")
        call_kwargs = mock_client.chat.completions.create.call_args[1]
        assert call_kwargs["temperature"] == 0.3

    @patch("summarize.get_openai_client")
    def test_includes_anti_hallucination_prompt(self, mock_get_client, fake_openai_response):
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_openai_response
        mock_get_client.return_value = mock_client

        from summarize import summarize_text

        summarize_text("text")
        call_kwargs = mock_client.chat.completions.create.call_args[1]
        system_msg = call_kwargs["messages"][0]["content"]
        assert "CRITICAL RULES" in system_msg
        assert "ONLY use names" in system_msg
