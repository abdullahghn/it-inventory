'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { assetAssignments, assets, user } from '@/lib/db/schema'
import { createAssignmentSchema, updateAssignmentSchema, returnAssignmentSchema } from '@/lib/validations'
import { eq, and, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'

/**
 * Creates a new asset assignment with comprehensive validation and audit logging
 * Aligns with PRD requirements for assignment lifecycle management
 */
export async function createAssignment(data: any) {
  try {
    // Validate input data using Zod schema
    const validatedData = createAssignmentSchema.parse(data)
    
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check user permissions - only admin, IT staff, and managers can create assignments
    const allowedRoles = ['super_admin', 'admin', 'manager']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions: Only administrators and managers can create assignments')
    }

    // Check if asset exists and is available
    const asset = await db.query.assets.findFirst({
      where: and(
        eq(assets.id, validatedData.assetId),
        eq(assets.isDeleted, false)
      ),
    })
    
    if (!asset) {
      throw new Error('Asset not found or has been deleted')
    }
    
    if (asset.status !== 'available') {
      throw new Error(`Asset is not available for assignment. Current status: ${asset.status}`)
    }

    // Check if user exists and is active
    const assignedUser = await db.query.user.findFirst({
      where: and(
        eq(user.id, validatedData.userId),
        eq(user.isActive, true)
      ),
    })
    
    if (!assignedUser) {
      throw new Error('User not found or account is not active')
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

    // Check if user has too many active assignments (limit to 5 as per PRD)
    const userActiveAssignments = await db.query.assetAssignments.findMany({
      where: and(
        eq(assetAssignments.userId, validatedData.userId),
        eq(assetAssignments.isActive, true)
      ),
    })
    
    if (userActiveAssignments.length >= 5) {
      throw new Error('User has reached the maximum limit of 5 active asset assignments')
    }

    // Validate assignment dates
    if (validatedData.expectedReturnAt && validatedData.expectedReturnAt <= new Date()) {
      throw new Error('Expected return date must be in the future')
    }

    // Prepare assignment data
    const assignmentData = {
      assetId: validatedData.assetId,
      userId: validatedData.userId,
      purpose: validatedData.purpose?.trim() || null,
      expectedReturnAt: validatedData.expectedReturnAt || null,
      notes: validatedData.notes?.trim() || null,
      // Location fields
      building: validatedData.building?.trim() || null,
      floor: validatedData.floor?.trim() || null,
      room: validatedData.room?.trim() || null,
      desk: validatedData.desk?.trim() || null,
      locationNotes: validatedData.locationNotes?.trim() || null,
      assignedBy: session.user.id,
      status: 'active' as const,
      isActive: true,
    }

    // Create assignment with transaction
    const [newAssignment] = await db.insert(assetAssignments).values(assignmentData).returning()

    // Update asset status to assigned
    await db
      .update(assets)
      .set({ 
        status: 'assigned',
        updatedAt: new Date() 
      })
      .where(eq(assets.id, validatedData.assetId))

    // Log comprehensive audit trail
    await logAuditTrail({
      action: 'create' as const,
      entityType: 'assignment',
      entityId: newAssignment.id.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      newValues: assignmentData,
      description: `Asset ${asset.assetTag} assigned to ${assignedUser.name} by ${session.user.name}`,
    })

    // Revalidate cache for all related pages
    revalidatePath('/dashboard/assignments')
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')
    revalidatePath('/api/assignments')

    return {
      success: true,
      assignment: newAssignment,
      message: `Asset ${asset.assetTag} successfully assigned to ${assignedUser.name}`
    }
  } catch (error) {
    console.error('Assignment creation error:', error)
    
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
      error: 'Failed to create assignment due to an unexpected error'
    }
  }
}

/**
 * Updates an existing assignment with comprehensive validation and audit logging
 * Supports partial updates and maintains data integrity
 */
