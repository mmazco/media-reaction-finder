import os
from dotenv import load_dotenv
from openai import OpenAI
import google.generativeai as genai

load_dotenv()

# Lazy initialization - don't create client at import time
_client = None

def get_openai_client():
    """Get or create OpenAI client (lazy initialization)"""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("⚠️  OPENAI_API_KEY not set - will try Gemini fallback")
            return None
        _client = OpenAI(api_key=api_key)
    return _client

def summarize_text(text, task="Summarize this content accurately and concisely."):
    """
    Summarize text using OpenAI, with Gemini fallback.
    
    IMPORTANT: The LLM is instructed to only use information explicitly present
    in the provided text - no hallucination of names, titles, or facts.
    """
    
    # Enhanced system prompt to prevent hallucination
    system_prompt = f"""{task}

CRITICAL RULES:
- ONLY use names, facts, and information that are EXPLICITLY stated in the text
- If the author's name appears in the text, use that exact name
- Do NOT invent or guess names, titles, affiliations, or any other facts
- If information is unclear, describe it generally rather than guessing
- Be accurate and factual - accuracy is more important than detail"""

    # Try OpenAI first
    try:
        client = get_openai_client()
        if client:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=0.3  # Lower temperature for more factual output
            )
            return response.choices[0].message.content
    except Exception as e:
        print(f"⚠️ OpenAI summarization failed: {e}")
        print("🔄 Falling back to Gemini...")
    
    # Fallback to Gemini
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            full_prompt = f"{system_prompt}\n\nText to summarize:\n{text}"
            response = model.generate_content(full_prompt)
            
            return response.text
        except Exception as e:
            print(f"❌ Gemini summarization failed: {e}")
            return ""
    
    return ""
