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

# Updated Schema Context matching your new table definition
SCHEMA_CONTEXT = """
CREATE TABLE "products" (
  "product_id"        BIGSERIAL PRIMARY KEY,
  "product_name"      TEXT NOT NULL,
  "brand"             TEXT,
  "category"          TEXT NOT NULL,
  "sub_category"      TEXT,
  "description"       TEXT,
  "color"             TEXT,
  "size"              TEXT,
  "material"          TEXT,
  "gender"            TEXT,
  "mfr_cost"          NUMERIC(10,2),
  "shipping_charge"   NUMERIC(10,2),
  "price"             NUMERIC(10,2) NOT NULL,
  "country_of_origin" TEXT,
  "care_instructions" TEXT,
  "warranty_months"   INTEGER,
  "rating"            NUMERIC(3,1),
  "launch_year"       INTEGER
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
        You are a smart retail product database assistant. 
        Your task is to analyze the user request and generate a valid PostgreSQL SELECT query if the request is related to the product schema provided below.

        Schema:
        {SCHEMA_CONTEXT}

        Instructions:
        1. Analyze the user's input and the conversation summary.
        2. If the user asks for products (e.g., "Show me Nike shoes", "summer clothes for men under $50", "highly rated electronics"), generate a SQL SELECT query.
        3. Use ILIKE for text matching to be case-insensitive (e.g., "brand" ILIKE '%nike%').
        4. If the user's input is NOT related to products (e.g., "Write a poem", "What is the capital of France"), do NOT generate a query.
        5. Always generate a natural language response ("message") to accompany the result or to explain why you cannot help.

        Output Format:
        You must return a valid JSON object with exactly two keys:
        - "sql": (string | null) The SQL query if relevant, otherwise null.
        - "message": (string) A helpful message for the user. 
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Summary: {req.summary}\nPrompt: {req.prompt}"}
        ]

        # Pass image if available (for multimodal models like gpt-4o)
        if req.imageUrl:
            messages[1]["content"] = [
                {"type": "text", "text": f"Summary: {req.summary}\nPrompt: {req.prompt}"},
                {"type": "image_url", "image_url": {"url": req.imageUrl}}
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
            # Basic security check
            if not generated_sql.strip().lower().startswith("select"):
                return send(False, "Security Violation: Only SELECT queries are allowed.")

            conn = get_connection()
            cur = conn.cursor()
            
            # Execute the generated SQL
            cur.execute(generated_sql)
            rows = cur.fetchall()
            
            # Map results to dictionary
            columns = [desc[0] for desc in cur.description]
            results = [dict(zip(columns, row)) for row in rows]
            
            cur.close()
            conn.close()

        return send(True, "Success", {
            "botOutput": bot_message,
            "sql": generated_sql,
            "results": results,
            "action": "search_result" if generated_sql else "chat"
        })

    except Exception as e:
        print(f"AI Error: {str(e)}")
        return send(False, "AI Service Failed", str(e))