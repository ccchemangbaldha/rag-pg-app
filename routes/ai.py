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

# ... [Keep SCHEMA_CONTEXT and AIRequest class exactly as they were] ...

SCHEMA_CONTEXT = """
DATABASE SCHEMA (SIMPLIFIED):

TABLE products (
    product_id        BIGSERIAL PRIMARY KEY,
    product_name      TEXT NOT NULL,
    brand             TEXT NOT NULL,
    category          TEXT,
    sub_category      TEXT,
    price             NUMERIC(10,2),
    rating            NUMERIC(3,1),
    gender            TEXT,
    color             TEXT,
    size              TEXT,
    material          TEXT,
    description       TEXT,
    country_of_origin TEXT,
    care_instructions TEXT,
    warranty_months   INTEGER,
    launch_year       INTEGER,
    image_url         TEXT,
    created_at        TIMESTAMPTZ,
    updated_at        TIMESTAMPTZ
);

TABLE sales (
    salesId SERIAL PRIMARY KEY,
    sale_date DATE,
    product_id VARCHAR(50),
    category VARCHAR(100),
    sales INTEGER,
    inventory INTEGER,
    ad_cost NUMERIC(12,2),
    clicks INTEGER,
    impressions INTEGER,
    mfr_cost NUMERIC(12,2),
    price NUMERIC(12,2)
);

JOIN RULE:
  sales.product_id is VARCHAR → use CAST(sales.product_id AS INT) to join with products.product_id

-----------------------------------
SEMANTIC RETAIL INTERPRETATION LAYER
-----------------------------------

Users may describe footwear in natural language:

SEASON / WEATHER:
  - monsoon / rainy → synthetic, anti-slip, rubber, sandals, quick dry
  - winter / cold   → leather, foam, cushioned, warm
  - summer / heat   → breathable, mesh, EVA sole, sandals

ACTIVITY / USE-CASE:
  - running, gym, sports  → Running Shoes / Sports Shoes
  - office/formal/work    → Formal Shoes
  - casual                → Sneakers, Sports Shoes, Sandals
  - trekking/hiking       → robust, grip, outsole

DEMOGRAPHICS:
  - kids      → product_name or description ILIKE '%kid%'
  - men       → gender = 'Men'
  - women     → gender = 'Women'
  - unisex    → gender = 'Unisex'

MATERIAL / COMFORT:
  - breathable, mesh, eva, knit
  - memory foam, cushioned, anti-slip, leather, vegan

INTERPRETATION RULE:
  If user intent = product discovery or semantic filter:
    - generate SELECT from products
    - use ILIKE fuzzy matching on product_name, sub_category, description, material
    - apply mapped filters based on season/activity/etc.
    - ORDER BY rating DESC or price ASC depending on query tone

ANALYTICS RULE:
  If user intent = revenue, best selling, inventory, ads:
    - join products + sales
    - generate SELECT with GROUP BY / SUM / ORDER

CONVERSATION RULE:
  If user intent = greeting, context, or personal:
    - no SQL

AMBIGUOUS RULE:
  If unclear, ask for clarification instead of hallucinating columns.
  Only generate SELECT queries. Never INSERT/UPDATE/DELETE.
-----------------------------------

COLUMN USAGE GUIDELINES:
- Revenue      = SUM(sales.sales * sales.price)
- Items sold   = SUM(sales.sales)
- Stock        = SUM(sales.inventory)
- Marketing    = ad_cost, clicks, impressions
-----------------------------------
TIME SERIES & DATE RULES (IMPORTANT):
- sales.sale_date is DATE (or stored as string convertible to DATE)
- Use DATE_TRUNC('month', sale_date) for monthly aggregation:
    SELECT DATE_TRUNC('month', sale_date) AS month, SUM(sales) ...
- Always ORDER BY month for line/area charts.

CATEGORY SHARE RULE:
- For pie charts, aggregate by category/sub_category:
    SELECT sub_category, SUM(sales) AS total FROM sales GROUP BY sub_category

MULTI-SERIES CHART RULE:
- For comparing metrics (e.g., sales vs inventory):
    SELECT DATE_TRUNC('month', sale_date) AS month,
           SUM(sales) AS sales,
           SUM(inventory) AS inventory
    FROM sales GROUP BY month ORDER BY month

RATING DISTRIBUTION RULE:
- Ratings exist in products table, so join if user asks:
    SELECT rating, COUNT(*) FROM products GROUP BY rating ORDER BY rating

PRODUCT + SALES JOIN RULE:
- Use this form when mixing rating with sales:
    SELECT p.brand, AVG(p.rating), SUM(s.sales)
    FROM products p
    JOIN sales s ON p.product_id = CAST(s.product_id AS INT)
    GROUP BY p.brand

CHART INFERENCE RULES:
- line/area → time-series (requires DATE_TRUNC or monthly groups)
- bar → ranking/comparison (brand/category)
- pie → share of category (SUM sales/percentage)
- scatter/multi-series → correlation (sales vs inventory)

Example (Time-series):
User: "show sales trend by month"
Response: {
 "sql": "SELECT DATE_TRUNC('month', sale_date) AS month,
                SUM(sales) AS total_sales
         FROM sales GROUP BY month ORDER BY month",
 "message": "Monthly sales trend.",
 "chartConfig": { "type": "line", "xAxisKey": "month", "series":[{"dataKey":"total_sales","name":"Sales"}] }
}

FEW-SHOT EXAMPLES:

Example (Discovery):
User: "shoes for monsoon"
Response: {
  "sql": "SELECT product_name, brand, material, price FROM products
          WHERE material ILIKE '%synthetic%' OR description ILIKE '%anti-slip%' OR description ILIKE '%rubber%'",
  "message": "These materials handle rain and wet surfaces well.",
  "chartConfig": null
}

Example (Activity):
User: "best running shoes"
Response: {
  "sql": "SELECT product_name, brand, rating, price FROM products
          WHERE sub_category ILIKE '%Running%' ORDER BY rating DESC LIMIT 10",
  "message": "Top-rated running shoes.",
  "chartConfig": null
}

Example (Analytics):
User: "which brand makes the most money?"
Response: {
  "sql": "SELECT brand, SUM(sales * price) AS revenue FROM sales GROUP BY brand ORDER BY revenue DESC",
  "message": "Here are brands ordered by total revenue.",
  "chartConfig": { "type": "bar", "xAxisKey": "brand", "series":[{"dataKey":"revenue","name":"Revenue"}] }
}

Example (Conversational):
User: "hi"
Response: {
  "sql": null,
  "message": "Hello! I can help you analyze products or sales.",
  "chartConfig": null
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
        temperature=0
    )
    content = json.loads(completion.choices[0].message.content)
    
    # Extract token usage
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
        You are a hybrid Retail Product Assistant + Data Analyst for PostgreSQL.
        You must choose one of three modes:
          (1) SQL Data Analyst Mode
          (2) Product Discovery Mode
          (3) Conversational Mode

        Behavior Rules:
        - Never hallucinate columns.
        - Only SELECT is allowed.
        - If discovery intent found → query 'products'
        - If analytics intent found → join 'sales'
        - If greeting or meta intent → no SQL
        - Use semantic retail mapping when helpful.
        - Be helpful and concise.
        - Always return JSON:
        {{
           "sql": SELECT ... OR null,
           "message": string,
           "chartConfig": object OR null
        }}

        Now use the schema and semantic mapping below:
        {SCHEMA_CONTEXT}
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
            # Unpack response and usage
            ai_response, usage_stats = generate_ai_response(messages)
            
            generated_sql = ai_response.get("sql")
            bot_message = ai_response.get("message")
            chart_config = ai_response.get("chartConfig")

            if not generated_sql:
                return send(True, "Success", {
                    "botOutput": bot_message,
                    "sql": None,
                    "results": [],
                    "chartConfig": None,
                    "action": "chat",
                    "usage": usage_stats  # Include usage in response
                })

            if not generated_sql.strip().lower().startswith("select"):
                return send(False, "Security violation: only SELECT queries allowed.")

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
                    "action": "search_result",
                    "usage": usage_stats # Include usage in response
                })

            except Exception as db_err:
                attempts += 1
                err = str(db_err)
                print(f"SQL Execution Failed (Attempt {attempts}): {err}")

                if attempts > max_retries:
                    return send(False, "Auto-healing failed.", err)

                messages.append({"role": "assistant", "content": json.dumps(ai_response)})
                messages.append({
                    "role": "user",
                    "content": f"The SQL failed with error: {err}. Correct it and regenerate JSON."
                })

    except Exception as e:
        print("AI SYSTEM ERROR:", str(e))
        return send(False, "AI Failed", str(e))