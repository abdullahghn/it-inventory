import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { assets, assetAssignments, user as userTable } from '@/lib/db/schema'
import { dbUtils } from '@/lib/db/utils'
import { requireAuth, requireRole, getCurrentUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

// Validation schema for assignment request
const assignAssetSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  notes: z.string().optional(),
  expectedReturnAt: z.string().datetime().optional(),
  purpose: z.string().max(255).optional(),
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
    
    // Check permissions - only manager and above can assign assets
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
    const validatedData = assignAssetSchema.parse(body)
    
    // Check if asset exists and is available
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
    
    // Check if asset is available for assignment
    if (asset.status !== 'available') {
      return NextResponse.json({
        success: false,
        error: `Asset is not available for assignment. Current status: ${asset.status}`,
      }, { status: 400 })
    }
    
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
        eq(assetAssignments.assetId, assetId),
        eq(assetAssignments.isActive, true)
      ))
      .limit(1)
    
    if (existingAssignment.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Asset is already assigned to another user',
      }, { status: 409 })
    }
    
    // Start transaction to assign asset
    const result = await db.transaction(async (tx) => {
      // Create assignment record
      const assignment = await tx.insert(assetAssignments).values({
        assetId: assetId,
        userId: validatedData.userId,
        notes: validatedData.notes || null,
        assignedAt: new Date(),
        expectedReturnAt: validatedData.expectedReturnAt ? new Date(validatedData.expectedReturnAt) : null,
        purpose: validatedData.purpose || null,
        assignedBy: currentUser.id,
        isActive: true,
      }).returning()
      
      // Update asset status to assigned
      await tx.update(assets)
        .set({ 
          status: 'assigned', 
          updatedAt: new Date() 
        })
        .where(eq(assets.id, assetId))
      
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
    })
    
  } catch (error: any) {
    const { id: assetIdForLog } = await params
    console.error(`POST /api/assets/${assetIdForLog}/assign error:`, error)
    
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
        error: 'Asset or user not found',
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to assign asset',
      message: error.message,
    }, { status: 500 })
  }
} 