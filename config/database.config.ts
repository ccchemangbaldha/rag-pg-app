/**
 * Database Configuration
 * 
 * This file contains the database connection configuration structure.
 * All sensitive values should be loaded from environment variables.
 * 
 * Environment Variables Required:
 * - DB_HOST: Database host address
 * - DB_PORT: Database port (default: 5432 for PostgreSQL)
 * - DB_NAME: Database name
 * - DB_USER: Database user
 * - DB_PASSWORD: Database password
 * - DB_DIALECT: Database type (postgres, mysql, etc.)
 * - DB_SSL_MODE: SSL mode (disable, allow, prefer, require, verify-ca, verify-full)
 * - DB_SSL_CERT: Path to SSL certificate file (optional)
 * - DB_MAX_CONNECTIONS: Maximum number of connections in the pool
 * - DB_CONNECTION_TIMEOUT: Connection timeout in seconds
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  dialect: 'postgres' | 'mysql' | 'sqlite' | 'mariadb' | 'mssql';
  ssl?: {
    mode: 'disable' | 'allow' | 'prefer' | 'require' | 'verify-ca' | 'verify-full';
    ca?: string;
    cert?: string;
    key?: string;
    rejectUnauthorized?: boolean;
  };
  pool?: {
    max: number;
    min?: number;
    acquire?: number;
    idle?: number;
  };
  connectionTimeout?: number;
}

/**
 * Load database configuration from environment variables
 * @returns DatabaseConfig object with all connection parameters
 */
export function getDatabaseConfig(): DatabaseConfig {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const database = process.env.DB_NAME || '';
  const user = process.env.DB_USER || '';
  const password = process.env.DB_PASSWORD || '';
  const dialect = (process.env.DB_DIALECT || 'postgres') as DatabaseConfig['dialect'];
  
  const sslMode = process.env.DB_SSL_MODE || 'prefer';
  const sslCert = process.env.DB_SSL_CERT;
  
  const maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10);
  const connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT || '30', 10);

  // Validate required fields
  if (!database || !user) {
    throw new Error('Database configuration incomplete: DB_NAME and DB_USER are required');
  }

  const config: DatabaseConfig = {
    host,
    port,
    database,
    user,
    password,
    dialect,
    pool: {
      max: maxConnections,
      min: 2,
      acquire: connectionTimeout * 1000,
      idle: 10000
    },
    connectionTimeout: connectionTimeout * 1000
  };

  // Add SSL configuration if specified
  if (sslMode !== 'disable') {
    config.ssl = {
      mode: sslMode as DatabaseConfig['ssl']['mode'],
      rejectUnauthorized: sslMode === 'verify-full' || sslMode === 'verify-ca'
    };

    if (sslCert) {
      config.ssl.ca = sslCert;
    }
  }

  return config;
}

/**
 * Create a connection string from the configuration
 * Useful for certain database clients that prefer connection strings
 * @param config DatabaseConfig object
 * @param maskPassword Whether to mask the password in the output (default: true)
 * @returns Connection string
 */
export function createConnectionString(config: DatabaseConfig, maskPassword = true): string {
  const password = maskPassword ? '****' : config.password;
  const sslParam = config.ssl && config.ssl.mode !== 'disable' 
    ? `?sslmode=${config.ssl.mode}` 
    : '';
  
  return `${config.dialect}://${config.user}:${password}@${config.host}:${config.port}/${config.database}${sslParam}`;
}

/**
 * Validate database configuration
 * @param config DatabaseConfig object
 * @returns Object with isValid boolean and errors array
 */
export function validateConfig(config: DatabaseConfig): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];

  if (!config.host) errors.push('Host is required');
  if (!config.port || config.port < 1 || config.port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }
  if (!config.database) errors.push('Database name is required');
  if (!config.user) errors.push('User is required');
  if (!config.password) errors.push('Password is required');
  
  if (config.pool) {
    if (config.pool.max < 1) errors.push('Max connections must be at least 1');
    if (config.pool.min && config.pool.min > config.pool.max) {
      errors.push('Min connections cannot exceed max connections');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Export a default configuration loader
export default getDatabaseConfig;
