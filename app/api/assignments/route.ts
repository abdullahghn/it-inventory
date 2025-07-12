import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { assetAssignments, assets, user as userTable } from '@/lib/db/schema'
import { dbUtils } from '@/lib/db/utils'
import { requireAuth, hasRole, getCurrentUser, requireRole } from '@/lib/auth'
import { eq, and, or, gte, lte, inArray, count, desc, asc } from 'drizzle-orm'

// Validation schema for assignment filters
const assignmentFiltersSchema = z.object({
  userId: z.string().optional(),
  assetId: z.number().int().positive().optional(),
  status: z.union([z.enum(['active', 'returned', 'overdue', 'lost']), z.array(z.enum(['active', 'returned', 'overdue', 'lost']))]).optional(),
  assignedBy: z.string().optional(),
  assignedFrom: z.coerce.date().optional(),
  assignedTo: z.coerce.date().optional(),
  returnedFrom: z.coerce.date().optional(),
  returnedTo: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  isOverdue: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    await requireAuth()
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Current user not found',
      }, { status: 404 })
    }
    
    // Parse and validate query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    // Parse arrays and numbers from query params
    const parsedParams = {
      ...queryParams,
      userId: queryParams.userId || undefined,
      assetId: queryParams.assetId ? parseInt(queryParams.assetId) : undefined,
      status: queryParams.status?.split(',') || undefined,
      assignedBy: queryParams.assignedBy || undefined,
      assignedFrom: queryParams.assignedFrom ? new Date(queryParams.assignedFrom) : undefined,
      assignedTo: queryParams.assignedTo ? new Date(queryParams.assignedTo) : undefined,
      returnedFrom: queryParams.returnedFrom ? new Date(queryParams.returnedFrom) : undefined,
      returnedTo: queryParams.returnedTo ? new Date(queryParams.returnedTo) : undefined,
      isActive: queryParams.isActive ? queryParams.isActive === 'true' : undefined,
      isOverdue: queryParams.isOverdue ? queryParams.isOverdue === 'true' : undefined,
      search: queryParams.search || undefined,
      page: queryParams.page ? parseInt(queryParams.page) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
      sortBy: queryParams.sortBy || undefined,
      sortOrder: queryParams.sortOrder || 'desc',
    }
    
    const filters = assignmentFiltersSchema.parse(parsedParams)
    
    // RBAC: Check permissions for assignment listing
    const canViewAllAssignments = await hasRole('manager')
    const isOwnRequest = filters.userId === currentUser.id
    
    // Regular users can only view their own assignments
    if (!canViewAllAssignments && !isOwnRequest) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to view assignments',
      }, { status: 403 })
    }
    
    // Build where conditions
    const whereConditions = []
    
    // User filter - regular users can only see their own assignments
    if (filters.userId) {
      if (!canViewAllAssignments && filters.userId !== currentUser.id) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient permissions to view other users\' assignments',
        }, { status: 403 })
      }
      whereConditions.push(eq(assetAssignments.userId, filters.userId))
    } else if (!canViewAllAssignments) {
      // Regular users must filter by their own user ID
      whereConditions.push(eq(assetAssignments.userId, currentUser.id))
    }
    
    // Asset filter
    if (filters.assetId) {
      whereConditions.push(eq(assetAssignments.assetId, filters.assetId))
    }
    
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      whereConditions.push(inArray(assetAssignments.status, statuses))
    }
    
    // Assigned by filter
    if (filters.assignedBy) {
      whereConditions.push(eq(assetAssignments.assignedBy, filters.assignedBy))
    }
    
    // Date filters
    if (filters.assignedFrom) {
      whereConditions.push(gte(assetAssignments.assignedAt, filters.assignedFrom))
    }
    if (filters.assignedTo) {
      whereConditions.push(lte(assetAssignments.assignedAt, filters.assignedTo))
    }
    if (filters.returnedFrom) {
      whereConditions.push(gte(assetAssignments.returnedAt, filters.returnedFrom))
    }
    if (filters.returnedTo) {
      whereConditions.push(lte(assetAssignments.returnedAt, filters.returnedTo))
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
            gte(assetAssignments.expectedReturnAt, currentDate)
          )!
        )
      }
    }
    
    // Build final where clause
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined
    
    // Get total count
    const countQuery = db
      .select({ count: count() })
      .from(assetAssignments)
      .where(whereClause)
    
    const totalCount = await dbUtils.count(() => countQuery)
    
    // Build sorting
    let orderBy = desc(assetAssignments.assignedAt)
    if (filters.sortBy) {
      const direction = filters.sortOrder === 'desc' ? desc : asc
      switch (filters.sortBy) {
        case 'assignedAt':
          orderBy = direction(assetAssignments.assignedAt)
          break
        case 'returnedAt':
          orderBy = direction(assetAssignments.returnedAt)
          break
        case 'status':
          orderBy = direction(assetAssignments.status)
          break
        default:
          orderBy = desc(assetAssignments.assignedAt)
      }
    }
    
    // Execute paginated query
    const offset = (filters.page - 1) * filters.limit
    const assignmentsQuery = db
      .select({
        // Assignment details
        id: assetAssignments.id,
        assetId: assetAssignments.assetId,
        userId: assetAssignments.userId,
        status: assetAssignments.status,
        assignedAt: assetAssignments.assignedAt,
        expectedReturnAt: assetAssignments.expectedReturnAt,
        returnedAt: assetAssignments.returnedAt,
        actualReturnCondition: assetAssignments.actualReturnCondition,
        purpose: assetAssignments.purpose,
        notes: assetAssignments.notes,
        returnNotes: assetAssignments.returnNotes,
        assignedBy: assetAssignments.assignedBy,
        returnedBy: assetAssignments.returnedBy,
        isActive: assetAssignments.isActive,
        createdAt: assetAssignments.createdAt,
        updatedAt: assetAssignments.updatedAt,
      })
      .from(assetAssignments)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
    
    const assignmentsData = await dbUtils.findMany(() => assignmentsQuery, 'Failed to fetch assignments')
    
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
    })
    
  } catch (error: any) {
    console.error('GET /api/assignments error:', error)
    
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
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch assignments',
      message: error.message,
    }, { status: 500 })
  }
} 

