from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from lib.connection import get_connection
from utils.response import send

router = APIRouter(prefix="/history")

# --- Pydantic Model ---
class HistoryCreate(BaseModel):
    userId: int
    userInput: str
    botOutput: str
    summary: Optional[str] = None

# --- Routes ---

@router.post("/")
def create_history(history: HistoryCreate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO "history"("userId", "userInput", "botOutput", "summary")
            VALUES (%s, %s, %s, %s) 
            RETURNING "historyId";
        """, (history.userId, history.userInput, history.botOutput, history.summary))
        
        hid = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return send(True, "History created", {"historyId": hid})
    except Exception as e:
        return send(False, "Failed to create history", str(e))

@router.get("/{userId}")
def get_history(userId: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Fetch history sorted by newest first
        cur.execute("""
            SELECT "historyId", "userId", "userInput", "botOutput", "summary", "createdAt"
            FROM "history" 
            WHERE "userId" = %s 
            ORDER BY "createdAt" DESC;
        """, (userId,))
        
        rows = cur.fetchall()
        
        # Map tuple results to dictionary
        history_list = []
        for r in rows:
            history_list.append({
                "historyId": r[0],
                "userId": r[1],
                "userInput": r[2],
                "botOutput": r[3],
                "summary": r[4],
                "createdAt": str(r[5]) # Convert timestamp to string for JSON serialization
            })
            
        cur.close()
        conn.close()
        return send(True, "History retrieved", history_list)
    except Exception as e:
        return send(False, "Failed to fetch history", str(e))

@router.delete("/{historyId}")
def delete_history(historyId: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            DELETE FROM "history" 
            WHERE "historyId"=%s 
            RETURNING "historyId";
        """, (historyId,))
        
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if deleted:
            return send(True, "History deleted", {"historyId": deleted[0]})
        return send(False, "History record not found")
    except Exception as e:
        return send(False, "Failed to delete history", str(e))