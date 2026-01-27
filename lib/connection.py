import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    dbname = os.getenv("DB_NAME")
    dialect = os.getenv("DB_DIALECT")

    if dialect != "postgres":
        raise Exception("Unsupported DB_DIALECT, expected 'postgres'")

    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        dbname=dbname
    )
    return conn
