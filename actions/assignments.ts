'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { assetAssignments, assets, user } from '@/lib/db/schema'
import { createAssignmentSchema, updateAssignmentSchema } from '@/lib/validations'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'

/**
 * Creates a new asset assignment with validation and audit logging
 */
export async function createAssignment(data: any) {
  try {
    // Validate input data
    const validatedData = createAssignmentSchema.parse(data)
    
    // Get current user for audit trail
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Check if asset exists and is available
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, validatedData.assetId),
    })
    
    if (!asset) {
      throw new Error('Asset not found')
    }
    
    if (asset.status !== 'available') {
      throw new Error('Asset is not available for assignment')
    }

    // Check if user exists and is active
    const assignedUser = await db.query.user.findFirst({
      where: eq(user.id, validatedData.userId),
    })
    
    if (!assignedUser) {
      throw new Error('User not found')
    }
    
    if (!assignedUser.isActive) {
      throw new Error('User account is not active')
    }

    // Check if asset is already assigned
    const existingAssignment = await db.query.assetAssignments.findFirst({
      where: and(
        eq(assetAssignments.assetId, validatedData.assetId),
        eq(assetAssignments.isActive, true)
      ),
    })
    
    if (existingAssignment) {
      throw new Error('Asset is already assigned to another user')
    }

    // Prepare assignment data
    const assignmentData = {
      assetId: validatedData.assetId,
      userId: validatedData.userId,
      purpose: validatedData.purpose || null,
      expectedReturnAt: validatedData.expectedReturnAt || null,
      notes: validatedData.notes || null,
      assignedBy: data.assignedBy || session.user.id,
      status: 'active' as const,
      isActive: true,
    }

    // Create assignment
    const [newAssignment] = await db.insert(assetAssignments).values(assignmentData).returning()

    // Update asset status to assigned
    await db
      .update(assets)
      .set({ 
        status: 'assigned',
        updatedAt: new Date() 
      })
      .where(eq(assets.id, validatedData.assetId))

    // Log audit trail
    await logAuditTrail({
      action: 'assign',
      entityType: 'assignment',
      entityId: newAssignment.id.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      newValues: assignmentData,
      description: `Asset ${asset.assetTag} assigned to ${assignedUser.name}`,
    })

    // Revalidate cache
    revalidatePath('/dashboard/assignments')
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')

    return newAssignment
  } catch (error) {
    console.error('Assignment creation error:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to create assignment')
  }
}

/**
 * Updates an existing assignment with validation and audit logging
 */
export async function updateAssignment(data: any) {
  try {
    // Validate input data
    const validatedData = updateAssignmentSchema.parse(data)
    
    // Get current user for audit trail
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Check if assignment exists
    const existingAssignment = await db.query.assetAssignments.findFirst({
      where: eq(assetAssignments.id, validatedData.id),
    })
    
    if (!existingAssignment) {
      throw new Error('Assignment not found')
    }

    // Prepare update data
    const updateData: any = {
      purpose: validatedData.purpose || null,
      expectedReturnAt: validatedData.expectedReturnAt || null,
      notes: validatedData.notes || null,
      updatedAt: new Date(),
    }

    // Handle status changes
    if (validatedData.status) {
      updateData.status = validatedData.status
      
      // If returning, set return details
      if (validatedData.status === 'returned') {
        updateData.returnedAt = validatedData.returnedAt || new Date()
        updateData.actualReturnCondition = validatedData.actualReturnCondition || null
        updateData.returnedBy = session.user.id
        updateData.isActive = false
        
        // Update asset status back to available
        await db
          .update(assets)
          .set({ 
            status: 'available',
            updatedAt: new Date() 
          })
          .where(eq(assets.id, existingAssignment.assetId))
      }
    }

    // Update assignment
    const [updatedAssignment] = await db
      .update(assetAssignments)
      .set(updateData)
      .where(eq(assetAssignments.id, validatedData.id))
      .returning()

    // Log audit trail
    await logAuditTrail({
      action: 'update',
      entityType: 'assignment',
      entityId: validatedData.id.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      oldValues: existingAssignment,
      newValues: updateData,
      changedFields: getChangedFields(existingAssignment, updateData),
      description: `Assignment ${validatedData.id} updated`,
    })

    // Revalidate cache
    revalidatePath('/dashboard/assignments')
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')

    return updatedAssignment
  } catch (error) {
    console.error('Assignment update error:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to update assignment')
  }
}

/**
 * Returns an asset assignment with validation and audit logging
 */
export async function returnAssignment(data: any) {
  try {
    // Validate input data
    const { returnAssignmentSchema } = await import('@/lib/validations')
    const validatedData = returnAssignmentSchema.parse(data)
    
    // Get current user for audit trail
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Check if assignment exists and is active
    const existingAssignment = await db.query.assetAssignments.findFirst({
      where: and(
        eq(assetAssignments.id, validatedData.assignmentId),
        eq(assetAssignments.isActive, true)
      ),
    })
    
    if (!existingAssignment) {
      throw new Error('Active assignment not found')
    }

    // Prepare return data
    const returnData = {
      status: 'returned' as const,
      returnedAt: validatedData.returnedAt,
      actualReturnCondition: validatedData.actualReturnCondition || null,
      returnNotes: validatedData.returnNotes || null,
      returnedBy: session.user.id,
      isActive: false,
      updatedAt: new Date(),
    }

    // Update assignment
    const [returnedAssignment] = await db
      .update(assetAssignments)
      .set(returnData)
      .where(eq(assetAssignments.id, validatedData.assignmentId))
      .returning()

    // Update asset status back to available
    await db
      .update(assets)
      .set({ 
        status: 'available',
        updatedAt: new Date() 
      })
      .where(eq(assets.id, existingAssignment.assetId))

    // Log audit trail
    await logAuditTrail({
      action: 'return',
      entityType: 'assignment',
      entityId: validatedData.assignmentId.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      oldValues: existingAssignment,
      newValues: returnData,
      description: `Asset assignment ${validatedData.assignmentId} returned`,
    })

    // Revalidate cache
    revalidatePath('/dashboard/assignments')
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')

    return returnedAssignment
  } catch (error) {
    console.error('Assignment return error:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to return assignment')
  }
}

// Export alias for backward compatibility
export const returnAsset = returnAssignment

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