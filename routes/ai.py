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

# Enriched Schema Context based on your data
SCHEMA_CONTEXT = """
CREATE TABLE products (
    product_id        BIGSERIAL PRIMARY KEY,
    product_name      TEXT NOT NULL, -- Example: "Asics Running Shoes - Grey (Size 6)"
    brand             TEXT NOT NULL, -- Example: "Asics", "Nike", "Woodland"
    category          TEXT NOT NULL, -- Example: "Footwear"
    sub_category      TEXT,          -- Example: "Running Shoes", "Formal Shoes", "Sneakers"
    price             NUMERIC(10,2) NOT NULL,
    rating            NUMERIC(3,1) DEFAULT 0.0,
    gender            TEXT,          -- Example: "Men", "Women", "Unisex"
    color             TEXT,          -- Example: "Red", "Blue", "Black"
    size              TEXT,          -- Example: "6", "8", "11"
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales (
    salesId SERIAL PRIMARY KEY,
    sale_date DATE,                  -- Format: YYYY-MM-DD
    product_id VARCHAR(50),          -- Foreign Key (needs CAST to INT for joins)
    category VARCHAR(100),
    sales INTEGER,                   -- QUANTITY SOLD (e.g., 13, 32). Total Revenue = sales * price
    inventory INTEGER,               -- Current stock level
    ad_cost NUMERIC(12,2),           -- Marketing spend
    clicks INTEGER,                  -- Ad clicks
    impressions INTEGER,             -- Ad views
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
        1. A Data Analyst capable of querying the PostgreSQL database.
        2. A Helpful Conversationalist capable of remembering context.

        Database Schema:
        {SCHEMA_CONTEXT}

        COLUMN USAGE GUIDELINES:
        - To calculate REVENUE: Use SUM(sales.sales * sales.price).
        - To count ITEMS SOLD: Use SUM(sales.sales).
        - To check STOCK: Use SUM(sales.inventory).
        - To analyze MARKETING: Use ad_cost, clicks, or impressions.
        - 'sales.product_id' is VARCHAR, so use CAST(sales.product_id AS INT) to join with 'products.product_id'.

        FEW-SHOT EXAMPLES (Follow these patterns):
        
        Example 1 (Data Query):
        User: "Which brand has the highest revenue?"
        Response: {{
            "sql": "SELECT brand, SUM(sales * price) as revenue FROM sales GROUP BY brand ORDER BY revenue DESC LIMIT 5",
            "message": "Here are the top 5 brands by total revenue.",
            "chartConfig": {{ "type": "bar", "title": "Top Brands by Revenue", "xAxisKey": "brand", "series": [{{"dataKey": "revenue", "name": "Revenue"}}] }}
        }}

        Example 2 (Inventory Query):
        User: "Show me inventory for Nike shoes."
        Response: {{
            "sql": "SELECT product_name, inventory FROM sales JOIN products ON products.product_id = CAST(sales.product_id AS INT) WHERE products.brand = 'Nike' ORDER BY inventory DESC LIMIT 10",
            "message": "Here is the inventory status for Nike products.",
            "chartConfig": {{ "type": "bar", "title": "Nike Inventory", "xAxisKey": "product_name", "series": [{{"dataKey": "inventory", "name": "Stock"}}] }}
        }}

        Example 3 (Conversational/Personal):
        User: "What is my name?" or "Hello" or "Who are you?"
        Response: {{
            "sql": null,
            "message": "I am your AI assistant. I don't know your name unless you tell me, but I can help you analyze your sales data.",
            "chartConfig": null
        }}

        DECISION LOGIC:
        1. Analyze the User's Prompt and Chat History.
        2. IF the user asks for data, statistics, sales figures, inventory, or trends:
           - Generate a valid PostgreSQL 'SELECT' query.
           - Create a 'chartConfig' only if they ask or visualization is useful.
        3. IF the user asks a general question, greets you, or asks about previous context:
           - Set "sql" to null.
           - Set "chartConfig" to null.
           - Answer the user naturally in the "message" field.

        Response Format (JSON):
        {{
            "sql": "SELECT ... " OR null,
            "message": "The explanation or natural language answer",
            "chartConfig": {{ ... }} OR null
        }}
        """

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history if available
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

            # --- CASE 1: Conversation Mode (No SQL Generated) ---
            if not generated_sql:
                return send(True, "Success", {
                    "botOutput": bot_message,
                    "sql": None,
                    "results": [],
                    "chartConfig": None,
                    "action": "chat"
                })

            # --- CASE 2: Data Analyst Mode (SQL Generated) ---
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
                
                # Add the failed attempt and error to history for the model to self-correct
                messages.append({"role": "assistant", "content": json.dumps(ai_response)})
                messages.append({
                    "role": "user", 
                    "content": f"The SQL you generated failed with this error: {error_msg}. Please correct the SQL and regenerate the JSON response."
                })

    except Exception as e:
        print("AI System Error:", str(e))
        return send(False, "AI Failed", str(e))