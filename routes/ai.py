import os
import json
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from openai import OpenAI
from utils.response import send
from lib.connection import get_connection
import psycopg2

router = APIRouter(prefix="/ai")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SCHEMA_CONTEXT = """
CREATE TABLE products (
    product_id        BIGSERIAL PRIMARY KEY,
    product_name      TEXT NOT NULL,
    brand             TEXT NOT NULL,
    category          TEXT NOT NULL,
    sub_category      TEXT,
    price             NUMERIC(10,2) NOT NULL,
    rating            NUMERIC(3,1) DEFAULT 0.0,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales (
    salesId SERIAL PRIMARY KEY,
    sale_date DATE,
    product_id VARCHAR(50),
    category VARCHAR(100),
    sales INTEGER,
    mfr_cost NUMERIC(12,2),
    price NUMERIC(12,2)
);
"""

class AIRequest(BaseModel):
    userId: int
    prompt: str
    summary: Optional[str] = ""
    chatId: Optional[str] = None
    imageUrl: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = [] 

def generate_ai_response(messages):
    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0
    )
    return json.loads(completion.choices[0].message.content)

@router.post("/chat")
def ai_chat(req: AIRequest):
    try:
        system_prompt = f"""
        You are a dual-purpose AI assistant: 
        1. A Data Analyst capable of querying the database.
        2. A Helpful Conversationalist capable of remembering context.

        Database Schema:
        {SCHEMA_CONTEXT}

        DECISION LOGIC:
        1. Analyze the User's Prompt and Chat History.
        2. IF the user asks for data, statistics, sales figures, or inventory:
           - Generate a valid PostgreSQL 'SELECT' query.
           - Create a 'chartConfig' if visualization is useful.
        3. IF the user asks a general question, greets you, or asks about previous context (e.g., "What is my name?", "Hello"):
           - Set "sql" to null.
           - Set "chartConfig" to null.
           - Answer the user naturally in the "message" field based on the history provided.

        Response Format (JSON):
        {{
            "sql": "SELECT ... " OR null,
            "message": "The explanation or natural language answer",
            "chartConfig": {{
                "type": "bar" | "line" | "pie" | "area",
                "xAxisKey": "column_name",
                "series": [ {{ "dataKey": "column_name", "name": "Label", "color": "#8884d8" }} ],
                "title": "Chart Title"
            }} OR null
        }}

        Rules:
        - Use JOIN products ON products.product_id = CAST(sales.product_id AS INT) when needed.
        - For time-series, cast dates appropriately.
        - NEVER generate SQL for personal questions like "Who am I?".
        """

        messages = [{"role": "system", "content": system_prompt}]
        
        if req.history:
            messages.extend(req.history[-10:]) 

        user_content = f"Summary: {req.summary}\nPrompt: {req.prompt}"
        
        if req.imageUrl:
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": user_content},
                    {"type": "image_url", "image_url": {"url": req.imageUrl}}
                ]
            })
        else:
            messages.append({"role": "user", "content": user_content})

        attempts = 0
        max_retries = 2
        
        while attempts <= max_retries:
            ai_response = generate_ai_response(messages)
            generated_sql = ai_response.get("sql")
            bot_message = ai_response.get("message")
            chart_config = ai_response.get("chartConfig")
            results = []

            if not generated_sql:
                return send(True, "Success", {
                    "botOutput": bot_message,
                    "sql": None,
                    "results": [],
                    "chartConfig": None,
                    "action": "chat"
                })

            if not generated_sql.strip().lower().startswith("select"):
                return send(False, "Security violation: only SELECT allowed.")

            try:
                conn = get_connection()
                cur = conn.cursor()
                cur.execute(generated_sql)
                rows = cur.fetchall()
                cols = [d[0] for d in cur.description]
                results = [dict(zip(cols, r)) for r in rows]
                cur.close()
                conn.close()

                return send(True, "Success", {
                    "botOutput": bot_message,
                    "sql": generated_sql,
                    "results": results,
                    "chartConfig": chart_config,
                    "action": "search_result"
                })

            except Exception as db_err:
                attempts += 1
                error_msg = str(db_err)
                print(f"SQL Execution Failed (Attempt {attempts}): {error_msg}")
                
                if attempts > max_retries:
                    return send(False, "Auto-healing failed after retries.", error_msg)
                
                messages.append({"role": "assistant", "content": json.dumps(ai_response)})
                messages.append({
                    "role": "user", 
                    "content": f"The SQL you generated failed with this error: {error_msg}. Please correct the SQL and regenerate the JSON response."
                })

    except Exception as e:
        print("AI System Error:", str(e))
        return send(False, "AI Failed", str(e))