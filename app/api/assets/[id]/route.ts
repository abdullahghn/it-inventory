import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { assets } from '@/lib/db/schema'
import { 
  updateAssetSchema,
  type UpdateAsset 
} from '@/lib/validations'
import { dbUtils } from '@/lib/db/utils'
import { requireAuth, requireRole } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

// ============================================================================
// GET /api/assets/[id] - Get single asset by ID
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    await requireAuth()
    
    // Validate asset ID
    const { id } = await params
    const assetId = parseInt(id)
    if (isNaN(assetId) || assetId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid asset ID',
      }, { status: 400 })
    }
    
    // Fetch asset from database
    const asset = await dbUtils.findOne(
      () => db
        .select()
        .from(assets)
        .where(and(
          eq(assets.id, assetId),
          eq(assets.isDeleted, false)
        ))
        .limit(1),
      'Asset',
      assetId
    )
    
    return NextResponse.json({
      success: true,
      data: asset,
    })
    
  } catch (error: any) {
    const { id: assetIdForLog } = await params
    console.error(`GET /api/assets/${assetIdForLog} error:`, error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 })
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Asset not found',
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    }, { status: 500 })
  }
}

// ============================================================================
// PUT /api/assets/[id] - Update asset by ID
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await requireAuth()
    
    // Check permissions - only admin and above can update assets
    await requireRole('admin')
    
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
    const updateData = updateAssetSchema.parse({ ...body, id: assetId })
    
    // Remove id from update data (it's used for validation only)
    const { id: _, ...assetUpdateData } = updateData
    
    // Update asset in database
    const updatedAsset = await dbUtils.update(
      () => db
        .update(assets)
        .set({
          ...assetUpdateData,
          updatedAt: new Date(),
        })
        .where(and(
          eq(assets.id, assetId),
          eq(assets.isDeleted, false)
        ))
        .returning(),
      'Asset',
      assetId
    )
    
    return NextResponse.json({
      success: true,
      data: updatedAsset,
      message: 'Asset updated successfully',
    })
    
  } catch (error: any) {
    const { id: assetIdForLog } = await params
    console.error(`PUT /api/assets/${assetIdForLog} error:`, error)
    
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
    
    if (error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Asset not found',
      }, { status: 404 })
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

// ============================================================================
// DELETE /api/assets/[id] - Delete asset by ID (soft delete)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await requireAuth()
    
    // Check permissions - only admin and above can delete assets
    await requireRole('admin')
    
    // Validate asset ID
    const { id } = await params
    const assetId = parseInt(id)
    if (isNaN(assetId) || assetId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid asset ID',
      }, { status: 400 })
    }
    
    // Check if asset exists and is not already deleted
    const existingAsset = await dbUtils.findOne(
      () => db
        .select({ id: assets.id, status: assets.status })
        .from(assets)
        .where(and(
          eq(assets.id, assetId),
          eq(assets.isDeleted, false)
        ))
        .limit(1),
      'Asset',
      assetId
    )
    
    // Check if asset can be deleted (not currently assigned)
    if (existingAsset.status === 'assigned') {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete asset that is currently assigned',
      }, { status: 400 })
    }
    
    // Soft delete the asset
    const deletedAsset = await dbUtils.update(
      () => db
        .update(assets)
        .set({
          isDeleted: true,
          status: 'retired',
          updatedAt: new Date(),
        })
        .where(and(
          eq(assets.id, assetId),
          eq(assets.isDeleted, false)
        ))
        .returning(),
      'Asset',
      assetId
    )
    
    return NextResponse.json({
      success: true,
      data: deletedAsset,
      message: 'Asset deleted successfully',
    })
    
  } catch (error: any) {
    const { id: assetIdForLog } = await params
    console.error(`DELETE /api/assets/${assetIdForLog} error:`, error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 })
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Asset not found',
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    }, { status: 500 })
  }
} 