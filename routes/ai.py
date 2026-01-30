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

# --- OPTIMIZED PROMPT (approx. 800-900 tokens) ---
SCHEMA_CONTEXT = """
ROLE:
You are an expert PostgreSQL Data Analyst for a Footwear Retailer.
Your goal is to generate precise, executable, and read-only SQL queries based on the user's intent.

DATABASE SCHEMA:
1. products (
    product_id        INT PRIMARY KEY,
    product_name      TEXT,
    brand             TEXT,
    category          TEXT, -- e.g., 'Footwear' only 1 category available.
    sub_category      TEXT, -- e.g., 'Running Shoes', 'Formal Shoes', 'Sandals',  "Sneakers", "Sandals", "Casual Shoes", "Sports Shoes"
    description       TEXT,
    color             TEXT,
    size              TEXT, --- 6 to 11 only
    material          TEXT, -- e.g., 'Leather', 'Mesh', 'Synthetic'
    gender            TEXT, -- 'Men', 'Women', 'Unisex'
    mfr_cost          NUMERIC(10,2),
    shipping_charge   NUMERIC(10,2),
    price             NUMERIC,
    care_instructions TEXT,
    warranty_months   INT,
    rating            NUMERIC, -- 1.0 to 5.0,
    launch_year       INTEGER,
    created_at        TIMESTAMP WITH TIMEZONE,
    updated_at        TIMESTAMP WITH TIMEZONE,
)
2. sales (
    salesId           INT PRIMARY KEY,
    sale_date         DATE, -- Transaction date yyyy-MM-dd
    product_id        INT, -- FK to products.product_id
    collection_type   VARCHAR(100), -- 'Regular','New Arrival','Seasonal','Clearance'
    sales             INTEGER, -- Quantity sold
    inventory         INTEGER, -- Current stock level
    ad_cost           NUMERIC, -- Marketing spend
    clicks            INTEGER,
    impressions       INTEGER, -- Impressions
    mfr_cost          NUMERIC, -- Manufacturing cost
    price             NUMERIC,  -- Sale price at transaction time
    avg_cpc           NUMERIC(12,2)
)

RELATIONSHIPS:
- JOIN products p ON p.product_id = sales.product_id

METRIC DEFINITIONS:
- Revenue       = SUM(sales.sales * sales.price)
- Profit        = SUM((sales.price - sales.mfrcost) * sales.sales)
- Total Sales   = SUM(sales.sales) (Quantity)
- Conversion Rt = SUM(sales.sales)::NUMERIC / NULLIF(SUM(sales.clicks), 0) * 100

RULES & CONSTRAINTS:
1. Output purely valid JSON. No markdown, no preambles.
2. ONLY generate SELECT queries. No UPDATE/DELETE/INSERT.
3. Use ILIKE for string matching (case-insensitive).
4. If the user asks for charts, strictly use the "chartConfig" format provided below.
5. For Time Series: Always ORDER BY the date column.
6. **MULTI-STEP REASONING:** If the user asks multiple distinct questions (e.g., "Top 10 products AND products starting with A"), you MUST return multiple steps in the `steps` array.

OUTPUT FORMAT:
{
  "steps": [
    {
      "sql": "SELECT ...",
      "message": "Explanation for this specific part...",
      "chartConfig": { ... or null }
    },
    ...
  ]
}

FEW-SHOT EXAMPLES:

User: "Show me monthly revenue trends."
Response:
{
  "steps": [
    {
      "sql": "SELECT DATE_TRUNC('month', date) AS month, SUM(sales * price) AS revenue FROM sales GROUP BY month ORDER BY month",
      "message": "Here is the monthly revenue trend based on your sales data.",
      "chartConfig": { "type": "line", "xAxisKey": "month", "series": [{"dataKey": "revenue", "name": "Revenue"}] }
    }
  ]
}

User: "Top 5 most expensive shoes and also show me the cheapest 3 items."
Response:
{
  "steps": [
    {
      "sql": "SELECT product_name, price FROM products ORDER BY price DESC LIMIT 5",
      "message": "Here are the top 5 most expensive shoes.",
      "chartConfig": null
    },
    {
      "sql": "SELECT product_name, price FROM products ORDER BY price ASC LIMIT 3",
      "message": "Here are the 3 cheapest items found.",
      "chartConfig": null
    }
  ]
}
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
        temperature=0.3
    )
    content = json.loads(completion.choices[0].message.content)
    
    usage = {
        "prompt_tokens": completion.usage.prompt_tokens,
        "completion_tokens": completion.usage.completion_tokens,
        "total_tokens": completion.usage.total_tokens
    }
    
    return content, usage

@router.post("/chat")
def ai_chat(req: AIRequest):
    try:
        system_prompt = f"""
        {SCHEMA_CONTEXT}
        Using the schema above, process the following request:
        """

        messages = [{"role": "system", "content": system_prompt}]

        if req.history:
            messages.extend(req.history[-6:])

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
            ai_response, usage_stats = generate_ai_response(messages)
            
            # Handle both legacy format (flat object) and new format (steps array)
            steps = ai_response.get("steps")
            if not steps:
                # Fallback if model outputs legacy flat structure
                steps = [ai_response]

            processed_sections = []
            all_sqls = []
            
            conn = None
            try:
                conn = get_connection()
                cur = conn.cursor()

                for step in steps:
                    generated_sql = step.get("sql")
                    bot_message = step.get("message")
                    chart_config = step.get("chartConfig")

                    section_result = {
                        "botOutput": bot_message,
                        "sql": generated_sql,
                        "results": [],
                        "chartConfig": chart_config,
                        "error": None
                    }

                    if generated_sql:
                        if not generated_sql.strip().lower().startswith("select"):
                            section_result["error"] = "Security violation: Only SELECT queries allowed."
                        else:
                            try:
                                cur.execute(generated_sql)
                                rows = cur.fetchall()
                                cols = [d[0] for d in cur.description]
                                results = [dict(zip(cols, r)) for r in rows]
                                section_result["results"] = results
                                all_sqls.append(generated_sql)
                            except Exception as sql_err:
                                # If one query fails, we mark it as failed but continue others if possible, 
                                # OR we trigger the retry mechanism for the whole batch.
                                # For simplicity in this robust version, we throw to trigger the retry logic.
                                raise sql_err
                    
                    processed_sections.append(section_result)

                cur.close()
                conn.close()

                return send(True, "Success", {
                    "sections": processed_sections,
                    "action": "chat",
                    "usage": usage_stats
                })

            except Exception as db_err:
                if conn:
                    conn.close()
                
                attempts += 1
                err = str(db_err)
                print(f"SQL Execution Failed (Attempt {attempts}): {err}")

                if attempts > max_retries:
                    return send(False, "Auto-healing failed.", err)

                messages.append({"role": "assistant", "content": json.dumps(ai_response)})
                messages.append({
                    "role": "user",
                    "content": f"The SQL execution failed with error: {err}. Please correct the SQL and regenerate the JSON."
                })

    except Exception as e:
        print("AI SYSTEM ERROR:", str(e))
        return send(False, "AI Failed", str(e))