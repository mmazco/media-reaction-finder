import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def summarize_text(text, task="Summarize this content and classify its sentiment."):
    try:
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