'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { assets } from '@/lib/db/schema'
import { createAssetSchema, updateAssetSchema } from '@/lib/validations'
import { eq, and, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'

/**
 * Creates a new asset with comprehensive validation and audit logging
 * Aligns with PRD requirements for asset lifecycle management
 */
export async function createAsset(data: any) {
  try {
    // Validate input data using Zod schema
    const validatedData = createAssetSchema.parse(data)
    
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check user permissions - only admin, IT staff, and managers can create assets
    const allowedRoles = ['super_admin', 'admin', 'manager']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions: Only administrators and managers can create assets')
    }

    // Check for duplicate asset tag (case-insensitive)
    const existingAsset = await db.query.assets.findFirst({
      where: and(
        eq(assets.assetTag, validatedData.assetTag.toUpperCase()),
        eq(assets.isDeleted, false)
      ),
    })
    
    if (existingAsset) {
      throw new Error(`Asset tag '${validatedData.assetTag}' already exists`)
    }

    // Validate asset tag format (IT-CAT-0001 format as per PRD)
    const assetTagPattern = /^IT-[A-Z]{2,3}-\d{4}$/
    if (!assetTagPattern.test(validatedData.assetTag)) {
      throw new Error('Asset tag must follow format: IT-CAT-0001 (e.g., IT-LAP-0001)')
    }

    // Prepare asset data for database insertion
    const assetData = {
      assetTag: validatedData.assetTag.toUpperCase(), // Normalize to uppercase
      name: validatedData.name.trim(),
      category: validatedData.category,
      subcategory: validatedData.subcategory?.trim() || null,
      serialNumber: validatedData.serialNumber?.trim() || null,
      model: validatedData.model?.trim() || null,
      manufacturer: validatedData.manufacturer?.trim() || null,
      specifications: validatedData.specifications || null,
      status: validatedData.status,
      condition: validatedData.condition,
      purchaseDate: validatedData.purchaseDate || null,
      purchasePrice: validatedData.purchasePrice ? validatedData.purchasePrice.toString() : null,
      currentValue: validatedData.currentValue ? validatedData.currentValue.toString() : null,
      depreciationRate: validatedData.depreciationRate ? validatedData.depreciationRate.toString() : null,
      warrantyExpiry: validatedData.warrantyExpiry || null,
      building: validatedData.building?.trim() || null,
      floor: validatedData.floor?.trim() || null,
      room: validatedData.room?.trim() || null,
      desk: validatedData.desk?.trim() || null,
      locationNotes: validatedData.locationNotes?.trim() || null,
      description: validatedData.description?.trim() || null,
      notes: validatedData.notes?.trim() || null,
      createdBy: session.user.id,
      isDeleted: false,
    }

    // Insert asset into database with transaction
    const [newAsset] = await db.insert(assets).values(assetData).returning()

    // Log comprehensive audit trail
    await logAuditTrail({
      action: 'create' as const,
      entityType: 'asset',
      entityId: newAsset.id.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      newValues: assetData,
      description: `Asset ${validatedData.assetTag} created by ${session.user.name}`,
    })

    // Revalidate cache for all related pages
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')
    revalidatePath('/api/assets')

    return {
      success: true,
      asset: newAsset,
      message: `Asset ${validatedData.assetTag} created successfully`
    }
  } catch (error) {
    console.error('Asset creation error:', error)
    
    // Return structured error response
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        field: getErrorField(error.message)
      }
    }
    
    return {
      success: false,
      error: 'Failed to create asset due to an unexpected error'
    }
  }
}

/**
 * Updates an existing asset with comprehensive validation and audit logging
 * Supports partial updates and maintains data integrity
 */
