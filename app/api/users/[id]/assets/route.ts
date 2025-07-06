import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { user as userTable, assets, assetAssignments } from '@/lib/db/schema'
import { 
  assignmentFiltersSchema,
  type AssignmentFilters 
} from '@/lib/validations'
import { dbUtils } from '@/lib/db/utils'
import { requireAuth, hasRole, getCurrentUser } from '@/lib/auth'
import { eq, and, or, like, gte, lte, inArray, sql, count } from 'drizzle-orm'

// ============================================================================
// GET /api/users/[id]/assets - Get user's assigned assets with RBAC
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await requireAuth()
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Current user not found',
      }, { status: 404 })
    }
    
    // Validate user ID
    const userId = params.id
    if (!userId || userId.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 400 })
    }
    
    // RBAC: Check permissions
    const canViewAllUsers = await hasRole('manager')
    const isOwnProfile = currentUser.id === userId
    
    // Users can only view their own assets unless they're manager+
    if (!canViewAllUsers && !isOwnProfile) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to view this user\'s assets',
      }, { status: 403 })
    }
    
    // Verify the target user exists
    const targetUser = await dbUtils.findOne(
      () => db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          department: userTable.department,
          isActive: userTable.isActive,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1),
      'User',
      userId
    )
    
    // Additional check: regular users can only view active users in their department
    if (!canViewAllUsers && !isOwnProfile) {
      if (!targetUser.isActive || targetUser.department !== currentUser.department) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient permissions to view this user\'s assets',
        }, { status: 403 })
      }
    }
    
    // Parse and validate query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    // Parse arrays and numbers from query params
    const parsedParams = {
      ...queryParams,
      userId: userId, // Force the userId to match the route parameter
      status: queryParams.status?.split(',') || undefined,
      page: queryParams.page ? parseInt(queryParams.page) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
      isActive: queryParams.isActive ? queryParams.isActive === 'true' : undefined,
      isOverdue: queryParams.isOverdue ? queryParams.isOverdue === 'true' : undefined,
      assignedFrom: queryParams.assignedFrom ? new Date(queryParams.assignedFrom) : undefined,
      assignedTo: queryParams.assignedTo ? new Date(queryParams.assignedTo) : undefined,
      expectedReturnFrom: queryParams.expectedReturnFrom ? new Date(queryParams.expectedReturnFrom) : undefined,
      expectedReturnTo: queryParams.expectedReturnTo ? new Date(queryParams.expectedReturnTo) : undefined,
    }
    
    const filters = assignmentFiltersSchema.parse(parsedParams)
    
    // Build complex query with joins
    const baseQuery = db
      .select({
        // Assignment details
        assignmentId: assetAssignments.id,
        assignmentStatus: assetAssignments.status,
        assignedAt: assetAssignments.assignedAt,
        expectedReturnAt: assetAssignments.expectedReturnAt,
        returnedAt: assetAssignments.returnedAt,
        actualReturnCondition: assetAssignments.actualReturnCondition,
        purpose: assetAssignments.purpose,
        notes: assetAssignments.notes,
        returnNotes: assetAssignments.returnNotes,
        isActive: assetAssignments.isActive,
        
        // Asset details
        assetId: assets.id,
        assetTag: assets.assetTag,
        assetName: assets.name,
        assetCategory: assets.category,
        assetStatus: assets.status,
        assetCondition: assets.condition,
        assetModel: assets.model,
        assetManufacturer: assets.manufacturer,
        assetSerialNumber: assets.serialNumber,
        
        // Asset location
        building: assets.building,
        floor: assets.floor,
        room: assets.room,
        desk: assets.desk,
        
        // Timestamps
        createdAt: assetAssignments.createdAt,
        updatedAt: assetAssignments.updatedAt,
      })
      .from(assetAssignments)
      .innerJoin(assets, eq(assetAssignments.assetId, assets.id))
      .innerJoin(userTable, eq(assetAssignments.userId, userTable.id))
      .where(and(
        eq(assetAssignments.userId, userId),
        eq(assets.isDeleted, false)
      ))
    
    // Build additional where conditions based on filters
    const whereConditions = [
      eq(assetAssignments.userId, userId),
      eq(assets.isDeleted, false)
    ]
    
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      whereConditions.push(inArray(assetAssignments.status, statuses))
    }
    
    // Active status filter
    if (filters.isActive !== undefined) {
      whereConditions.push(eq(assetAssignments.isActive, filters.isActive))
    }
    
         // Overdue filter
     if (filters.isOverdue !== undefined) {
       const currentDate = new Date()
       if (filters.isOverdue) {
         whereConditions.push(
           and(
             eq(assetAssignments.status, 'active'),
             lte(assetAssignments.expectedReturnAt, currentDate)
           )!
         )
       } else {
         whereConditions.push(
           or(
             eq(assetAssignments.status, 'returned'),
             gte(assetAssignments.expectedReturnAt, currentDate),
             sql`${assetAssignments.expectedReturnAt} IS NULL`
           )!
         )
       }
     }
    
    // Date filters
    if (filters.assignedFrom) {
      whereConditions.push(gte(assetAssignments.assignedAt, filters.assignedFrom))
    }
    if (filters.assignedTo) {
      whereConditions.push(lte(assetAssignments.assignedAt, filters.assignedTo))
    }
    if (filters.expectedReturnFrom) {
      whereConditions.push(gte(assetAssignments.expectedReturnAt, filters.expectedReturnFrom))
    }
    if (filters.expectedReturnTo) {
      whereConditions.push(lte(assetAssignments.expectedReturnAt, filters.expectedReturnTo))
    }
    
    // Build final where clause
    const whereClause = and(...whereConditions)
    
    // Get total count
    const countQuery = db
      .select({ count: count() })
      .from(assetAssignments)
      .innerJoin(assets, eq(assetAssignments.assetId, assets.id))
      .where(whereClause)
    
    const totalCount = await dbUtils.count(() => countQuery)
    
    // Build sorting
    let orderBy = sql`${assetAssignments.assignedAt} DESC`
    if (filters.sortBy) {
      const direction = filters.sortOrder === 'desc' ? sql`DESC` : sql`ASC`
      switch (filters.sortBy) {
        case 'assignedAt':
          orderBy = sql`${assetAssignments.assignedAt} ${direction}`
          break
        case 'expectedReturnAt':
          orderBy = sql`${assetAssignments.expectedReturnAt} ${direction}`
          break
        case 'returnedAt':
          orderBy = sql`${assetAssignments.returnedAt} ${direction}`
          break
        case 'assetName':
          orderBy = sql`${assets.name} ${direction}`
          break
        case 'assetTag':
          orderBy = sql`${assets.assetTag} ${direction}`
          break
        case 'status':
          orderBy = sql`${assetAssignments.status} ${direction}`
          break
        default:
          orderBy = sql`${assetAssignments.assignedAt} DESC`
      }
    }
    
    // Execute paginated query
    const offset = (filters.page - 1) * filters.limit
    const assignmentsQuery = db
      .select({
        // Assignment details
        assignmentId: assetAssignments.id,
        assignmentStatus: assetAssignments.status,
        assignedAt: assetAssignments.assignedAt,
        expectedReturnAt: assetAssignments.expectedReturnAt,
        returnedAt: assetAssignments.returnedAt,
        actualReturnCondition: assetAssignments.actualReturnCondition,
        purpose: assetAssignments.purpose,
        notes: assetAssignments.notes,
        returnNotes: assetAssignments.returnNotes,
        isActive: assetAssignments.isActive,
        
        // Asset details
        assetId: assets.id,
        assetTag: assets.assetTag,
        assetName: assets.name,
        assetCategory: assets.category,
        assetStatus: assets.status,
        assetCondition: assets.condition,
        assetModel: assets.model,
        assetManufacturer: assets.manufacturer,
        assetSerialNumber: assets.serialNumber,
        
        // Asset location
        building: assets.building,
        floor: assets.floor,
        room: assets.room,
        desk: assets.desk,
        
        // Timestamps
        createdAt: assetAssignments.createdAt,
        updatedAt: assetAssignments.updatedAt,
      })
      .from(assetAssignments)
      .innerJoin(assets, eq(assetAssignments.assetId, assets.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
    
    const assignmentsData = await dbUtils.findMany(() => assignmentsQuery, 'Failed to fetch user assets')
    
    // Calculate statistics
    const statsQuery = db
      .select({
        status: assetAssignments.status,
        count: count(),
      })
      .from(assetAssignments)
      .innerJoin(assets, eq(assetAssignments.assetId, assets.id))
      .where(and(
        eq(assetAssignments.userId, userId),
        eq(assets.isDeleted, false)
      ))
      .groupBy(assetAssignments.status)
    
    const stats = await dbUtils.findMany(() => statsQuery, 'Failed to fetch statistics')
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / filters.limit)
    
    return NextResponse.json({
      success: true,
      data: assignmentsData,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      },
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        department: targetUser.department,
      },
      statistics: stats.reduce((acc, stat) => {
        acc[stat.status] = stat.count
        return acc
      }, {} as Record<string, number>),
      filters: filters,
      permissions: {
        canViewAllUsers,
        isOwnProfile,
      },
    })
    
  } catch (error: any) {
    console.error(`GET /api/users/${params.id}/assets error:`, error)
    
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
    
    if (error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    }, { status: 500 })
  }
} 