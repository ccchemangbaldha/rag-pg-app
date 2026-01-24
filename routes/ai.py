import os
import json
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from openai import OpenAI
from utils.response import send
from lib.connection import get_connection

router = APIRouter(prefix="/ai")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SCHEMA_CONTEXT = """
CREATE TABLE "products" (
  "productId"   BIGSERIAL PRIMARY KEY,
  "productName" TEXT NOT NULL,
  "category"    TEXT NOT NULL,
  "style"       TEXT,
  "color"       TEXT,
  "material"    TEXT,
  "price"       NUMERIC(10,2) NOT NULL,
  "widthCm"     NUMERIC(6,2),
  "depthCm"     NUMERIC(6,2),
  "heightCm"    NUMERIC(6,2),
  "stock"       INTEGER DEFAULT 0,
  "imageUrl"    TEXT,
  "createdAt"   TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ DEFAULT NOW()
);
"""

class AIRequest(BaseModel):
    userId: int
    prompt: str
    summary: Optional[str] = ""
    chatId: Optional[str] = None
    imageUrl: Optional[str] = None

@router.post("/chat")
def ai_chat(req: AIRequest):
    try:
        system_prompt = f"""
        You are a smart furniture database assistant. 
        Your task is to analyze the user request and generate a valid PostgreSQL SELECT query if the request is related to the product schema provided below.

        Schema:
        {SCHEMA_CONTEXT}

        Instructions:
        1. Analyze the user's input and the conversation summary.
        2. If the user asks for products (e.g., "Show me red chairs", "furniture for small room"), generate a SQL SELECT query.
        3. If the user's input is NOT related to furniture or products (e.g., "Write a poem", "What is the capital of France"), do NOT generate a query.
        4. Always generate a natural language response ("message") to accompany the result or to explain why you cannot help.

        Output Format:
        You must return a valid JSON object with exactly two keys:
        - "sql": (string | null) The SQL query if relevant, otherwise null.
        - "message": (string) A helpful message for the user. 
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Summary: {req.summary}\nPrompt: {req.prompt}"}
        ]

        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0
        )

        response_content = completion.choices[0].message.content
        ai_response = json.loads(response_content)

        generated_sql = ai_response.get("sql")
        bot_message = ai_response.get("message")
        results = []

        if generated_sql:
            if not generated_sql.lower().strip().startswith("select"):
                return send(False, "Security Violation: Only SELECT queries are allowed.")

            conn = get_connection()
            cur = conn.cursor()
            cur.execute(generated_sql)
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]
            results = [dict(zip(columns, row)) for row in rows]
            cur.close()
            conn.close()

        return send(True, "Success", {
            "botOutput": bot_message,
            "sql": generated_sql,
            "results": results
        })

    except Exception as e:
        return send(False, "AI Service Failed", str(e))