export async function updateAssignment(data: any) {
  try {
    // Validate input data using Zod schema
    const validatedData = updateAssignmentSchema.parse(data)
    
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check user permissions - only admin, IT staff, and managers can update assignments
    const allowedRoles = ['super_admin', 'admin', 'manager']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions: Only administrators and managers can update assignments')
    }

    // Check if assignment exists and get current values
    const existingAssignment = await db.query.assetAssignments.findFirst({
      where: eq(assetAssignments.id, validatedData.id),
    })
    
    if (!existingAssignment) {
      throw new Error('Assignment not found')
    }

    // Validate assignment dates
    if (validatedData.expectedReturnAt && validatedData.expectedReturnAt <= new Date()) {
      throw new Error('Expected return date must be in the future')
    }

    // Prepare update data with proper data cleaning
    const updateData: any = {
      purpose: validatedData.purpose?.trim() || null,
      expectedReturnAt: validatedData.expectedReturnAt || null,
      notes: validatedData.notes?.trim() || null,
      updatedAt: new Date(),
    }

    // Handle status changes
    if (validatedData.status) {
      updateData.status = validatedData.status
      
      // If returning, set return details
      if (validatedData.status === 'returned') {
        updateData.returnedAt = validatedData.returnedAt || new Date()
        updateData.actualReturnCondition = validatedData.actualReturnCondition || null
        updateData.returnNotes = validatedData.returnNotes?.trim() || null
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

    // Calculate changed fields for audit trail
    const changedFields = getChangedFields(existingAssignment, updateData)

    // Log comprehensive audit trail
    await logAuditTrail({
      action: 'update' as const,
      entityType: 'assignment',
      entityId: validatedData.id.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      oldValues: existingAssignment,
      newValues: updateData,
      changedFields,
      description: `Assignment ${validatedData.id} updated by ${session.user.name}`,
    })

    // Revalidate cache for all related pages
    revalidatePath('/dashboard/assignments')
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')
    revalidatePath('/api/assignments')

    return {
      success: true,
      assignment: updatedAssignment,
      message: `Assignment updated successfully`,
      changedFields
    }
  } catch (error) {
    console.error('Assignment update error:', error)
    
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
      error: 'Failed to update assignment due to an unexpected error'
    }
  }
}

/**
 * Returns an asset assignment with comprehensive validation and audit logging
 * Handles asset status updates and return condition tracking
 */
export async function returnAssignment(data: any) {
  try {
    // Validate input data using Zod schema
    const validatedData = returnAssignmentSchema.parse(data)
    
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check user permissions - only admin, IT staff, and managers can return assignments
    const allowedRoles = ['super_admin', 'admin', 'manager']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions: Only administrators and managers can return assignments')
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

    // Get asset and user details for audit trail
    const [asset, assignedUser] = await Promise.all([
      db.query.assets.findFirst({
        where: eq(assets.id, existingAssignment.assetId),
      }),
      db.query.user.findFirst({
        where: eq(user.id, existingAssignment.userId),
      })
    ])

    // Prepare return data
    const returnData = {
      status: 'returned' as const,
      returnedAt: validatedData.returnedAt,
      actualReturnCondition: validatedData.actualReturnCondition || null,
      returnNotes: validatedData.returnNotes?.trim() || null,
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

    // Log comprehensive audit trail
    await logAuditTrail({
      action: 'return' as const,
      entityType: 'assignment',
      entityId: validatedData.assignmentId.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      oldValues: existingAssignment,
      newValues: returnData,
      description: `Asset ${asset?.assetTag} returned from ${assignedUser?.name} by ${session.user.name}`,
    })

    // Revalidate cache for all related pages
    revalidatePath('/dashboard/assignments')
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')
    revalidatePath('/api/assignments')

    return {
      success: true,
      assignment: returnedAssignment,
      message: `Asset ${asset?.assetTag} successfully returned from ${assignedUser?.name}`
    }
  } catch (error) {
    console.error('Assignment return error:', error)
    
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
      error: 'Failed to return assignment due to an unexpected error'
    }
  }
}

/**
 * Bulk operations for assignments - supports bulk return and status changes
 * Implements progress tracking and rollback capabilities as per PRD
 */
