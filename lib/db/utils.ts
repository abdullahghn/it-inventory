import { db } from './index'

// Database error types
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public detail?: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource: string, identifier?: string | number) {
    super(`${resource} not found${identifier ? ` with ID: ${identifier}` : ''}`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class DuplicateError extends DatabaseError {
  constructor(resource: string, field?: string) {
    super(`${resource} already exists${field ? ` with this ${field}` : ''}`, 'DUPLICATE_ERROR')
    this.name = 'DuplicateError'
  }
}

// Error handling utility
export function handleDatabaseError(error: any): never {
  console.error('Database error:', error)

  if (error.code === '23505') {
    // Unique constraint violation
    throw new DuplicateError('Resource', error.detail)
  }

  if (error.code === '23503') {
    // Foreign key constraint violation
    throw new ValidationError('Referenced resource does not exist')
  }

  if (error.code === '23502') {
    // Not null constraint violation
    throw new ValidationError('Required field is missing')
  }

  if (error.code === '42703') {
    // Undefined column
    throw new ValidationError('Invalid field specified')
  }

  if (error.code === '42P01') {
    // Undefined table
    throw new ValidationError('Invalid table specified')
  }

  // Connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    throw new DatabaseError('Database connection failed', error.code, error.message, error)
  }

  // Generic database error
  throw new DatabaseError(
    error.message || 'An unexpected database error occurred',
    error.code,
    error.detail,
    error
  )
}

// Transaction wrapper with error handling
export async function dbTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  try {
    return await db.transaction(callback)
  } catch (error) {
    handleDatabaseError(error)
  }
}

// Safe database operation wrapper
export async function safeDbOp<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error(errorMessage || 'Database operation failed:', error)
    handleDatabaseError(error)
  }
}

// Common database utilities
export const dbUtils = {
  // Find single record with error handling
  async findOne<T>(
    query: () => Promise<T[]>,
    resourceName: string,
    identifier?: string | number
  ): Promise<T> {
    try {
      const results = await query()
      if (results.length === 0) {
        throw new NotFoundError(resourceName, identifier)
      }
      return results[0]
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      handleDatabaseError(error)
    }
  },

  // Find multiple records with error handling
  async findMany<T>(
    query: () => Promise<T[]>,
    errorMessage?: string
  ): Promise<T[]> {
    return safeDbOp(query, errorMessage)
  },

  // Create record with error handling
  async create<T>(
    query: () => Promise<T[]>,
    resourceName: string
  ): Promise<T> {
    try {
      const results = await query()
      if (results.length === 0) {
        throw new DatabaseError(`Failed to create ${resourceName}`)
      }
      return results[0]
    } catch (error) {
      handleDatabaseError(error)
    }
  },

  // Update record with error handling
  async update<T>(
    query: () => Promise<T[]>,
    resourceName: string,
    identifier?: string | number
  ): Promise<T> {
    try {
      const results = await query()
      if (results.length === 0) {
        throw new NotFoundError(resourceName, identifier)
      }
      return results[0]
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      handleDatabaseError(error)
    }
  },

  // Delete record with error handling
  async delete<T>(
    query: () => Promise<T[]>,
    resourceName: string,
    identifier?: string | number
  ): Promise<T> {
    try {
      const results = await query()
      if (results.length === 0) {
        throw new NotFoundError(resourceName, identifier)
      }
      return results[0]
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      handleDatabaseError(error)
    }
  },

  // Count records with error handling
  async count(
    query: () => Promise<{ count: number }[]>,
    errorMessage?: string
  ): Promise<number> {
    try {
      const results = await safeDbOp(query, errorMessage)
      return results[0]?.count || 0
    } catch (error) {
      handleDatabaseError(error)
    }
  },

  // Check if record exists
  async exists<T>(
    query: () => Promise<T[]>
  ): Promise<boolean> {
    try {
      const results = await query()
      return results.length > 0
    } catch (error) {
      handleDatabaseError(error)
    }
  },

  // Batch operations with transaction
  async batch<T>(
    operations: ((tx: any) => Promise<T>)[],
    errorMessage?: string
  ): Promise<T[]> {
    try {
      return await dbTransaction(async (tx) => {
        const results: T[] = []
        for (const operation of operations) {
          const result = await operation(tx)
          results.push(result)
        }
        return results
      })
    } catch (error) {
      console.error(errorMessage || 'Batch operation failed:', error)
      handleDatabaseError(error)
    }
  },

  // Pagination utility
  async paginate<T>(
    query: (limit: number, offset: number) => Promise<T[]>,
    countQuery: () => Promise<{ count: number }[]>,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }> {
    try {
      const offset = (page - 1) * limit
      const [data, countResult] = await Promise.all([
        query(limit, offset),
        countQuery()
      ])

      const total = countResult[0]?.count || 0
      const totalPages = Math.ceil(total / limit)

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      handleDatabaseError(error)
    }
  }
}

// Helper function to format database constraints for user-friendly errors
export function formatConstraintError(error: any): string {
  if (error.constraint) {
    // Extract meaningful constraint names
    const constraintMap: Record<string, string> = {
      'assets_asset_tag_unique': 'Asset tag must be unique',
      'assets_serial_number_unique': 'Serial number must be unique',
      'user_email_unique': 'Email address must be unique',
      'user_employee_id_unique': 'Employee ID must be unique',
    }

    return constraintMap[error.constraint] || `Constraint violation: ${error.constraint}`
  }

  return error.message || 'A database constraint was violated'
}

// Database performance monitoring
export const dbMonitor = {
  // Log slow queries
  logSlowQuery: (query: string, duration: number, threshold: number = 1000) => {
    if (duration > threshold) {
      console.warn(`Slow query detected (${duration}ms):`, query)
    }
  },

  // Monitor connection health
  async checkHealth(): Promise<{
    healthy: boolean
    responseTime: number
    error?: string
  }> {
    const startTime = Date.now()
    try {
      await db.execute(`SELECT 1` as any)
      const responseTime = Date.now() - startTime
      return {
        healthy: true,
        responseTime
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        healthy: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
} 