// ============================================================================
// POST /api/assignments - Create new assignment
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    await requireAuth()
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Current user not found',
      }, { status: 404 })
    }
    
    // Check permissions - only manager and above can create assignments
    await requireRole('manager')
    
    // Parse and validate request body
    const body = await request.json()
    const { createAssignmentSchema } = await import('@/lib/validations')
    const validatedData = createAssignmentSchema.parse(body)
    
    // Check if asset exists and is not currently assigned
    const asset = await dbUtils.findOne(
      () => db
        .select({
          id: assets.id,
          name: assets.name,
          status: assets.status,
          assetTag: assets.assetTag,
        })
        .from(assets)
        .where(and(
          eq(assets.id, validatedData.assetId),
          eq(assets.isDeleted, false)
        ))
        .limit(1),
      'Asset',
      validatedData.assetId
    )
    
    // Check if user exists and is active
    const targetUser = await dbUtils.findOne(
      () => db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          isActive: userTable.isActive,
        })
        .from(userTable)
        .where(eq(userTable.id, validatedData.userId))
        .limit(1),
      'User',
      validatedData.userId
    )
    
    if (!targetUser.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Cannot assign asset to inactive user',
      }, { status: 400 })
    }
    
    // Check if asset is already assigned
    const existingAssignment = await db
      .select()
      .from(assetAssignments)
      .where(and(
        eq(assetAssignments.assetId, validatedData.assetId),
        eq(assetAssignments.status, 'active')
      ))
      .limit(1)
    
    if (existingAssignment.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Asset is already assigned to another user',
      }, { status: 409 })
    }
    
    // Start transaction to create assignment
    const result = await db.transaction(async (tx) => {
      // Create assignment record
      const assignment = await tx.insert(assetAssignments).values({
        assetId: validatedData.assetId,
        userId: validatedData.userId,
        notes: validatedData.notes || null,
        assignedAt: new Date(),
        expectedReturnAt: validatedData.expectedReturnAt || null,
        purpose: validatedData.purpose || null,
        assignedBy: currentUser.id,
        status: 'active',
        isActive: true,
      }).returning()
      
      // Update asset status to assigned
      await tx.update(assets)
        .set({ 
          status: 'assigned', 
          updatedAt: new Date() 
        })
        .where(eq(assets.id, validatedData.assetId))
      
      return assignment[0]
    })
    
    // Get full assignment details with user and asset info
    const assignmentWithDetails = await db
      .select({
        id: assetAssignments.id,
        assetId: assetAssignments.assetId,
        userId: assetAssignments.userId,
        assignedAt: assetAssignments.assignedAt,
        expectedReturnAt: assetAssignments.expectedReturnAt,
        notes: assetAssignments.notes,
        purpose: assetAssignments.purpose,
        assignedBy: assetAssignments.assignedBy,
        isActive: assetAssignments.isActive,
        assetName: assets.name,
        assetTag: assets.assetTag,
        userName: userTable.name,
        userEmail: userTable.email,
      })
      .from(assetAssignments)
      .innerJoin(assets, eq(assetAssignments.assetId, assets.id))
      .innerJoin(userTable, eq(assetAssignments.userId, userTable.id))
      .where(eq(assetAssignments.id, result.id))
      .limit(1)
    
    return NextResponse.json({
      success: true,
      data: assignmentWithDetails[0],
      message: `Asset ${asset.assetTag} successfully assigned to ${targetUser.name}`,
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('POST /api/assignments error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid assignment data',
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
    
    if (error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Asset or user not found',
      }, { status: 404 })
    }
    
    if (error.message.includes('already assigned')) {
      return NextResponse.json({
        success: false,
        error: 'Asset is already assigned to another user',
      }, { status: 409 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    }, { status: 500 })
  }
} 