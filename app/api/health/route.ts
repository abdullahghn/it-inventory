import { NextResponse } from 'next/server'
import { checkDatabaseHealth, getConnectionConfig } from '@/lib/db'
import { dbMonitor } from '@/lib/db/utils'

export async function GET() {
  try {
    // Check database health
    const dbHealth = await dbMonitor.checkHealth()
    
    // Get connection configuration
    const connectionConfig = getConnectionConfig()
    
    // Overall health status
    const isHealthy = dbHealth.healthy
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbHealth.healthy ? 'up' : 'down',
          responseTime: `${dbHealth.responseTime}ms`,
          error: dbHealth.error
        }
      },
      database: {
        connectionPool: {
          maxConnections: connectionConfig.maxConnections,
          idleTimeout: `${connectionConfig.idleTimeout}s`,
          connectTimeout: `${connectionConfig.connectTimeout}s`,
          maxLifetime: `${connectionConfig.maxLifetime}s`
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        version: process.env.npm_package_version || 'unknown'
      }
    }

    return NextResponse.json(
      healthData,
      { status: isHealthy ? 200 : 503 }
    )
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
} 