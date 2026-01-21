from fastapi import APIRouter
from utils.response import send
from lib.connection import get_connection

router = APIRouter(prefix="/match")

@router.post("/")
def match_furniture(userId: int, prompt: str, summary: str = None):
    try:
        # Step 1: Extract slots using LLM (pseudo)
        slots = extract_slots_via_llm(prompt, summary)  
        # slots => dict with product/style/color/theme/etc.

        # Step 2: Check missing info
        missing = [k for k,v in slots.items() if v is None]
        if missing:
            followup_q = generate_followup_question(slots, missing)
            return send(True, "Need clarification", {
                "followup": followup_q,
                "slots": slots
            })

        # Step 3: Generate SQL via LLM
        sql = generate_sql_via_llm(slots)

        # Step 4: Execute SQL
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(sql)
        rows = cur.fetchall()
        columns = [d[0] for d in cur.description]
        results = [dict(zip(columns, r)) for r in rows]

        cur.close()
        conn.close()

        return send(True, "Match results", results)

    except Exception as e:
        return send(False, "Match failed", str(e))
