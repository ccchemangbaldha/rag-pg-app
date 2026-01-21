from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from lib.connection import get_connection
from utils.response import send
router = APIRouter(prefix="/users")

# --- Pydantic Models for JSON Body Validation ---
class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    email: str
    username: str
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None


# --- Routes ---
@router.post("/login")
def login_user(creds: LoginRequest):
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Find user by username
        cur.execute("""
            SELECT "userId", email, username, password 
            FROM "users" 
            WHERE username = %s;
        """, (creds.username,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return send(False, "User not found")

        # Verify password (basic comparison)
        # userId=row[0], email=row[1], username=row[2], db_pass=row[3]
        if row[3] != creds.password:
            return send(False, "Invalid password")

        return send(True, "Login successful", {
            "userId": row[0],
            "email": row[1],
            "username": row[2]
        })
    except Exception as e:
        return send(False, "Login failed", str(e))
    
@router.post("/")
def create_user(user: UserCreate):
    try:
        # Access data via user.email, user.username, etc.
        print(user.email, user.username, user.password)
        
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO "users"(email, username, password)
            VALUES (%s, %s, %s)
            RETURNING "userId", email, username;
        """, (user.email, user.username, user.password))
        
        new_user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return send(True, "User created", {
            "userId": new_user[0], 
            "email": new_user[1], 
            "username": new_user[2]
        })
    except Exception as e:
        return send(False, "Failed to create user", str(e))

@router.get("/")
def get_users():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""SELECT "userId", email, username FROM "users";""")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        return send(True, "Users retrieved", [
            {"userId": r[0], "email": r[1], "username": r[2]} for r in rows
        ])
    except Exception as e:
        return send(False, "Failed to fetch users", str(e))

@router.get("/{userId}")
def get_user(userId: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""SELECT "userId", email, username FROM "users" WHERE "userId" = %s;""", (userId,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return send(False, "User not found")
            
        return send(True, "User retrieved", {
            "userId": row[0], 
            "email": row[1], 
            "username": row[2]
        })
    except Exception as e:
        return send(False, "Failed to fetch user", str(e))

@router.put("/{userId}")
def update_user(userId: int, user: UserUpdate):
    try:
        fields = []
        values = []
        
        # Check fields from the Pydantic model
        if user.email:
            fields.append('email=%s')
            values.append(user.email)
        if user.username:
            fields.append('username=%s')
            values.append(user.username)
        if user.password:
            fields.append('password=%s')
            values.append(user.password)

        if not fields:
            return send(False, "Nothing to update")

        values.append(userId)

        conn = get_connection()
        cur = conn.cursor()
        
        # Safe dynamic SQL construction
        query = f"""
            UPDATE "users" 
            SET {', '.join(fields)}, "updatedAt"=NOW()
            WHERE "userId"=%s 
            RETURNING "userId";
        """
        
        cur.execute(query, tuple(values))
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if updated:
            return send(True, "User updated", {"userId": updated[0]})
        return send(False, "User not found")
    except Exception as e:
        return send(False, "Failed to update user", str(e))

@router.delete("/{userId}")
def delete_user(userId: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""DELETE FROM "users" WHERE "userId"=%s RETURNING "userId";""", (userId,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if deleted:
            return send(True, "User deleted", {"userId": deleted[0]})
        return send(False, "User not found")
    except Exception as e:
        return send(False, "Failed to delete user", str(e))