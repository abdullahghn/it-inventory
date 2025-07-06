import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { user as userTable } from '@/lib/db/schema'
import { 
  createUserSchema, 
  userFiltersSchema,
  type CreateUser,
  type UserFilters 
} from '@/lib/validations'
import { dbUtils } from '@/lib/db/utils'
import { requireAuth, requireRole, hasRole, getCurrentUser } from '@/lib/auth'
import { eq, and, or, like, inArray, sql, count } from 'drizzle-orm'

// ============================================================================
// GET /api/users - List users with role-based filtering and RBAC
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 })
    }
    
    // Parse and validate query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    // Parse arrays and numbers from query params
    const parsedParams = {
      ...queryParams,
      role: queryParams.role?.split(',') || undefined,
      department: queryParams.department?.split(',') || undefined,
      page: queryParams.page ? parseInt(queryParams.page) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
      isActive: queryParams.isActive ? queryParams.isActive === 'true' : undefined,
    }
    
    const filters = userFiltersSchema.parse(parsedParams)
    
    // RBAC: Check permissions for user listing
    const canViewAllUsers = await hasRole('manager')
    const canViewFullDetails = await hasRole('admin')
    
    // Base query - different field selection based on role
    let selectFields: any = {
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
      department: userTable.department,
      isActive: userTable.isActive,
      createdAt: userTable.createdAt,
    }
    
    // Admins can see all details, managers can see extended details
    if (canViewFullDetails) {
      selectFields = {
        ...selectFields,
        jobTitle: userTable.jobTitle,
        employeeId: userTable.employeeId,
        phone: userTable.phone,
        image: userTable.image,
        lastLoginAt: userTable.lastLoginAt,
        updatedAt: userTable.updatedAt,
      }
    } else if (canViewAllUsers) {
      selectFields = {
        ...selectFields,
        jobTitle: userTable.jobTitle,
        employeeId: userTable.employeeId,
      }
    }
    
    // Build where conditions
    const whereConditions = []
    
    // RBAC: Regular users can only see active users in their department
    if (!canViewAllUsers) {
      whereConditions.push(
        and(
          eq(userTable.isActive, true),
          eq(userTable.department, currentUser.department || '')
        )!
      )
    }
    
    // Search filter
    if (filters.search) {
      whereConditions.push(
        or(
          like(userTable.name, `%${filters.search}%`),
          like(userTable.email, `%${filters.search}%`),
          like(userTable.employeeId, `%${filters.search}%`)
        )!
      )
    }
    
    // Role filter - only admins can filter by role
    if (filters.role && canViewFullDetails) {
      const roles = Array.isArray(filters.role) ? filters.role : [filters.role]
      whereConditions.push(inArray(userTable.role, roles))
    }
    
    // Department filter
    if (filters.department) {
      const departments = Array.isArray(filters.department) ? filters.department : [filters.department]
      
      // Regular users can only filter within their own department
      if (!canViewAllUsers && currentUser.department) {
        const allowedDepartments = departments.filter(dept => dept === currentUser.department)
        if (allowedDepartments.length > 0) {
          whereConditions.push(inArray(userTable.department, allowedDepartments))
        }
      } else if (canViewAllUsers) {
        whereConditions.push(inArray(userTable.department, departments))
      }
    }
    
    // Active status filter - only managers+ can see inactive users
    if (filters.isActive !== undefined) {
      if (canViewAllUsers) {
        whereConditions.push(eq(userTable.isActive, filters.isActive))
      } else if (filters.isActive === false) {
        // Regular users cannot see inactive users
        return NextResponse.json({
          success: false,
          error: 'Insufficient permissions to view inactive users',
        }, { status: 403 })
      }
    }
    
    // Build final where clause
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined
    
    // Get total count
    const countQuery = db
      .select({ count: count() })
      .from(userTable)
      .where(whereClause)
    
    const totalCount = await dbUtils.count(() => countQuery)
    
    // Build sorting
    let orderBy = sql`${userTable.createdAt} DESC`
    if (filters.sortBy) {
      const direction = filters.sortOrder === 'desc' ? sql`DESC` : sql`ASC`
      switch (filters.sortBy) {
        case 'name':
          orderBy = sql`${userTable.name} ${direction}`
          break
        case 'email':
          orderBy = sql`${userTable.email} ${direction}`
          break
        case 'role':
          orderBy = sql`${userTable.role} ${direction}`
          break
        case 'department':
          orderBy = sql`${userTable.department} ${direction}`
          break
        case 'createdAt':
          orderBy = sql`${userTable.createdAt} ${direction}`
          break
        default:
          orderBy = sql`${userTable.name} ASC`
      }
    }
    
    // Execute paginated query
    const offset = (filters.page - 1) * filters.limit
    const usersQuery = db
      .select(selectFields)
      .from(userTable)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
    
    const usersData = await dbUtils.findMany(() => usersQuery, 'Failed to fetch users')
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / filters.limit)
    
    return NextResponse.json({
      success: true,
      data: usersData,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      },
      filters: filters,
      permissions: {
        canViewAllUsers,
        canViewFullDetails,
        currentUserRole: currentUser.role,
      },
    })
    
  } catch (error: any) {
    console.error('GET /api/users error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors,
      }, { status: 400 })
    }
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 })
    }
    
    if (error.message.includes('required')) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions',
      }, { status: 403 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    }, { status: 500 })
  }
}

// ============================================================================
// POST /api/users - Create new user (Admin+ only)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication and require admin role
    const session = await requireRole('admin')
    
    // Parse and validate request body
    const body = await request.json()
    const userData = createUserSchema.parse(body)
    
    // Additional validation: Only super_admin can create admin/super_admin users
    if (['admin', 'super_admin'].includes(userData.role)) {
      await requireRole('super_admin')
    }
    
    // Generate unique user ID (UUID v4 format for NextAuth compatibility)
    const userId = crypto.randomUUID()
    
    // Create user in database
    const newUser = await dbUtils.create(
      () => db
        .insert(userTable)
        .values({
          id: userId,
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          role: userTable.role,
          department: userTable.department,
          jobTitle: userTable.jobTitle,
          employeeId: userTable.employeeId,
          phone: userTable.phone,
          isActive: userTable.isActive,
          createdAt: userTable.createdAt,
          updatedAt: userTable.updatedAt,
        }),
      'user'
    )
    
    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'User created successfully',
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('POST /api/users error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user data',
        details: error.errors,
      }, { status: 400 })
    }
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 })
    }
    
    if (error.message.includes('required')) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions - Admin role required',
      }, { status: 403 })
    }
    
    if (error.message.includes('already exists')) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists',
      }, { status: 409 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    }, { status: 500 })
  }
} 