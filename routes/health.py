from fastapi import APIRouter
from lib.connection import get_connection
from utils.response import send

router = APIRouter(prefix="/health")

@router.get("/")
def health_db():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        if result and result[0] == 1:
            return send(True, "Database healthy", {"result": 1})
        else:
            return send(False, "Database returned unexpected result")
            
    except Exception as e:
        return send(False, "Database unhealthy", str(e))