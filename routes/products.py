from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from lib.connection import get_connection
from utils.response import send

router = APIRouter(prefix="/products")

# --- Pydantic Models ---
class ProductCreate(BaseModel):
    productName: str
    category: str
    style: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    price: float
    widthCm: Optional[float] = None
    depthCm: Optional[float] = None
    heightCm: Optional[float] = None
    stock: Optional[int] = 0
    imageUrl: Optional[str] = None

class ProductUpdate(BaseModel):
    productName: Optional[str] = None
    category: Optional[str] = None
    style: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    price: Optional[float] = None
    widthCm: Optional[float] = None
    depthCm: Optional[float] = None
    heightCm: Optional[float] = None
    stock: Optional[int] = None
    imageUrl: Optional[str] = None

# --- Routes ---

@router.post("/")
def create_product(product: ProductCreate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO "products"
            ("productName", "category", "style", "color", "material", "price", 
             "widthCm", "depthCm", "heightCm", "stock", "imageUrl")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING "productId";
        """, (
            product.productName, product.category, product.style, product.color, 
            product.material, product.price, product.widthCm, product.depthCm, 
            product.heightCm, product.stock, product.imageUrl
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
        
        # .dict(exclude_unset=True) ensures we only update fields sent in the request
        model_dump = product.dict(exclude_unset=True)
        
        if not model_dump:
            return send(False, "Nothing to update")

        for key, value in model_dump.items():
            fields.append(f'"{key}"=%s')
            values.append(value)

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