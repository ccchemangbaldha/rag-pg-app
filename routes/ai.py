import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI
from utils.response import send

router = APIRouter(prefix="/ai")

# Initialize OpenAI Client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- Pydantic Model ---
class AIRequest(BaseModel):
    userId: int
    prompt: str
    summary: Optional[str] = ""

@router.post("/chat")
def ai_chat(req: AIRequest):
    try:
        messages = []

        # Optional: include previous summary if exists
        if req.summary:
            messages.append({
                "role": "system",
                "content": f"Conversation so far: {req.summary}"
            })

        messages.append({
            "role": "user",
            "content": req.prompt
        })

        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7
        )

        ai_reply = completion.choices[0].message.content

        if not ai_reply:
            return send(False, "AI returned empty response")

        return send(True, "Success", {
            "botOutput": ai_reply
        })

    except Exception as e:
        return send(False, "AI Service Failed", str(e))