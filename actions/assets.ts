'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { assets } from '@/lib/db/schema'
import { createAssetSchema, updateAssetSchema } from '@/lib/validations'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

/**
 * Creates a new asset with validation and audit logging
 */
export async function createAsset(data: any) {
  try {
    // Validate input data
    const validatedData = createAssetSchema.parse(data)
    
    // Check for duplicate asset tag
    const existingAsset = await db.query.assets.findFirst({
      where: eq(assets.assetTag, validatedData.assetTag),
    })
    
    if (existingAsset) {
      throw new Error('Asset tag already exists')
    }

    // Get current user for audit trail
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Prepare asset data for database
    const assetData = {
      assetTag: validatedData.assetTag,
      name: validatedData.name,
      category: validatedData.category,
      subcategory: validatedData.subcategory || null,
      serialNumber: validatedData.serialNumber || null,
      model: validatedData.model || null,
      manufacturer: validatedData.manufacturer || null,
      specifications: validatedData.specifications || null,
      status: validatedData.status,
      condition: validatedData.condition,
      purchaseDate: validatedData.purchaseDate || null,
      purchasePrice: validatedData.purchasePrice ? validatedData.purchasePrice.toString() : null,
      currentValue: validatedData.currentValue ? validatedData.currentValue.toString() : null,
      depreciationRate: validatedData.depreciationRate ? validatedData.depreciationRate.toString() : null,
      warrantyExpiry: validatedData.warrantyExpiry || null,
      building: validatedData.building || null,
      floor: validatedData.floor || null,
      room: validatedData.room || null,
      desk: validatedData.desk || null,
      locationNotes: validatedData.locationNotes || null,
      description: validatedData.description || null,
      notes: validatedData.notes || null,
      createdBy: session.user.id,
    }

    // Insert asset into database
    const [newAsset] = await db.insert(assets).values(assetData).returning()

    // Log audit trail
    await logAuditTrail({
      action: 'create',
      entityType: 'asset',
      entityId: newAsset.id.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      newValues: assetData,
      description: `Asset ${validatedData.assetTag} created`,
    })

    // Revalidate cache
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')

    return newAsset
  } catch (error) {
    console.error('Asset creation error:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to create asset')
  }
}

/**
 * Updates an existing asset with validation and audit logging
 */
export async function updateAsset(data: any) {
  try {
    // Validate input data
    const validatedData = updateAssetSchema.parse(data)
    
    // Get current user for audit trail
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Check if asset exists and get current values
    const existingAsset = await db.query.assets.findFirst({
      where: eq(assets.id, validatedData.id),
    })
    
    if (!existingAsset) {
      throw new Error('Asset not found')
    }

    // Check for duplicate asset tag (if changed)
    if (validatedData.assetTag !== existingAsset.assetTag) {
      const duplicateAsset = await db.query.assets.findFirst({
        where: eq(assets.assetTag, validatedData.assetTag),
      })
      
      if (duplicateAsset) {
        throw new Error('Asset tag already exists')
      }
    }

    // Prepare update data
    const updateData = {
      assetTag: validatedData.assetTag,
      name: validatedData.name,
      category: validatedData.category,
      subcategory: validatedData.subcategory || null,
      serialNumber: validatedData.serialNumber || null,
      model: validatedData.model || null,
      manufacturer: validatedData.manufacturer || null,
      specifications: validatedData.specifications || null,
      status: validatedData.status,
      condition: validatedData.condition,
      purchaseDate: validatedData.purchaseDate || null,
      purchasePrice: validatedData.purchasePrice ? validatedData.purchasePrice.toString() : null,
      currentValue: validatedData.currentValue ? validatedData.currentValue.toString() : null,
      depreciationRate: validatedData.depreciationRate ? validatedData.depreciationRate.toString() : null,
      warrantyExpiry: validatedData.warrantyExpiry || null,
      building: validatedData.building || null,
      floor: validatedData.floor || null,
      room: validatedData.room || null,
      desk: validatedData.desk || null,
      locationNotes: validatedData.locationNotes || null,
      description: validatedData.description || null,
      notes: validatedData.notes || null,
      updatedAt: new Date(),
    }

    // Update asset in database
    const [updatedAsset] = await db
      .update(assets)
      .set(updateData)
      .where(eq(assets.id, validatedData.id))
      .returning()

    // Log audit trail
    await logAuditTrail({
      action: 'update',
      entityType: 'asset',
      entityId: validatedData.id.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      oldValues: existingAsset,
      newValues: updateData,
      changedFields: getChangedFields(existingAsset, updateData),
      description: `Asset ${validatedData.assetTag} updated`,
    })

    // Revalidate cache
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')

    return updatedAsset
  } catch (error) {
    console.error('Asset update error:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to update asset')
  }
}

/**
 * Deletes an asset (soft delete) with validation and audit logging
 */
export async function deleteAsset(assetId: number) {
  try {
    // Get current user for audit trail
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Check if asset exists
    const existingAsset = await db.query.assets.findFirst({
      where: eq(assets.id, assetId),
    })
    
    if (!existingAsset) {
      throw new Error('Asset not found')
    }

    // Check if asset is currently assigned
    const { assetAssignments } = await import('@/lib/db/schema')
    const activeAssignment = await db.query.assetAssignments.findFirst({
      where: eq(assetAssignments.assetId, assetId),
    })
    
    if (activeAssignment) {
      throw new Error('Cannot delete asset that is currently assigned')
    }

    // Soft delete asset
    const [deletedAsset] = await db
      .update(assets)
      .set({ 
        isDeleted: true, 
        updatedAt: new Date() 
      })
      .where(eq(assets.id, assetId))
      .returning()

    // Log audit trail
    await logAuditTrail({
      action: 'delete',
      entityType: 'asset',
      entityId: assetId.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      oldValues: existingAsset,
      description: `Asset ${existingAsset.assetTag} deleted`,
    })

    // Revalidate cache
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')

    return deletedAsset
  } catch (error) {
    console.error('Asset deletion error:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to delete asset')
  }
}

/**
 * Helper function to get changed fields for audit logging
 */
function getChangedFields(oldData: any, newData: any): string[] {
  const changedFields: string[] = []
  
  for (const key in newData) {
    if (oldData[key] !== newData[key]) {
      changedFields.push(key)
    }
  }
  
  return changedFields
}

/**
 * Helper function to log audit trail
 */
async function logAuditTrail(data: {
  action: string
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
    // Import audit logs table
    const { auditLogs } = await import('@/lib/db/schema')
    
    await db.insert(auditLogs).values({
      action: data.action as any,
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
    console.error('Audit logging error:', error)
    // Don't throw error for audit logging failures
  }
} 