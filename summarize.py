import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Lazy initialization - don't create client at import time
_client = None

def get_openai_client():
    """Get or create OpenAI client (lazy initialization)"""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("⚠️  OPENAI_API_KEY not set - summarization will be disabled")
            return None
        _client = OpenAI(api_key=api_key)
    return _client

def summarize_text(text, task="Summarize this content and classify its sentiment."):
    try:
        client = get_openai_client()
        if client is None:
            return "Summarization unavailable - API key not configured"
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": task},
                {"role": "user", "content": text}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error in summarization: {e}")
        return "Unable to summarize content"