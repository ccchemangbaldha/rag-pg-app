from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from lib.connection import get_connection
from utils.response import send

router = APIRouter(prefix="/products")

# --- Pydantic Models ---
# Field names now match the database columns exactly (snake_case)
class ProductCreate(BaseModel):
    product_name: str
    brand: str
    category: str
    sub_category: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    material: Optional[str] = None
    gender: Optional[str] = None
    mfr_cost: float
    shipping_charge: Optional[float] = 0.0
    price: float
    country_of_origin: Optional[str] = None
    care_instructions: Optional[str] = None
    warranty_months: Optional[int] = 0
    rating: Optional[float] = 0.0
    launch_year: Optional[int] = None

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    material: Optional[str] = None
    gender: Optional[str] = None
    mfr_cost: Optional[float] = None
    shipping_charge: Optional[float] = None
    price: Optional[float] = None
    country_of_origin: Optional[str] = None
    care_instructions: Optional[str] = None
    warranty_months: Optional[int] = None
    rating: Optional[float] = None
    launch_year: Optional[int] = None

# --- Routes ---

@router.post("/")
def create_product(product: ProductCreate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO "products"
            ("product_name", "brand", "category", "sub_category", "description", 
             "color", "size", "material", "gender", "mfr_cost", "shipping_charge", 
             "price", "country_of_origin", "care_instructions", "warranty_months", 
             "rating", "launch_year")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING "product_id";
        """, (
            product.product_name, product.brand, product.category, product.sub_category, 
            product.description, product.color, product.size, product.material, 
            product.gender, product.mfr_cost, product.shipping_charge, product.price, 
            product.country_of_origin, product.care_instructions, product.warranty_months, 
            product.rating, product.launch_year
        ))
        
        pid = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return send(True, "Product created", {"product_id": pid})
    except Exception as e:
        return send(False, "Failed to create product", str(e))

@router.get("/")
def get_products():
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Changed ordering to product_id
        cur.execute("""SELECT * FROM "products" ORDER BY "product_id" DESC;""")
        rows = cur.fetchall()
        
        columns = [c[0] for c in cur.description]
        result = [dict(zip(columns, r)) for r in rows]
        
        cur.close()
        conn.close()
        return send(True, "Products retrieved", result)
    except Exception as e:
        return send(False, "Failed to fetch products", str(e))

@router.get("/{product_id}")
def get_product(product_id: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""SELECT * FROM "products" WHERE "product_id" = %s;""", (product_id,))
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

@router.put("/{product_id}")
def update_product(product_id: int, product: ProductUpdate):
    try:
        fields = []
        values = []
        
        # .dict(exclude_unset=True) ensures we only update fields sent in the request
        model_dump = product.dict(exclude_unset=True)
        
        if not model_dump:
            return send(False, "Nothing to update")

        for key, value in model_dump.items():
            # Since Pydantic model keys match DB columns, we can use key directly
            fields.append(f'"{key}"=%s')
            values.append(value)

        values.append(product_id)

        conn = get_connection()
        cur = conn.cursor()
        
        # Note: Assuming 'updated_at' or similar isn't in your new schema list, 
        # so I removed the automatic update of that timestamp.
        query = f"""
            UPDATE "products" 
            SET {', '.join(fields)}
            WHERE "product_id"=%s 
            RETURNING "product_id";
        """
        
        cur.execute(query, tuple(values))
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if updated:
            return send(True, "Product updated", {"product_id": updated[0]})
        return send(False, "Product not found")
    except Exception as e:
        return send(False, "Failed to update product", str(e))

@router.delete("/{product_id}")
def delete_product(product_id: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""DELETE FROM "products" WHERE "product_id"=%s RETURNING "product_id";""", (product_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if deleted:
            return send(True, "Product deleted", {"product_id": deleted[0]})
        return send(False, "Product not found")
    except Exception as e:
        return send(False, "Failed to delete product", str(e))