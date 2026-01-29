import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv
from typing import Optional
import logging

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Connection pool
connection_pool: Optional[pool.ThreadedConnectionPool] = None

def get_database_config():
    """
    Load database configuration from environment variables
    
    Required Environment Variables:
        DB_HOST: Database host address
        DB_PORT: Database port (default: 5432)
        DB_USER: Database user
        DB_PASSWORD: Database password
        DB_NAME: Database name
        DB_DIALECT: Database type (postgres)
        DB_SSL_MODE: SSL mode (disable, allow, prefer, require, verify-ca, verify-full)
        DB_SSL_CERT: Path to SSL certificate (optional)
        DB_MAX_CONNECTIONS: Maximum connections in pool (default: 10)
        DB_CONNECTION_TIMEOUT: Connection timeout in seconds (default: 30)
    """
    config = {
        'host': os.getenv("DB_HOST", "localhost"),
        'port': os.getenv("DB_PORT", "5432"),
        'user': os.getenv("DB_USER"),
        'password': os.getenv("DB_PASSWORD"),
        'dbname': os.getenv("DB_NAME"),
        'dialect': os.getenv("DB_DIALECT", "postgres"),
        'sslmode': os.getenv("DB_SSL_MODE", "prefer"),
        'sslrootcert': os.getenv("DB_SSL_CERT"),
        'max_connections': int(os.getenv("DB_MAX_CONNECTIONS", "10")),
        'connection_timeout': int(os.getenv("DB_CONNECTION_TIMEOUT", "30"))
    }
    
    # Validate required fields
    if not config['user'] or not config['password'] or not config['dbname']:
        raise ValueError("Missing required database configuration: DB_USER, DB_PASSWORD, and DB_NAME must be set")
    
    if config['dialect'] != "postgres":
        raise Exception(f"Unsupported DB_DIALECT: {config['dialect']}, expected 'postgres'")
    
    return config

def initialize_connection_pool():
    """
    Initialize the database connection pool
    Should be called once when the application starts
    """
    global connection_pool
    
    if connection_pool is not None:
        logger.warning("Connection pool already initialized")
        return
    
    try:
        config = get_database_config()
        
        # Build connection parameters
        conn_params = {
            'host': config['host'],
            'port': config['port'],
            'user': config['user'],
            'password': config['password'],
            'dbname': config['dbname'],
            'sslmode': config['sslmode'],
            'connect_timeout': config['connection_timeout']
        }
        
        # Add SSL certificate if provided
        if config['sslrootcert']:
            conn_params['sslrootcert'] = config['sslrootcert']
        
        # Create connection pool
        connection_pool = pool.ThreadedConnectionPool(
            minconn=2,
            maxconn=config['max_connections'],
            **conn_params
        )
        
        logger.info(f"Database connection pool initialized (max connections: {config['max_connections']})")
        
    except Exception as e:
        logger.error(f"Failed to initialize connection pool: {e}")
        raise

def get_connection():
    """
    Get a connection from the pool
    If pool is not initialized, create a single connection
    
    Returns:
        psycopg2.connection: Database connection
    """
    global connection_pool
    
    # Initialize pool if not already done
    if connection_pool is None:
        config = get_database_config()
        
        # Build connection parameters
        conn_params = {
            'host': config['host'],
            'port': config['port'],
            'user': config['user'],
            'password': config['password'],
            'dbname': config['dbname'],
            'sslmode': config['sslmode'],
            'connect_timeout': config['connection_timeout']
        }
        
        # Add SSL certificate if provided
        if config['sslrootcert']:
            conn_params['sslrootcert'] = config['sslrootcert']
        
        logger.warning("Connection pool not initialized, creating single connection")
        return psycopg2.connect(**conn_params)
    
    # Get connection from pool
    try:
        conn = connection_pool.getconn()
        logger.debug("Connection retrieved from pool")
        return conn
    except Exception as e:
        logger.error(f"Failed to get connection from pool: {e}")
        raise

def release_connection(conn):
    """
    Return a connection to the pool
    
    Args:
        conn: Database connection to release
    """
    global connection_pool
    
    if connection_pool is not None:
        try:
            connection_pool.putconn(conn)
            logger.debug("Connection returned to pool")
        except Exception as e:
            logger.error(f"Failed to return connection to pool: {e}")
    else:
        # If no pool, just close the connection
        try:
            conn.close()
            logger.debug("Connection closed")
        except Exception as e:
            logger.error(f"Failed to close connection: {e}")

def close_connection_pool():
    """
    Close all connections in the pool
    Should be called when the application shuts down
    """
    global connection_pool
    
    if connection_pool is not None:
        try:
            connection_pool.closeall()
            connection_pool = None
            logger.info("Connection pool closed")
        except Exception as e:
            logger.error(f"Failed to close connection pool: {e}")

def test_connection():
    """
    Test database connection and return status
    
    Returns:
        dict: Status information including success, message, and connection details
    """
    try:
        config = get_database_config()
        conn = get_connection()
        cursor = conn.cursor()
        
        # Test query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        
        cursor.close()
        release_connection(conn)
        
        return {
            'success': True,
            'message': 'Connection successful',
            'host': config['host'],
            'port': config['port'],
            'database': config['dbname'],
            'version': version
        }
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        return {
            'success': False,
            'message': str(e),
            'host': None,
            'port': None,
            'database': None,
            'version': None
        }
