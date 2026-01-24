import json
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from lib.connection import get_connection
from utils.response import send

router = APIRouter(prefix="/history")

class HistoryCreate(BaseModel):
    userId: int
    chatId: str
    userInput: str
    botOutput: str
    summary: Optional[str] = None
    metadata: Optional[List[Dict[str, Any]]] = None
    sql: Optional[str] = None

@router.post("/")
def create_history(history: HistoryCreate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        meta_json = json.dumps(history.metadata) if history.metadata else None

        cur.execute("""
            INSERT INTO "history"("userId", "chatId", "userInput", "botOutput", "summary", "metadata", "sql")
            VALUES (%s, %s, %s, %s, %s, %s, %s) 
            RETURNING "historyId";
        """, (history.userId, history.chatId, history.userInput, history.botOutput, history.summary, meta_json, history.sql))
        
        hid = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return send(True, "History created", {"historyId": hid})
    except Exception as e:
        return send(False, "Failed to create history", str(e))

@router.get("/list/{userId}")
def get_chat_list(userId: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT ON ("chatId") "chatId", "userInput", "createdAt"
            FROM "history" 
            WHERE "userId" = %s 
            ORDER BY "chatId", "createdAt" ASC;
        """, (userId,))
        
        rows = cur.fetchall()
        chat_list = []
        for r in rows:
            chat_list.append({
                "chatId": r[0],
                "title": r[1][:50] + "..." if len(r[1]) > 50 else r[1],
                "createdAt": str(r[2])
            })
            
        cur.close()
        conn.close()
        return send(True, "Chat list retrieved", chat_list)
    except Exception as e:
        return send(False, "Failed to fetch chat list", str(e))

@router.get("/{chatId}")
def get_chat_messages(chatId: str):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT "historyId", "userId", "userInput", "botOutput", "summary", "createdAt", "metadata", "sql"
            FROM "history" 
            WHERE "chatId" = %s 
            ORDER BY "createdAt" ASC;
        """, (chatId,))
        
        rows = cur.fetchall()
        
        messages = []
        for r in rows:
            messages.append({
                "historyId": r[0],
                "userId": r[1],
                "userInput": r[2],
                "botOutput": r[3],
                "summary": r[4],
                "createdAt": str(r[5]),
                "metadata": r[6],
                "sql": r[7]
            })
            
        cur.close()
        conn.close()
        return send(True, "Messages retrieved", messages)
    except Exception as e:
        return send(False, "Failed to fetch messages", str(e))

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

@router.delete("/chat/{chatId}")
def delete_chat_session(chatId: str):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("""
            DELETE FROM "history" 
            WHERE "chatId" = %s 
            RETURNING "chatId";
        """, (chatId,))
        
        deleted_rows = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()
        
        if deleted_rows > 0:
            return send(True, f"Chat session {chatId} deleted", {"chatId": chatId, "count": deleted_rows})
        return send(False, "Chat session not found")
    except Exception as e:
        return send(False, "Failed to delete chat session", str(e))