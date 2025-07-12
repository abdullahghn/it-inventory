import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { assets, assetAssignments, user as userTable } from '@/lib/db/schema'
import { dbUtils } from '@/lib/db/utils'
import { requireAuth, hasRole, getCurrentUser } from '@/lib/auth'
import { eq, and, or, like, gte, lte, inArray, sql, count, desc, asc, isNull, isNotNull } from 'drizzle-orm'

// Validation schema for asset assignment filters
const assetAssignmentFiltersSchema = z.object({
  status: z.union([z.enum(['available', 'assigned', 'all']), z.array(z.enum(['available', 'assigned', 'all']))]).optional(),
  category: z.union([z.enum(['laptop', 'desktop', 'monitor', 'printer', 'phone', 'tablet', 'server', 'network_device', 'software_license', 'toner', 'other']), z.array(z.enum(['laptop', 'desktop', 'monitor', 'printer', 'phone', 'tablet', 'server', 'network_device', 'software_license', 'toner', 'other']))]).optional(),
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
      status: queryParams.status?.split(',') || undefined,
      category: queryParams.category?.split(',') || undefined,
      search: queryParams.search || undefined,
      page: queryParams.page ? parseInt(queryParams.page) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
      sortBy: queryParams.sortBy || undefined,
      sortOrder: queryParams.sortOrder || 'desc',
    }
    
    const filters = assetAssignmentFiltersSchema.parse(parsedParams)
    
    // Build base query for assets
    const baseQuery = db
      .select({
        // Asset details
        id: assets.id,
        name: assets.name,
        assetTag: assets.assetTag,
        category: assets.category,
        status: assets.status,
        condition: assets.condition,
        model: assets.model,
        manufacturer: assets.manufacturer,
        serialNumber: assets.serialNumber,
        description: assets.description,
        purchaseDate: assets.purchaseDate,
        warrantyExpiry: assets.warrantyExpiry,
        building: assets.building,
        floor: assets.floor,
        room: assets.room,
        desk: assets.desk,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
      })
      .from(assets)
      .where(eq(assets.isDeleted, false))
    
    // Build where conditions
    const whereConditions = [eq(assets.isDeleted, false)]
    
    // Search filter
    if (filters.search) {
      whereConditions.push(
        or(
          like(assets.name, `%${filters.search}%`),
          like(assets.assetTag, `%${filters.search}%`),
          like(assets.serialNumber, `%${filters.search}%`),
          like(assets.manufacturer, `%${filters.search}%`),
          like(assets.model, `%${filters.search}%`)
        )!
      )
    }
    
    // Category filter
    if (filters.category) {
      const categories = Array.isArray(filters.category) ? filters.category : [filters.category]
      // Filter out 'all' and any invalid category values
      const validCategories = categories.filter(category => {
        const categoryStr = String(category)
        return categoryStr !== 'all' && 
          ['laptop', 'desktop', 'monitor', 'printer', 'phone', 'tablet', 'server', 'network_device', 'software_license', 'toner', 'other'].indexOf(categoryStr) !== -1
      })
      
      if (validCategories.length > 0) {
        whereConditions.push(inArray(assets.category, validCategories as any))
      }
    }
    
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      // Filter out 'all' and any invalid status values
      const validStatuses = statuses.filter(status => {
        const statusStr = String(status)
        return statusStr !== 'all' && 
          ['available', 'assigned', 'maintenance', 'repair', 'retired', 'lost', 'stolen'].indexOf(statusStr) !== -1
      })
      
      if (validStatuses.length > 0) {
        whereConditions.push(inArray(assets.status, validStatuses as any))
      }
    }
    
    // Build final where clause
    const whereClause = and(...whereConditions)
    
    // Get total count
    const countQuery = db
      .select({ count: count() })
      .from(assets)
      .where(whereClause)
    
    const totalCount = await dbUtils.count(() => countQuery)
    
    // Build sorting
    let orderBy = desc(assets.createdAt)
    if (filters.sortBy) {
      const direction = filters.sortOrder === 'desc' ? desc : asc
      switch (filters.sortBy) {
        case 'name':
          orderBy = direction(assets.name)
          break
        case 'assetTag':
          orderBy = direction(assets.assetTag)
          break
        case 'category':
          orderBy = direction(assets.category)
          break
        case 'status':
          orderBy = direction(assets.status)
          break
        case 'createdAt':
          orderBy = direction(assets.createdAt)
          break
        case 'updatedAt':
          orderBy = direction(assets.updatedAt)
          break
        default:
          orderBy = desc(assets.createdAt)
      }
    }
    
    // Execute paginated query
    const offset = (filters.page - 1) * filters.limit
    const assetsQuery = db
      .select({
        // Asset details
        id: assets.id,
        name: assets.name,
        assetTag: assets.assetTag,
        category: assets.category,
        status: assets.status,
        condition: assets.condition,
        model: assets.model,
        manufacturer: assets.manufacturer,
        serialNumber: assets.serialNumber,
        description: assets.description,
        purchaseDate: assets.purchaseDate,
        warrantyExpiry: assets.warrantyExpiry,
        building: assets.building,
        floor: assets.floor,
        room: assets.room,
        desk: assets.desk,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
      })
      .from(assets)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
    
    const assetsData = await dbUtils.findMany(() => assetsQuery, 'Failed to fetch assets')
    
    // For each asset, get its assignment history
    const assetsWithAssignments = await Promise.all(
      assetsData.map(async (asset) => {
        // Get current assignment (if any)
        const currentAssignment = await db
          .select({
            id: assetAssignments.id,
            userId: assetAssignments.userId,
            status: assetAssignments.status,
            assignedAt: assetAssignments.assignedAt,
            expectedReturnAt: assetAssignments.expectedReturnAt,
            returnedAt: assetAssignments.returnedAt,
            notes: assetAssignments.notes,
            purpose: assetAssignments.purpose,
            assignedBy: assetAssignments.assignedBy,
            isActive: assetAssignments.isActive,
            userName: userTable.name,
            userEmail: userTable.email,
          })
          .from(assetAssignments)
          .leftJoin(userTable, eq(assetAssignments.userId, userTable.id))
          .where(
            and(
              eq(assetAssignments.assetId, asset.id),
              eq(assetAssignments.isActive, true)
            )
          )
          .limit(1)
        
        // Get assignment history (last 5 assignments)
        const assignmentHistory = await db
          .select({
            id: assetAssignments.id,
            userId: assetAssignments.userId,
            status: assetAssignments.status,
            assignedAt: assetAssignments.assignedAt,
            returnedAt: assetAssignments.returnedAt,
            notes: assetAssignments.notes,
            purpose: assetAssignments.purpose,
            assignedBy: assetAssignments.assignedBy,
            returnedBy: assetAssignments.returnedBy,
            isActive: assetAssignments.isActive,
            userName: userTable.name,
            userEmail: userTable.email,
          })
          .from(assetAssignments)
          .leftJoin(userTable, eq(assetAssignments.userId, userTable.id))
          .where(eq(assetAssignments.assetId, asset.id))
          .orderBy(desc(assetAssignments.assignedAt))
          .limit(5)
        
        // Get total assignment count
        const assignmentCount = await db
          .select({ count: count() })
          .from(assetAssignments)
          .where(eq(assetAssignments.assetId, asset.id))
        
        return {
          ...asset,
          currentAssignment: currentAssignment[0] || null,
          assignmentHistory: assignmentHistory,
          totalAssignments: assignmentCount[0]?.count || 0,
        }
      })
    )
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / filters.limit)
    
    return NextResponse.json({
      success: true,
      data: assetsWithAssignments,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      },
      filters: filters,
    })
    
  } catch (error: any) {
    console.error('GET /api/assets/assignments error:', error)
    
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
      error: 'Internal server error',
      message: error.message,
    }, { status: 500 })
  }
} 