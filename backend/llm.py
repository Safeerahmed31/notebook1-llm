import os
import json
import re
from groq import Groq

_client = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        key = os.getenv('GROQ_API_KEY', '')
        if not key:
            raise RuntimeError("GROQ_API_KEY is not set in environment")
        _client = Groq(api_key=key)
    return _client


TEXT_MODEL   = os.getenv('LLM_MODEL', 'llama-3.3-70b-versatile')
VISION_MODEL = os.getenv('VISION_MODEL', 'meta-llama/llama-4-scout-17b-16e-instruct')
MAX_TEXT     = 8000


# ─────────────────────────────────────────────
# 🔹 Common safe call
# ─────────────────────────────────────────────
def _safe_call(messages, max_tokens=1000, temperature=0.5):
    try:
        client = _get_client()
        res = client.chat.completions.create(
            model=TEXT_MODEL,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        return f"Error: {str(e)}"


# ─────────────────────────────────────────────
# 🔹 Vision
# ─────────────────────────────────────────────
def vision_extract(image_b64: str, mime_type: str) -> str:
    try:
        client = _get_client()
        res = client.chat.completions.create(
            model=VISION_MODEL,
            max_tokens=2048,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{image_b64}"}
                    },
                    {
                        "type": "text",
                        "text": "Extract all text or describe the image clearly."
                    }
                ]
            }]
        )
        return res.choices[0].message.content
    except Exception as e:
        return f"Vision error: {str(e)}"


# ─────────────────────────────────────────────
# 🔹 Summary
# ─────────────────────────────────────────────
def summarize(text: str) -> str:
    return _safe_call([{
        "role": "user",
        "content": f"""
Summarize this document:

1. One-line overview
2. Key points (bullets)
3. Conclusion

TEXT:
{text[:MAX_TEXT]}
"""
    }], max_tokens=1000, temperature=0.4)


# ─────────────────────────────────────────────
# 🔹 Quiz
# ─────────────────────────────────────────────
def generate_quiz(text: str, num_questions: int = 5) -> list:
    raw = _safe_call([{
        "role": "user",
        "content": f"""
Generate {num_questions} MCQs.

Return ONLY JSON:
[
  {{
    "question": "...",
    "options": ["A...", "B...", "C...", "D..."],
    "answer": "A",
    "explanation": "..."
  }}
]

TEXT:
{text[:MAX_TEXT]}
"""
    }], max_tokens=2500)

    try:
        raw = re.sub(r'^```.*?\n', '', raw)
        raw = re.sub(r'```$', '', raw)
        return json.loads(raw)
    except:
        return [{"question": "Error parsing quiz", "options": [], "answer": "", "explanation": raw}]


# ─────────────────────────────────────────────
# 🔹 Chatbot
# ─────────────────────────────────────────────
def ask_question(context: str, question: str) -> str:
    return _safe_call([{
        "role": "user",
        "content": f"""
You are a smart study assistant.

Answer ONLY from the document.
If not found → say: "Not found in document"

Also:
- Keep answer simple
- Use bullet points if needed
- Be student-friendly

DOCUMENT:
{context[:MAX_TEXT]}

QUESTION:
{question}
"""
    }], max_tokens=500, temperature=0.3)


# ─────────────────────────────────────────────
# 🔹 Expected Questions
# ─────────────────────────────────────────────
def generate_expected_questions(text: str) -> str:
    return _safe_call([{
        "role": "user",
        "content": f"""
Generate exam questions:

1. Short answer
2. Long answer
3. Concept-based

Make it useful for students.

TEXT:
{text[:MAX_TEXT]}
"""
    }], max_tokens=1200, temperature=0.6)