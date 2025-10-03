import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

def summarize_text(text, task="Summarize this content and classify its sentiment."):
    try:
        # Check if API key is available
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("❌ ERROR: OPENAI_API_KEY not found in environment variables")
            return "Summary unavailable - OpenAI API key not configured"
        
        # Check if text is empty
        if not text or len(text.strip()) < 50:
            print(f"⚠️ WARNING: Text too short for summarization ({len(text) if text else 0} chars)")
            return "Summary unavailable - insufficient content to summarize"
        
        print(f"🤖 Calling OpenAI API to summarize {len(text)} characters...")
        print(f"   Task: {task[:80]}...")
        
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": task},
                {"role": "user", "content": text}
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        summary = response.choices[0].message.content
        print(f"✅ Summary generated successfully ({len(summary)} chars)")
        return summary
        
    except Exception as e:
        print(f"❌ ERROR in summarization: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return f"Summary unavailable - Error: {str(e)}"