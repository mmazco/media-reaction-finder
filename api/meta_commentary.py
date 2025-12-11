"""
Meta Commentary Module
Generates AI-powered meta-analysis of article discourse and converts to audio using Gemini TTS.
"""

import os
import base64
from dotenv import load_dotenv
from openai import OpenAI
import google.generativeai as genai

load_dotenv()


def generate_meta_commentary(article, web_results, reddit_results):
    """
    Use GPT-4 to synthesize article content + reactions into a meta-analysis.
    
    Args:
        article: dict with title, source, summary, content
        web_results: list of web search results
        reddit_results: list of reddit discussions
    
    Returns:
        str: ~200 word meta-commentary suitable for 60-90 second audio
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return "Commentary unavailable - OpenAI API key not configured"
        
        # Build context from article
        article_context = ""
        if article:
            article_context = f"""
ARTICLE:
Title: {article.get('title', 'Unknown')}
Source: {article.get('source', 'Unknown')}
Summary: {article.get('summary', 'No summary available')}
"""
        
        # Build context from web reactions
        web_context = ""
        if web_results and len(web_results) > 0:
            web_snippets = []
            for r in web_results[:5]:  # Top 5 web results
                web_snippets.append(f"- {r.get('title', '')}: {r.get('summary', '')[:150]}")
            web_context = f"""
WEB REACTIONS:
{chr(10).join(web_snippets)}
"""
        
        # Build context from Reddit discussions
        reddit_context = ""
        if reddit_results and len(reddit_results) > 0:
            reddit_snippets = []
            for r in reddit_results[:5]:  # Top 5 reddit results
                match_info = f"[{r.get('match_type', 'topic')}]" if r.get('match_type') else ""
                reddit_snippets.append(f"- {match_info} r/{r.get('subreddit', 'unknown')}: {r.get('title', '')}")
            reddit_context = f"""
REDDIT DISCUSSIONS:
{chr(10).join(reddit_snippets)}
"""
        
        # Construct the prompt
        prompt = f"""You are a media analyst providing a concise audio commentary on an article and its online reception.

{article_context}
{web_context}
{reddit_context}

Generate a 150-200 word meta-commentary that:
1. Briefly introduces what the article is about (1-2 sentences)
2. Synthesizes how people are reacting online - what themes emerge from the discussions?
3. Identifies any notable tensions, agreements, or surprising takes
4. Concludes with the broader implications or what this discourse reveals

Write in a conversational, podcast-style tone suitable for audio. Use natural spoken language.
Do NOT use bullet points, headers, or markdown formatting.
Do NOT start with "This article..." - be more engaging.

The commentary should feel like a brief but insightful audio briefing someone would listen to."""

        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a thoughtful media analyst who synthesizes article content and online discourse into engaging audio commentaries."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=400,
            temperature=0.7
        )
        
        commentary = response.choices[0].message.content
        print(f"✅ Meta commentary generated: {len(commentary)} chars")
        return commentary
        
    except Exception as e:
        print(f"❌ Error generating meta commentary: {e}")
        return f"Commentary generation failed: {str(e)}"


def text_to_speech_openai(text):
    """
    Convert text to speech using OpenAI TTS.
    
    Args:
        text: The commentary text to convert to audio
    
    Returns:
        dict with 'audio' (base64 encoded) and 'mime_type', or None on failure
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("❌ OPENAI_API_KEY not found for TTS")
            return None
        
        client = OpenAI(api_key=api_key)
        
        print(f"🎙️ Generating audio with OpenAI TTS ({len(text)} chars)...")
        
        # Use OpenAI TTS - tts-1 is faster, tts-1-hd is higher quality
        response = client.audio.speech.create(
            model="tts-1",
            voice="nova",  # Options: alloy, echo, fable, onyx, nova, shimmer
            input=text,
            response_format="mp3"
        )
        
        # Get audio bytes
        audio_data = response.content
        
        # Encode to base64
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        print(f"✅ Audio generated: {len(audio_data)} bytes")
        
        return {
            'audio': audio_base64,
            'mime_type': 'audio/mp3'
        }
        
    except Exception as e:
        print(f"❌ Error in OpenAI TTS: {e}")
        import traceback
        traceback.print_exc()
        return None


def text_to_speech_gemini(text):
    """
    Convert text to speech using Gemini TTS (experimental).
    Falls back to OpenAI TTS if Gemini fails.
    
    Args:
        text: The commentary text to convert to audio
    
    Returns:
        dict with 'audio' (base64 encoded) and 'mime_type', or None on failure
    """
    # Try Gemini first if API key is available
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            
            # Try the TTS model
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            print(f"🎙️ Attempting Gemini TTS ({len(text)} chars)...")
            
            # Generate speech using Gemini's audio output capability
            response = model.generate_content(
                f"Read the following text aloud in a natural, engaging podcast style: {text}",
                generation_config=genai.GenerationConfig(
                    response_modalities=["AUDIO"],
                )
            )
            
            # Extract audio data if available
            if response.candidates and len(response.candidates) > 0:
                candidate = response.candidates[0]
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            audio_data = part.inline_data.data
                            mime_type = part.inline_data.mime_type or "audio/mp3"
                            
                            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                            print(f"✅ Gemini audio generated: {len(audio_data)} bytes")
                            
                            return {
                                'audio': audio_base64,
                                'mime_type': mime_type
                            }
            
            print("⚠️ Gemini TTS didn't return audio, falling back to OpenAI")
            
        except Exception as e:
            print(f"⚠️ Gemini TTS failed: {e}, falling back to OpenAI TTS")
    
    # Fall back to OpenAI TTS
    return text_to_speech_openai(text)


def generate_audio_commentary(article, web_results, reddit_results):
    """
    Full pipeline: generate meta-commentary text and convert to audio.
    
    Args:
        article: dict with article metadata
        web_results: list of web search results
        reddit_results: list of reddit discussions
    
    Returns:
        dict with 'text', 'audio' (base64), 'mime_type'
    """
    # Step 1: Generate the text commentary
    commentary_text = generate_meta_commentary(article, web_results, reddit_results)
    
    if commentary_text.startswith("Commentary unavailable") or commentary_text.startswith("Commentary generation failed"):
        return {
            'text': commentary_text,
            'audio': None,
            'error': True
        }
    
    # Step 2: Convert to audio
    audio_result = text_to_speech_gemini(commentary_text)
    
    if audio_result:
        return {
            'text': commentary_text,
            'audio': audio_result['audio'],
            'mime_type': audio_result['mime_type'],
            'error': False
        }
    else:
        return {
            'text': commentary_text,
            'audio': None,
            'error': True,
            'error_message': 'Audio generation failed - text commentary still available'
        }

