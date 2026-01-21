from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from lib.connection import get_connection
from utils.response import send
import json

router = APIRouter(prefix="/products")

# --- Pydantic Models ---
class ProductCreate(BaseModel):
    productName: str
    category: str
    style: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    price: Optional[float] = 0.0
    brand: Optional[str] = None
    dimensions: Optional[Dict[str, Any]] = None
    stock: Optional[int] = 0
    imageUrl: Optional[str] = None

class ProductUpdate(BaseModel):
    productName: Optional[str] = None
    category: Optional[str] = None
    style: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    price: Optional[float] = None
    brand: Optional[str] = None
    dimensions: Optional[Dict[str, Any]] = None
    stock: Optional[int] = None
    imageUrl: Optional[str] = None

# --- Routes ---

@router.post("/")
def create_product(product: ProductCreate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        dim_json = json.dumps(product.dimensions) if product.dimensions else None

        # FIX: Added double quotes around column names
        cur.execute("""
            INSERT INTO "products"
            ("productName", "category", "style", "color", "material", "price", "brand", "dimensions", "stock", "imageUrl")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING "productId";
        """, (
            product.productName, product.category, product.style, product.color, 
            product.material, product.price, product.brand, dim_json, 
            product.stock, product.imageUrl
        ))
        
        pid = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return send(True, "Product created", {"productId": pid})
    except Exception as e:
        return send(False, "Failed to create product", str(e))

@router.get("/")
def get_products():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""SELECT * FROM "products" ORDER BY "productId" DESC;""")
        rows = cur.fetchall()
        
        columns = [c[0] for c in cur.description]
        result = [dict(zip(columns, r)) for r in rows]
        
        cur.close()
        conn.close()
        return send(True, "Products retrieved", result)
    except Exception as e:
        return send(False, "Failed to fetch products", str(e))

@router.get("/{productId}")
def get_product(productId: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""SELECT * FROM "products" WHERE "productId" = %s;""", (productId,))
        row = cur.fetchone()
        
        if not row:
            cur.close()
            conn.close()
            return send(False, "Product not found")

        columns = [c[0] for c in cur.description]
        data = dict(zip(columns, row))
        
        cur.close()
        conn.close()
        return send(True, "Product retrieved", data)
    except Exception as e:
        return send(False, "Failed to fetch product", str(e))

@router.put("/{productId}")
def update_product(productId: int, product: ProductUpdate):
    try:
        fields = []
        values = []
        
        model_dump = product.dict(exclude_unset=True)
        
        for key, value in model_dump.items():
            # FIX: Ensure keys are quoted for the UPDATE statement
            fields.append(f'"{key}"=%s') 
            
            if key == 'dimensions' and value is not None:
                values.append(json.dumps(value))
            else:
                values.append(value)

        if not fields:
            return send(False, "Nothing to update")

        values.append(productId)

        conn = get_connection()
        cur = conn.cursor()
        
        query = f"""
            UPDATE "products" 
            SET {', '.join(fields)}, "updatedAt"=NOW()
            WHERE "productId"=%s 
            RETURNING "productId";
        """
        
        cur.execute(query, tuple(values))
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if updated:
            return send(True, "Product updated", {"productId": updated[0]})
        return send(False, "Product not found")
    except Exception as e:
        return send(False, "Failed to update product", str(e))

@router.delete("/{productId}")
def delete_product(productId: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""DELETE FROM "products" WHERE "productId"=%s RETURNING "productId";""", (productId,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if deleted:
            return send(True, "Product deleted", {"productId": deleted[0]})
        return send(False, "Product not found")
    except Exception as e:
        return send(False, "Failed to delete product", str(e))