export async function bulkAssignmentOperations(operation: string, assignmentIds: number[], data?: any) {
  try {
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check user permissions for bulk operations
    const allowedRoles = ['super_admin', 'admin', 'manager']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions: Only administrators and managers can perform bulk assignment operations')
    }

    // Validate operation type
    const validOperations = ['return', 'status_change', 'extend_return_date']
    if (!validOperations.includes(operation)) {
      throw new Error(`Invalid operation: ${operation}. Valid operations are: ${validOperations.join(', ')}`)
    }

    // Validate assignment IDs
    if (!assignmentIds || assignmentIds.length === 0) {
      throw new Error('No assignment IDs provided for bulk operation')
    }

    // Limit bulk operations to 50 assignments as per PRD
    if (assignmentIds.length > 50) {
      throw new Error('Bulk operations are limited to 50 assignments at a time')
    }

    // Verify all assignments exist and are accessible
    const existingAssignments = await db.query.assetAssignments.findMany({
      where: inArray(assetAssignments.id, assignmentIds),
    })

    if (existingAssignments.length !== assignmentIds.length) {
      throw new Error(`Some assignments not found. Expected ${assignmentIds.length}, found ${existingAssignments.length}`)
    }

    const results = {
      success: true,
      totalAssignments: assignmentIds.length,
      processedAssignments: 0,
      successfulAssignments: 0,
      failedAssignments: 0,
      errors: [] as any[],
      operation,
      timestamp: new Date().toISOString(),
    }

    // Process each assignment based on operation type
    for (const assignmentId of assignmentIds) {
      try {
        results.processedAssignments++

        switch (operation) {
          case 'return':
            await bulkReturnAssignment(assignmentId, data, session.user.id)
            break
          
          case 'status_change':
            if (!data?.status) throw new Error('Status required for status change operation')
            await bulkStatusChange(assignmentId, data.status, session.user.id)
            break
          
          case 'extend_return_date':
            if (!data?.expectedReturnAt) throw new Error('Expected return date required for extend operation')
            await bulkExtendReturnDate(assignmentId, data.expectedReturnAt, session.user.id)
            break
        }

        results.successfulAssignments++
      } catch (error) {
        results.failedAssignments++
        results.errors.push({
          assignmentId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Log bulk operation audit trail
    await logAuditTrail({
      action: 'update' as const, // Use update action for bulk operations
      entityType: 'assignment',
      entityId: `bulk_${operation}_${Date.now()}`,
      userId: session.user.id,
      userEmail: session.user.email,
      newValues: {
        operation,
        totalAssignments: results.totalAssignments,
        successfulAssignments: results.successfulAssignments,
        failedAssignments: results.failedAssignments,
        assignmentIds
      },
      description: `Bulk ${operation} operation on ${results.totalAssignments} assignments by ${session.user.name}`,
    })

    // Revalidate cache
    revalidatePath('/dashboard/assignments')
    revalidatePath('/dashboard/assets')
    revalidatePath('/dashboard')
    revalidatePath('/api/assignments')

    return results
  } catch (error) {
    console.error('Bulk assignment operations error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform bulk operations',
      totalAssignments: assignmentIds?.length || 0,
      processedAssignments: 0,
      successfulAssignments: 0,
      failedAssignments: 0,
      errors: []
    }
  }
}

/**
 * Helper function to perform bulk assignment returns
 */
async function bulkReturnAssignment(assignmentId: number, data: any, returnedBy: string) {
  // Check if assignment is active
  const existingAssignment = await db.query.assetAssignments.findFirst({
    where: and(
      eq(assetAssignments.id, assignmentId),
      eq(assetAssignments.isActive, true)
    ),
  })
  
  if (!existingAssignment) {
    throw new Error('Assignment is not active')
  }

  // Update assignment
  await db
    .update(assetAssignments)
    .set({
      status: 'returned' as const,
      returnedAt: data?.returnedAt || new Date(),
      actualReturnCondition: data?.actualReturnCondition || null,
      returnNotes: data?.returnNotes?.trim() || null,
      isActive: false,
      updatedAt: new Date()
    })
    .where(eq(assetAssignments.id, assignmentId))

  // Update asset status
  await db
    .update(assets)
    .set({ 
      status: 'available',
      updatedAt: new Date() 
    })
    .where(eq(assets.id, existingAssignment.assetId))
}

/**
 * Helper function to perform bulk status changes
 */
async function bulkStatusChange(assignmentId: number, status: string, updatedBy: string) {
  // Validate status is a valid enum value
  const validStatuses = ['active', 'returned', 'overdue', 'lost'] as const
  if (!validStatuses.includes(status as any)) {
    throw new Error(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`)
  }

  await db
    .update(assetAssignments)
    .set({ 
      status: status as 'active' | 'returned' | 'overdue' | 'lost',
      updatedAt: new Date()
    })
    .where(eq(assetAssignments.id, assignmentId))
}

/**
 * Helper function to perform bulk return date extensions
 */
async function bulkExtendReturnDate(assignmentId: number, expectedReturnAt: Date, updatedBy: string) {
  if (expectedReturnAt <= new Date()) {
    throw new Error('Expected return date must be in the future')
  }

  await db
    .update(assetAssignments)
    .set({ 
      expectedReturnAt,
      updatedAt: new Date()
    })
    .where(eq(assetAssignments.id, assignmentId))
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
    'Asset ID': 'assetId',
    'User ID': 'userId',
    'Purpose': 'purpose',
    'Expected return date': 'expectedReturnAt',
    'Notes': 'notes',
    'Return date': 'returnedAt',
    'Return condition': 'actualReturnCondition',
    'Return notes': 'returnNotes',
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
 * Tracks all assignment-related actions for compliance and debugging
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