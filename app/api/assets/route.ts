import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { assets } from '@/lib/db/schema'
import { 
  createAssetSchema, 
  assetFiltersSchema,
  type CreateAsset,
  type AssetFilters 
} from '@/lib/validations'
import { dbUtils, handleDatabaseError } from '@/lib/db/utils'
import { requireAuth, requireRole } from '@/lib/auth'
import { eq, and, or, like, gte, lte, inArray, sql, count } from 'drizzle-orm'

// ============================================================================
// GET /api/assets - List assets with filtering and pagination
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    await requireAuth()
    
    // Parse and validate query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    // Parse arrays and numbers from query params
    const parsedParams = {
      ...queryParams,
      category: queryParams.category?.split(',') || undefined,
      status: queryParams.status?.split(',') || undefined,
      condition: queryParams.condition?.split(',') || undefined,
      page: queryParams.page ? parseInt(queryParams.page) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
      isAssigned: queryParams.isAssigned ? queryParams.isAssigned === 'true' : undefined,
      purchaseDateFrom: queryParams.purchaseDateFrom ? new Date(queryParams.purchaseDateFrom) : undefined,
      purchaseDateTo: queryParams.purchaseDateTo ? new Date(queryParams.purchaseDateTo) : undefined,
      warrantyExpiryFrom: queryParams.warrantyExpiryFrom ? new Date(queryParams.warrantyExpiryFrom) : undefined,
      warrantyExpiryTo: queryParams.warrantyExpiryTo ? new Date(queryParams.warrantyExpiryTo) : undefined,
    }
    
    const filters = assetFiltersSchema.parse(parsedParams)
    
    // Build base query
    const baseQuery = db
      .select()
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
      whereConditions.push(inArray(assets.category, categories))
    }
    
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      whereConditions.push(inArray(assets.status, statuses))
    }
    
    // Condition filter
    if (filters.condition) {
      const conditions = Array.isArray(filters.condition) ? filters.condition : [filters.condition]
      whereConditions.push(inArray(assets.condition, conditions))
    }
    
    // Manufacturer filter
    if (filters.manufacturer) {
      whereConditions.push(eq(assets.manufacturer, filters.manufacturer))
    }
    
    // Location filters
    if (filters.building) {
      whereConditions.push(eq(assets.building, filters.building))
    }
    if (filters.floor) {
      whereConditions.push(eq(assets.floor, filters.floor))
    }
    if (filters.room) {
      whereConditions.push(eq(assets.room, filters.room))
    }
    
    // Date filters
    if (filters.purchaseDateFrom) {
      whereConditions.push(gte(assets.purchaseDate, filters.purchaseDateFrom))
    }
    if (filters.purchaseDateTo) {
      whereConditions.push(lte(assets.purchaseDate, filters.purchaseDateTo))
    }
    if (filters.warrantyExpiryFrom) {
      whereConditions.push(gte(assets.warrantyExpiry, filters.warrantyExpiryFrom))
    }
    if (filters.warrantyExpiryTo) {
      whereConditions.push(lte(assets.warrantyExpiry, filters.warrantyExpiryTo))
    }
    
    // Assignment filter (requires subquery)
    if (filters.isAssigned !== undefined) {
      const assignmentSubquery = db
        .select({ assetId: sql`asset_id` })
        .from(sql`asset_assignments`)
        .where(sql`status = 'active'`)
      
      if (filters.isAssigned) {
        whereConditions.push(sql`${assets.id} IN (${assignmentSubquery})`)
      } else {
        whereConditions.push(sql`${assets.id} NOT IN (${assignmentSubquery})`)
      }
    }
    
    // Assigned to filter
    if (filters.assignedTo) {
      const assignedSubquery = db
        .select({ assetId: sql`asset_id` })
        .from(sql`asset_assignments`)
        .where(sql`user_id = ${filters.assignedTo} AND status = 'active'`)
      
      whereConditions.push(sql`${assets.id} IN (${assignedSubquery})`)
    }
    
    // Build final where clause
    const whereClause = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0]
    
    // Get total count
    const countQuery = db
      .select({ count: count() })
      .from(assets)
      .where(whereClause)
    
    const totalCount = await dbUtils.count(() => countQuery)
    
    // Build sorting
    let orderBy = sql`${assets.createdAt} DESC`
    if (filters.sortBy) {
      const direction = filters.sortOrder === 'desc' ? sql`DESC` : sql`ASC`
      switch (filters.sortBy) {
        case 'name':
          orderBy = sql`${assets.name} ${direction}`
          break
        case 'assetTag':
          orderBy = sql`${assets.assetTag} ${direction}`
          break
        case 'category':
          orderBy = sql`${assets.category} ${direction}`
          break
        case 'status':
          orderBy = sql`${assets.status} ${direction}`
          break
        case 'createdAt':
          orderBy = sql`${assets.createdAt} ${direction}`
          break
        case 'updatedAt':
          orderBy = sql`${assets.updatedAt} ${direction}`
          break
        default:
          orderBy = sql`${assets.createdAt} DESC`
      }
    }
    
    // Execute paginated query
    const offset = (filters.page - 1) * filters.limit
    const assetsQuery = db
      .select()
      .from(assets)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
    
    const assetsData = await dbUtils.findMany(() => assetsQuery, 'Failed to fetch assets')
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / filters.limit)
    
    return NextResponse.json({
      success: true,
      data: assetsData,
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
    console.error('GET /api/assets error:', error)
    
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

// ============================================================================
// POST /api/assets - Create new asset
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()
    
    // Check permissions - only admin and above can create assets
    await requireRole('admin')
    
    // Parse and validate request body
    const body = await request.json()
    const assetData = createAssetSchema.parse(body)
    
    // Create asset in database
    const newAsset = await dbUtils.create(
      () => db
        .insert(assets)
        .values({
          ...assetData,
          createdBy: session.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning(),
      'asset'
    )
    
    return NextResponse.json({
      success: true,
      data: newAsset,
      message: 'Asset created successfully',
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('POST /api/assets error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid asset data',
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
    
    if (error.message.includes('already exists')) {
      return NextResponse.json({
        success: false,
        error: 'Asset tag already exists',
      }, { status: 409 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    }, { status: 500 })
  }
} 