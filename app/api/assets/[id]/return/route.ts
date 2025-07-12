import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { assets, assetAssignments, user as userTable } from '@/lib/db/schema'
import { dbUtils } from '@/lib/db/utils'
import { requireAuth, requireRole, getCurrentUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

// Validation schema for return request
const returnAssetSchema = z.object({
  returnNotes: z.string().optional(),
  actualReturnCondition: z.enum(['excellent', 'good', 'fair', 'poor', 'damaged', 'new']).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Check permissions - only manager and above can return assets
    await requireRole('manager')
    
    // Validate asset ID
    const { id } = await params
    const assetId = parseInt(id)
    if (isNaN(assetId) || assetId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid asset ID',
      }, { status: 400 })
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = returnAssetSchema.parse(body)
    
    // Check if asset exists
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
          eq(assets.id, assetId),
          eq(assets.isDeleted, false)
        ))
        .limit(1),
      'Asset',
      assetId
    )
    
    // Check if asset is currently assigned
    if (asset.status !== 'assigned') {
      return NextResponse.json({
        success: false,
        error: `Asset is not currently assigned. Current status: ${asset.status}`,
      }, { status: 400 })
    }
    
    // Find the active assignment for this asset
    const activeAssignment = await dbUtils.findOne(
      () => db
        .select({
          id: assetAssignments.id,
          assetId: assetAssignments.assetId,
          userId: assetAssignments.userId,
          assignedAt: assetAssignments.assignedAt,
          notes: assetAssignments.notes,
          purpose: assetAssignments.purpose,
          assignedBy: assetAssignments.assignedBy,
        })
        .from(assetAssignments)
        .where(and(
          eq(assetAssignments.assetId, assetId),
          eq(assetAssignments.isActive, true)
        ))
        .limit(1),
      'Assignment',
      assetId
    )
    
    // Get user details for the assignment
    const assignedUser = await dbUtils.findOne(
      () => db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
        })
        .from(userTable)
        .where(eq(userTable.id, activeAssignment.userId))
        .limit(1),
      'User',
      activeAssignment.userId
    )
    
    // Start transaction to return asset
    const result = await db.transaction(async (tx) => {
      // Update assignment as returned
      const updatedAssignment = await tx.update(assetAssignments)
        .set({
          status: 'returned', // Automatically update status to returned
          returnedAt: new Date(),
          isActive: false,
          returnNotes: validatedData.returnNotes || null,
          actualReturnCondition: validatedData.actualReturnCondition || null,
          returnedBy: currentUser.id,
        })
        .where(eq(assetAssignments.id, activeAssignment.id))
        .returning()
      
      // Update asset status to available
      await tx.update(assets)
        .set({ 
          status: 'available', 
          updatedAt: new Date() 
        })
        .where(eq(assets.id, assetId))
      
      return updatedAssignment[0]
    })
    
    // Get full return details with user and asset info
    const returnWithDetails = await db
      .select({
        id: assetAssignments.id,
        assetId: assetAssignments.assetId,
        userId: assetAssignments.userId,
        assignedAt: assetAssignments.assignedAt,
        returnedAt: assetAssignments.returnedAt,
        notes: assetAssignments.notes,
        returnNotes: assetAssignments.returnNotes,
        actualReturnCondition: assetAssignments.actualReturnCondition,
        assignedBy: assetAssignments.assignedBy,
        returnedBy: assetAssignments.returnedBy,
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
      data: returnWithDetails[0],
      message: `Asset ${asset.assetTag} successfully returned from ${assignedUser.name}`,
    })
    
  } catch (error: any) {
    const { id: assetIdForLog } = await params
    console.error(`POST /api/assets/${assetIdForLog}/return error:`, error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
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
        error: 'Asset or assignment not found',
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to return asset',
      message: error.message,
    }, { status: 500 })
  }
} 