export async function updateAsset(data: any) {
  try {
    // Validate input data using Zod schema
    const validatedData = updateAssetSchema.parse(data)
    
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check user permissions - only admin, IT staff, and managers can update assets
    const allowedRoles = ['super_admin', 'admin', 'manager']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions: Only administrators and managers can update assets')
    }

    // Check if asset exists and get current values for audit trail
    const existingAsset = await db.query.assets.findFirst({
      where: and(
        eq(assets.id, validatedData.id),
        eq(assets.isDeleted, false)
      ),
    })
    
    if (!existingAsset) {
      throw new Error('Asset not found or has been deleted')
    }

    // Check for duplicate asset tag (if changed) - case-insensitive
    if (validatedData.assetTag && validatedData.assetTag !== existingAsset.assetTag) {
      const duplicateAsset = await db.query.assets.findFirst({
        where: and(
          eq(assets.assetTag, validatedData.assetTag.toUpperCase()),
          eq(assets.isDeleted, false)
        ),
      })
      
      if (duplicateAsset) {
        throw new Error(`Asset tag '${validatedData.assetTag}' already exists`)
      }
    }

    // Validate asset tag format if provided
    if (validatedData.assetTag) {
      const assetTagPattern = /^IT-[A-Z]{2,3}-\d{4}$/
      if (!assetTagPattern.test(validatedData.assetTag)) {
        throw new Error('Asset tag must follow format: IT-CAT-0001 (e.g., IT-LAP-0001)')
      }
    }

    // Prepare update data with proper data cleaning
    const updateData: any = {
      assetTag: validatedData.assetTag ? validatedData.assetTag.toUpperCase() : existingAsset.assetTag,
      name: validatedData.name ? validatedData.name.trim() : existingAsset.name,
      category: validatedData.category || existingAsset.category,
      subcategory: validatedData.subcategory?.trim() || null,
      serialNumber: validatedData.serialNumber?.trim() || null,
      model: validatedData.model?.trim() || null,
      manufacturer: validatedData.manufacturer?.trim() || null,
      specifications: validatedData.specifications || null,
      status: validatedData.status || existingAsset.status,
      condition: validatedData.condition || existingAsset.condition,
      purchaseDate: validatedData.purchaseDate || null,
      purchasePrice: validatedData.purchasePrice ? validatedData.purchasePrice.toString() : null,
      currentValue: validatedData.currentValue ? validatedData.currentValue.toString() : null,
      depreciationRate: validatedData.depreciationRate ? validatedData.depreciationRate.toString() : null,
      warrantyExpiry: validatedData.warrantyExpiry || null,
      building: validatedData.building?.trim() || null,
      floor: validatedData.floor?.trim() || null,
      room: validatedData.room?.trim() || null,
      desk: validatedData.desk?.trim() || null,
      locationNotes: validatedData.locationNotes?.trim() || null,
      description: validatedData.description?.trim() || null,
      notes: validatedData.notes?.trim() || null,
      updatedAt: new Date(),
    }

    // Update asset in database
    const [updatedAsset] = await db
      .update(assets)
      .set(updateData)
      .where(eq(assets.id, validatedData.id))
      .returning()

    // Calculate changed fields for audit trail
    const changedFields = getChangedFields(existingAsset, updateData)

    // Log comprehensive audit trail
    await logAuditTrail({
      action: 'update' as const,
      entityType: 'asset',
      entityId: validatedData.id.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      oldValues: existingAsset,
      newValues: updateData,
      changedFields,
      description: `Asset ${validatedData.assetTag || existingAsset.assetTag} updated by ${session.user.name}`,
    })

    // Revalidate cache for all related pages
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/assets/${validatedData.id}`)
    revalidatePath('/api/assets')

    return {
      success: true,
      asset: updatedAsset,
      message: `Asset ${validatedData.assetTag || existingAsset.assetTag} updated successfully`,
      changedFields
    }
  } catch (error) {
    console.error('Asset update error:', error)
    
    // Return structured error response
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        field: getErrorField(error.message)
      }
    }
    
    return {
      success: false,
      error: 'Failed to update asset due to an unexpected error'
    }
  }
}

/**
 * Deletes an asset (soft delete) with comprehensive validation and audit logging
 * Prevents deletion of assigned assets and maintains referential integrity
 */
export async function deleteAsset(assetId: number) {
  try {
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check user permissions - only admin and super_admin can delete assets
    const allowedRoles = ['super_admin', 'admin']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions: Only administrators can delete assets')
    }

    // Check if asset exists and get current values
    const existingAsset = await db.query.assets.findFirst({
      where: and(
        eq(assets.id, assetId),
        eq(assets.isDeleted, false)
      ),
    })
    
    if (!existingAsset) {
      throw new Error('Asset not found or has already been deleted')
    }

    // Check if asset is currently assigned (prevent deletion of assigned assets)
    const { assetAssignments } = await import('@/lib/db/schema')
    const activeAssignment = await db.query.assetAssignments.findFirst({
      where: and(
        eq(assetAssignments.assetId, assetId),
        eq(assetAssignments.isActive, true)
      ),
    })
    
    if (activeAssignment) {
      throw new Error('Cannot delete asset that is currently assigned to a user. Please return the asset first.')
    }

    // Check if asset has any maintenance records
    const { maintenanceRecords } = await import('@/lib/db/schema')
    const maintenanceRecord = await db.query.maintenanceRecords.findFirst({
      where: eq(maintenanceRecords.assetId, assetId),
    })
    
    if (maintenanceRecord) {
      throw new Error('Cannot delete asset that has maintenance records. Please archive the asset instead.')
    }

    // Soft delete asset (mark as deleted instead of physical deletion)
    const [deletedAsset] = await db
      .update(assets)
      .set({ 
        isDeleted: true, 
        updatedAt: new Date()
      })
      .where(eq(assets.id, assetId))
      .returning()

    // Log comprehensive audit trail
    await logAuditTrail({
      action: 'delete' as const,
      entityType: 'asset',
      entityId: assetId.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      oldValues: existingAsset,
      description: `Asset ${existingAsset.assetTag} deleted by ${session.user.name}`,
    })

    // Revalidate cache for all related pages
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')
    revalidatePath('/api/assets')

    return {
      success: true,
      asset: deletedAsset,
      message: `Asset ${existingAsset.assetTag} deleted successfully`
    }
  } catch (error) {
    console.error('Asset deletion error:', error)
    
    // Return structured error response
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: false,
      error: 'Failed to delete asset due to an unexpected error'
    }
  }
}

/**
 * Bulk operations for assets - supports bulk update, delete, and status changes
 * Implements progress tracking and rollback capabilities as per PRD
 */
export async function bulkAssetOperations(operation: string, assetIds: number[], data?: any) {
  try {
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check user permissions for bulk operations
    const allowedRoles = ['super_admin', 'admin', 'manager']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions: Only administrators and managers can perform bulk operations')
    }

    // Validate operation type
    const validOperations = ['update', 'delete', 'status_change', 'category_change', 'location_change']
    if (!validOperations.includes(operation)) {
      throw new Error(`Invalid operation: ${operation}. Valid operations are: ${validOperations.join(', ')}`)
    }

    // Validate asset IDs
    if (!assetIds || assetIds.length === 0) {
      throw new Error('No asset IDs provided for bulk operation')
    }

    // Limit bulk operations to 100 assets as per PRD
    if (assetIds.length > 100) {
      throw new Error('Bulk operations are limited to 100 assets at a time')
    }

    // Verify all assets exist and are accessible
    const existingAssets = await db.query.assets.findMany({
      where: and(
        inArray(assets.id, assetIds),
        eq(assets.isDeleted, false)
      ),
    })

    if (existingAssets.length !== assetIds.length) {
      throw new Error(`Some assets not found. Expected ${assetIds.length}, found ${existingAssets.length}`)
    }

    const results = {
      success: true,
      totalAssets: assetIds.length,
      processedAssets: 0,
      successfulAssets: 0,
      failedAssets: 0,
      errors: [] as any[],
      operation,
      timestamp: new Date().toISOString(),
    }

    // Process each asset based on operation type
    for (const assetId of assetIds) {
      try {
        results.processedAssets++

        switch (operation) {
          case 'update':
            if (!data) throw new Error('Update data required for bulk update operation')
            await bulkUpdateAsset(assetId, data, session.user.id)
            break
          
          case 'delete':
            await bulkDeleteAsset(assetId, session.user.id)
            break
          
          case 'status_change':
            if (!data?.status) throw new Error('Status required for status change operation')
            await bulkStatusChange(assetId, data.status, session.user.id)
            break
          
          case 'category_change':
            if (!data?.category) throw new Error('Category required for category change operation')
            await bulkCategoryChange(assetId, data.category, session.user.id)
            break
          
          case 'location_change':
            if (!data?.location) throw new Error('Location data required for location change operation')
            await bulkLocationChange(assetId, data.location, session.user.id)
            break
        }

        results.successfulAssets++
      } catch (error) {
        results.failedAssets++
        results.errors.push({
          assetId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Log bulk operation audit trail
    // Always use a valid enum value for action (not the dynamic operation string)
    await logAuditTrail({
      action: 'update' as const, // Always use the literal for type safety
      entityType: 'asset',
      entityId: `bulk_${operation}_${Date.now()}`,
      userId: session.user.id,
      userEmail: session.user.email,
      newValues: {
        operation,
        totalAssets: results.totalAssets,
        successfulAssets: results.successfulAssets,
        failedAssets: results.failedAssets,
        assetIds
      },
      description: `Bulk ${operation} operation on ${results.totalAssets} assets by ${session.user.name}`,
    })

    // Revalidate cache
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')
    revalidatePath('/api/assets')

    return results
  } catch (error) {
    console.error('Bulk asset operations error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform bulk operations',
      totalAssets: assetIds?.length || 0,
      processedAssets: 0,
      successfulAssets: 0,
      failedAssets: 0,
      errors: []
    }
  }
}

/**
 * Helper function to perform bulk asset updates
 */
async function bulkUpdateAsset(assetId: number, data: any, userId: string) {
  const updateData: any = {
    updatedAt: new Date(),
  }

  // Add only provided fields to update
  if (data.name) updateData.name = data.name.trim()
  if (data.category) updateData.category = data.category
  if (data.status) updateData.status = data.status
  if (data.condition) updateData.condition = data.condition
  if (data.manufacturer) updateData.manufacturer = data.manufacturer.trim()
  if (data.model) updateData.model = data.model.trim()
  if (data.notes) updateData.notes = data.notes.trim()

  await db
    .update(assets)
    .set(updateData)
    .where(eq(assets.id, assetId))
}

/**
 * Helper function to perform bulk asset deletions
 */
async function bulkDeleteAsset(assetId: number, userId: string) {
  // Check if asset is assigned
  const { assetAssignments } = await import('@/lib/db/schema')
  const activeAssignment = await db.query.assetAssignments.findFirst({
    where: and(
      eq(assetAssignments.assetId, assetId),
      eq(assetAssignments.isActive, true)
    ),
  })
  
  if (activeAssignment) {
    throw new Error('Cannot delete assigned asset')
  }

  await db
    .update(assets)
    .set({ 
      isDeleted: true, 
      updatedAt: new Date()
    })
    .where(eq(assets.id, assetId))
}

/**
 * Helper function to perform bulk status changes
 */
async function bulkStatusChange(assetId: number, status: string, userId: string) {
  // Only allow valid status values
  const validStatuses = [
    'available', 'assigned', 'maintenance', 'repair', 'retired', 'lost', 'stolen'
  ]
  if (!validStatuses.includes(status)) throw new Error('Invalid status value')
  await db
    .update(assets)
    .set({ 
      status: status as ('available' | 'assigned' | 'maintenance' | 'repair' | 'retired' | 'lost' | 'stolen'),
      updatedAt: new Date()
    })
    .where(eq(assets.id, assetId))
}

/**
 * Helper function to perform bulk category changes
 */
async function bulkCategoryChange(assetId: number, category: string, userId: string) {
  // Only allow valid category values
  const validCategories = [
    'laptop', 'desktop', 'monitor', 'printer', 'phone', 'tablet', 'server', 'network_device', 'software_license', 'toner', 'other'
  ]
  if (!validCategories.includes(category)) throw new Error('Invalid category value')
  await db
    .update(assets)
    .set({ 
      category: category as ('laptop' | 'desktop' | 'monitor' | 'printer' | 'phone' | 'tablet' | 'server' | 'network_device' | 'software_license' | 'toner' | 'other'),
      updatedAt: new Date()
    })
    .where(eq(assets.id, assetId))
}

/**
 * Helper function to perform bulk location changes
 */
async function bulkLocationChange(assetId: number, location: any, userId: string) {
  const updateData: any = {
    updatedAt: new Date(),
  }

  if (location.building) updateData.building = location.building.trim()
  if (location.floor) updateData.floor = location.floor.trim()
  if (location.room) updateData.room = location.room.trim()
  if (location.desk) updateData.desk = location.desk.trim()
  if (location.locationNotes) updateData.locationNotes = location.locationNotes.trim()

  await db
    .update(assets)
    .set(updateData)
    .where(eq(assets.id, assetId))
}

/**
 * Helper function to get changed fields for audit logging
 */
function getChangedFields(oldData: any, newData: any): string[] {
  const changedFields: string[] = []
  
  for (const key in newData) {
    if (oldData[key] !== newData[key] && key !== 'updatedAt') {
      changedFields.push(key)
    }
  }
  
  return changedFields
}

/**
 * Helper function to determine error field for form validation
 */
function getErrorField(errorMessage: string): string | null {
  const fieldMappings: { [key: string]: string } = {
    'Asset tag': 'assetTag',
    'Asset name': 'name',
    'Category': 'category',
    'Serial number': 'serialNumber',
    'Model': 'model',
    'Manufacturer': 'manufacturer',
    'Status': 'status',
    'Condition': 'condition',
    'Purchase date': 'purchaseDate',
    'Purchase price': 'purchasePrice',
    'Warranty expiry': 'warrantyExpiry',
    'Building': 'building',
    'Floor': 'floor',
    'Room': 'room',
    'Desk': 'desk',
    'Description': 'description',
    'Notes': 'notes',
  }

  for (const [errorText, field] of Object.entries(fieldMappings)) {
    if (errorMessage.includes(errorText)) {
      return field
    }
  }

  return null
}

/**
 * Comprehensive audit trail logging function
 * Tracks all asset-related actions for compliance and debugging
 */
async function logAuditTrail(data: {
  action: 'create' | 'update' | 'delete' | 'assign' | 'return' | 'maintenance' | 'login' | 'logout'
  entityType: string
  entityId: string
  userId: string
  userEmail?: string
  oldValues?: any
  newValues?: any
  changedFields?: string[]
  description: string
}) {
  try {
    // Import audit logs schema
    const { auditLogs } = await import('@/lib/db/schema')
    
    await db.insert(auditLogs).values({
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      userEmail: data.userEmail,
      oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
      newValues: data.newValues ? JSON.stringify(data.newValues) : null,
      changedFields: data.changedFields ? JSON.stringify(data.changedFields) : null,
      description: data.description,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Audit trail logging error:', error)
    // Don't throw error for audit logging failures to avoid breaking main operations
  }
} 