import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
from openai import OpenAI
from lib.connection import get_connection
from utils.response import send

router = APIRouter(prefix="/ai")

# Initialize OpenAI Client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- Pydantic Models ---
class AIRequest(BaseModel):
    userId: int
    prompt: str
    summary: Optional[str] = ""
    imageUrl: Optional[str] = None # Received but ignored for now as requested

# --- System Instruction for LLM ---
SYSTEM_PROMPT = """
You are an intelligent furniture recommendation assistant.
You have access to a PostgreSQL database table named "products" with the following schema:
- "productId" (int)
- "productName" (text)
- "category" (text)
- "style" (text) - e.g., Modern, Rustic, Minimalist
- "color" (text)
- "material" (text)
- "price" (numeric)
- "dimensions" (jsonb) - e.g., {"width": 100, "height": 200}

**Your Goal:**
1. Analyze the user's input and context to extract: **Room Theme/Style**, **Furniture Dimensions**, and **Colors**.
2. If ANY of these 3 are missing or ambiguous, you must ASK the user for them politely in your response.
3. If ALL 3 are present (or clearly implied), generate a valid PostgreSQL SELECT query to fetch matching items.

**Response Format:**
You must return ONLY a JSON object. Do not include markdown formatting.
Structure:
{
  "type": "question" | "query",
  "content": "The question to ask the user" OR "The SQL query string"
}
"""

@router.post("/chat")
def ai_chat(req: AIRequest):
    try:
        # 1. Construct the conversation history for OpenAI
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context/Summary of previous chat: {req.summary}"},
            {"role": "user", "content": f"Current User Request: {req.prompt}"}
        ]

        # 2. Call OpenAI
        # We ignore req.imageUrl for now as per instructions
        completion = client.chat.completions.create(
            model="gpt-4o",  # or gpt-3.5-turbo if 4o is unavailable
            messages=messages,
            temperature=0.2, # Low temperature for more deterministic SQL generation
            response_format={"type": "json_object"}
        )

        # 3. Parse AI Response
        ai_content = completion.choices[0].message.content
        if not ai_content:
            return send(False, "AI returned empty response")
        
        result = json.loads(ai_content)

        # 4. Handle "Question" type (Missing Data)
        if result["type"] == "question":
            return send(True, "More info needed", {
                "botOutput": result["content"],
                "action": "ask_user",
                "products": []
            })

        # 5. Handle "Query" type (Data Complete -> Execute SQL)
        elif result["type"] == "query":
            sql_query = result["content"]
            
            # Security / Sanity check: Ensure it's a SELECT statement
            if not sql_query.strip().upper().startswith("SELECT"):
                 return send(True, "Safety Block", {
                    "botOutput": "I cannot execute that command.",
                    "action": "error",
                    "products": []
                })

            # Execute the generated SQL
            conn = get_connection()
            cur = conn.cursor()
            try:
                cur.execute(sql_query)
                rows = cur.fetchall()
                
                # Dynamic column mapping
                columns = [c[0] for c in cur.description]
                products = [dict(zip(columns, r)) for r in rows]
                
                bot_msg = f"I found {len(products)} items that match your room."
                if len(products) == 0:
                    bot_msg = "I looked for items matching your criteria, but found no exact matches in stock."

                return send(True, "Products found", {
                    "botOutput": bot_msg,
                    "action": "show_products",
                    "products": products,
                    "generatedSql": sql_query # Returning for debugging/transparency
                })

            except Exception as db_err:
                conn.rollback()
                return send(False, "SQL Execution Failed", str(db_err))
            finally:
                cur.close()
                conn.close()

        else:
            return send(False, "Invalid AI response type")

    except Exception as e:
        return send(False, "AI Service Failed", str(e))