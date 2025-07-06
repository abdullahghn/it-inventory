import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Environment validation
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

const connectionString = process.env.DATABASE_URL

// Enhanced connection configuration with comprehensive pooling
export const client = postgres(connectionString, {
  prepare: false,
  max: parseInt(process.env.DB_POOL_MAX || '10'), // Maximum connections in pool
  idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || '20'), // Close idle connections after 20 seconds
  connect_timeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '30'), // Connection timeout in seconds
  max_lifetime: parseInt(process.env.DB_MAX_LIFETIME || '1800'), // Maximum lifetime of connection (30 minutes)
  onnotice: (notice) => {
    // Log PostgreSQL notices in development
    if (process.env.NODE_ENV === 'development') {
      console.log('PostgreSQL notice:', notice)
    }
  },
  debug: process.env.NODE_ENV === 'development' ? (connection, query, params) => {
    // Log queries in development
    console.log('Query:', query)
    if (params?.length) {
      console.log('Params:', params)
    }
  } : undefined,
})

// Enhanced Drizzle instance with logger
export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery: (query, params) => {
      console.log('Drizzle Query:', query)
      if (params?.length) {
        console.log('Drizzle Params:', params)
      }
    }
  } : undefined
})

// Connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Get connection pool configuration
export function getConnectionConfig() {
  return {
    maxConnections: parseInt(process.env.DB_POOL_MAX || '10'),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '20'),
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '30'),
    maxLifetime: parseInt(process.env.DB_MAX_LIFETIME || '1800'),
  }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  try {
    await client.end()
    console.log('Database connection closed gracefully')
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
}

// Handle process termination - only in Node.js runtime (not Edge Runtime)
if (typeof process !== 'undefined' && process.on) {
  process.on('SIGTERM', closeDatabaseConnection)
  process.on('SIGINT', closeDatabaseConnection)
}

export default db 