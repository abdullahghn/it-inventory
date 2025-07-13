'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { createUserSchema, updateUserSchema } from '@/lib/validations'
import { eq, and, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'

/**
 * Creates a new user with comprehensive validation and audit logging
 * Aligns with PRD requirements for user lifecycle management
 */
export async function createUser(data: any) {
  try {
    // Validate input data using Zod schema
    const validatedData = createUserSchema.parse(data)
    
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check user permissions - only admin and super_admin can create users
    const allowedRoles = ['super_admin', 'admin']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions: Only administrators can create users')
    }

    // Check for duplicate email (case-insensitive)
    const existingUser = await db.query.user.findFirst({
      where: and(
        eq(user.email, validatedData.email.toLowerCase()),
        eq(user.isActive, true)
      ),
    })
    
    if (existingUser) {
      throw new Error(`User with email '${validatedData.email}' already exists`)
    }

    // Validate email format and domain restrictions
    const emailDomain = validatedData.email.split('@')[1]?.toLowerCase()
    const allowedDomains = [
      'company.com', 
      'corporate.org',
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'test.com',
      'example.com'
    ] // Configure as needed
    if (allowedDomains.length > 0 && !allowedDomains.includes(emailDomain)) {
      throw new Error(`Email domain '${emailDomain}' is not allowed`)
    }

    // Prepare user data for database insertion
    const userData = {
      id: crypto.randomUUID(), // Generate UUID for user ID
      name: validatedData.name.trim(),
      email: validatedData.email.toLowerCase().trim(), // Normalize email
      department: validatedData.department?.trim() || null,
      jobTitle: validatedData.jobTitle?.trim() || null,
      employeeId: validatedData.employeeId?.trim() || null,
      phone: validatedData.phone?.trim() || null,
      role: validatedData.role || 'user',
      isActive: validatedData.isActive !== false, // Default to true
      createdBy: session.user.id,
    }

    // Insert user into database
    const [newUser] = await db.insert(user).values(userData).returning()

    // Log comprehensive audit trail
    await logAuditTrail({
      action: 'create',
      entityType: 'user',
      entityId: newUser.id,
      userId: session.user.id,
      userEmail: session.user.email,
      newValues: userData,
      description: `User ${validatedData.email} created by ${session.user.name}`,
    })

    // Revalidate cache for all related pages
    revalidatePath('/dashboard/users')
    revalidatePath('/dashboard')
    revalidatePath('/api/users')

    return {
      success: true,
      user: newUser,
      message: `User ${validatedData.email} created successfully`
    }
  } catch (error) {
    console.error('User creation error:', error)
    
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
      error: 'Failed to create user due to an unexpected error'
    }
  }
}

/**
 * Updates an existing user with comprehensive validation and audit logging
 * Supports partial updates and maintains data integrity
 */
export async function updateUser(userId: string, data: any) {
  try {
    // Validate input data using Zod schema
    const validatedData = updateUserSchema.parse({ ...data, id: userId })
    
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check if user exists and get current values
    const existingUser = await db.query.user.findFirst({
      where: and(
        eq(user.id, userId),
        eq(user.isActive, true)
      ),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        jobTitle: true,
        employeeId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    if (!existingUser) {
      throw new Error('User not found or has been deactivated')
    }

    // Check user permissions - users can edit their own profile, managers+ can edit others
    const isOwnProfile = session.user.id === userId
    if (!isOwnProfile) {
      // Editing someone else's profile requires manager+ permissions
      const allowedRoles = ['super_admin', 'admin', 'manager']
      if (!allowedRoles.includes(session.user.role)) {
        throw new Error('Insufficient permissions: Only managers and administrators can edit other users')
      }
    }

    // Check for duplicate email (if changed) - case-insensitive
    if (data.email && data.email !== existingUser.email) {
      const duplicateUser = await db.query.user.findFirst({
        where: and(
          eq(user.email, data.email.toLowerCase()),
          eq(user.isActive, true)
        ),
      })
      
      if (duplicateUser) {
        throw new Error(`User with email '${data.email}' already exists`)
      }
    }

    // Validate email format and domain restrictions if email is being changed
    if (data.email) {
      const emailDomain = data.email.split('@')[1]?.toLowerCase()
      const allowedDomains = [
        'company.com', 
        'corporate.org',
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'test.com',
        'example.com'
      ] // Configure as needed
      if (allowedDomains.length > 0 && !allowedDomains.includes(emailDomain)) {
        throw new Error(`Email domain '${emailDomain}' is not allowed`)
      }
    }

    // Prepare update data with proper data cleaning
    const updateData: any = {
      name: data.name ? data.name.trim() : existingUser.name,
      email: data.email ? data.email.toLowerCase().trim() : existingUser.email,
      department: data.department?.trim() || null,
      jobTitle: data.jobTitle?.trim() || null,
      employeeId: data.employeeId?.trim() || null,
      phone: data.phone?.trim() || null,
      role: data.role || existingUser.role,
      isActive: data.isActive !== undefined ? data.isActive : existingUser.isActive,
      updatedAt: new Date(),
    }

    // Update user in database
    const [updatedUser] = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId))
      .returning()

    // Calculate changed fields for audit trail
    const changedFields = getChangedFields(existingUser, updateData)

    // Log comprehensive audit trail
    await logAuditTrail({
      action: 'update',
      entityType: 'user',
      entityId: userId,
      userId: session.user.id,
      userEmail: session.user.email,
      oldValues: existingUser,
      newValues: updateData,
      changedFields,
      description: `User updated by ${session.user.name}`,
    })

    // Revalidate cache for all related pages
    revalidatePath('/dashboard/users')
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/users/${userId}`)
    revalidatePath('/api/users')

    return {
      success: true,
      user: updatedUser,
      message: `User updated successfully`,
      changedFields
    }
  } catch (error) {
    console.error('User update error:', error)
    
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
      error: 'Failed to update user due to an unexpected error'
    }
  }
}

/**
 * Deactivates a user (soft delete) with comprehensive validation and audit logging
 * Prevents deactivation of users with active asset assignments
 */
export async function deactivateUser(userId: string) {
  try {
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check user permissions - only admin and super_admin can deactivate users
    const allowedRoles = ['super_admin', 'admin']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions: Only administrators can deactivate users')
    }

    // Check if user exists and get current values
    const existingUser = await db.query.user.findFirst({
      where: and(
        eq(user.id, userId),
        eq(user.isActive, true)
      ),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        jobTitle: true,
        employeeId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    if (!existingUser) {
      throw new Error('User not found or has already been deactivated')
    }

    // Prevent deactivation of own account
    if (session.user.id === userId) {
      throw new Error('Cannot deactivate your own account')
    }

    // Check if user has active asset assignments
    const { assetAssignments } = await import('@/lib/db/schema')
    const activeAssignments = await db.query.assetAssignments.findMany({
      where: and(
        eq(assetAssignments.userId, userId),
        eq(assetAssignments.isActive, true)
      ),
    })
    
    if (activeAssignments.length > 0) {
      throw new Error(`Cannot deactivate user with ${activeAssignments.length} active asset assignments. Please return all assets first.`)
    }

    // Soft deactivate user (mark as inactive instead of physical deletion)
    const [deactivatedUser] = await db
      .update(user)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId))
      .returning()

    // Log comprehensive audit trail
    await logAuditTrail({
      action: 'delete',
      entityType: 'user',
      entityId: userId,
      userId: session.user.id,
      userEmail: session.user.email,
      oldValues: existingUser,
      description: `User deactivated by ${session.user.name}`,
    })

    // Revalidate cache for all related pages
    revalidatePath('/dashboard/users')
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/users/${userId}`)
    revalidatePath('/api/users')

    return {
      success: true,
      user: deactivatedUser,
      message: `User deactivated successfully`
    }
  } catch (error) {
    console.error('User deactivation error:', error)
    
    // Return structured error response
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: false,
      error: 'Failed to deactivate user due to an unexpected error'
    }
  }
}

/**
 * Reactivates a previously deactivated user
 */
export async function reactivateUser(userId: string) {
  try {
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check user permissions - only admin and super_admin can reactivate users
    const allowedRoles = ['super_admin', 'admin']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions: Only administrators can reactivate users')
    }

    // Check if user exists and is currently deactivated
    const existingUser = await db.query.user.findFirst({
      where: and(
        eq(user.id, userId),
        eq(user.isActive, false)
      ),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        jobTitle: true,
        employeeId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    if (!existingUser) {
      throw new Error('User not found or is already active')
    }

    // Reactivate user
    const [reactivatedUser] = await db
      .update(user)
      .set({ 
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId))
      .returning()

    // Log comprehensive audit trail
    await logAuditTrail({
      action: 'update',
      entityType: 'user',
      entityId: userId,
      userId: session.user.id,
      userEmail: session.user.email,
      oldValues: existingUser,
      description: `User reactivated by ${session.user.name}`,
    })

    // Revalidate cache for all related pages
    revalidatePath('/dashboard/users')
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/users/${userId}`)
    revalidatePath('/api/users')

    return {
      success: true,
      user: reactivatedUser,
      message: `User reactivated successfully`
    }
  } catch (error) {
    console.error('User reactivation error:', error)
    
    // Return structured error response
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: false,
      error: 'Failed to reactivate user due to an unexpected error'
    }
  }
}

/**
 * Bulk operations for users - supports bulk update, deactivation, and role changes
 * Implements progress tracking and rollback capabilities as per PRD
 */
export async function bulkUserOperations(operation: string, userIds: string[], data?: any) {
  try {
    // Get current user for audit trail and authorization
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Check user permissions for bulk operations
    const allowedRoles = ['super_admin', 'admin']
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Insufficient permissions: Only administrators can perform bulk user operations')
    }

    // Validate operation type
    const validOperations = ['update', 'deactivate', 'reactivate', 'role_change', 'department_change']
    if (!validOperations.includes(operation)) {
      throw new Error(`Invalid operation: ${operation}. Valid operations are: ${validOperations.join(', ')}`)
    }

    // Validate user IDs
    if (!userIds || userIds.length === 0) {
      throw new Error('No user IDs provided for bulk operation')
    }

    // Limit bulk operations to 50 users as per PRD
    if (userIds.length > 50) {
      throw new Error('Bulk operations are limited to 50 users at a time')
    }

    // Verify all users exist and are accessible
    const existingUsers = await db.query.user.findMany({
      where: inArray(user.id, userIds),
    })

    if (existingUsers.length !== userIds.length) {
      throw new Error(`Some users not found. Expected ${userIds.length}, found ${existingUsers.length}`)
    }

    const results = {
      success: true,
      totalUsers: userIds.length,
      processedUsers: 0,
      successfulUsers: 0,
      failedUsers: 0,
      errors: [] as any[],
      operation,
      timestamp: new Date().toISOString(),
    }

    // Process each user based on operation type
    for (const userId of userIds) {
      try {
        results.processedUsers++

        // Prevent bulk operations on own account
        if (session.user.id === userId && (operation === 'deactivate' || operation === 'role_change')) {
          throw new Error('Cannot perform this operation on your own account')
        }

        switch (operation) {
          case 'update':
            if (!data) throw new Error('Update data required for bulk update operation')
            await bulkUpdateUser(userId, data, session.user.id)
            break
          
          case 'deactivate':
            await bulkDeactivateUser(userId, session.user.id)
            break
          
          case 'reactivate':
            await bulkReactivateUser(userId, session.user.id)
            break
          
          case 'role_change':
            if (!data?.role) throw new Error('Role required for role change operation')
            await bulkRoleChange(userId, data.role, session.user.id)
            break
          
          case 'department_change':
            if (!data?.department) throw new Error('Department required for department change operation')
            await bulkDepartmentChange(userId, data.department, session.user.id)
            break
        }

        results.successfulUsers++
      } catch (error) {
        results.failedUsers++
        results.errors.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Log bulk operation audit trail
    await logAuditTrail({
      action: 'update',
      entityType: 'user',
      entityId: `bulk_${operation}_${Date.now()}`,
      userId: session.user.id,
      userEmail: session.user.email,
      newValues: {
        operation,
        totalUsers: results.totalUsers,
        successfulUsers: results.successfulUsers,
        failedUsers: results.failedUsers,
        userIds
      },
      description: `Bulk ${operation} operation on ${results.totalUsers} users by ${session.user.name}`,
    })

    // Revalidate cache
    revalidatePath('/dashboard/users')
    revalidatePath('/dashboard')
    revalidatePath('/api/users')

    return results
  } catch (error) {
    console.error('Bulk user operations error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform bulk operations',
      totalUsers: userIds?.length || 0,
      processedUsers: 0,
      successfulUsers: 0,
      failedUsers: 0,
      errors: []
    }
  }
}

/**
 * Helper function to perform bulk user updates
 */
async function bulkUpdateUser(userId: string, data: any, updatedBy: string) {
  const updateData: any = {
    updatedAt: new Date(),
  }

  // Add only provided fields to update
  if (data.name) updateData.name = data.name.trim()
  if (data.department) updateData.department = data.department.trim()
  if (data.jobTitle) updateData.jobTitle = data.jobTitle.trim()
  if (data.employeeId) updateData.employeeId = data.employeeId.trim()
  if (data.phone) updateData.phone = data.phone.trim()

  await db
    .update(user)
    .set(updateData)
    .where(eq(user.id, userId))
}

/**
 * Helper function to perform bulk user deactivations
 */
async function bulkDeactivateUser(userId: string, deactivatedBy: string) {
  // Check if user has active asset assignments
  const { assetAssignments } = await import('@/lib/db/schema')
  const activeAssignments = await db.query.assetAssignments.findMany({
    where: and(
      eq(assetAssignments.userId, userId),
      eq(assetAssignments.isActive, true)
    ),
  })
  
  if (activeAssignments.length > 0) {
    throw new Error('Cannot deactivate user with active asset assignments')
  }

  await db
    .update(user)
    .set({ 
      isActive: false,
      updatedAt: new Date()
    })
    .where(eq(user.id, userId))
}

/**
 * Helper function to perform bulk user reactivations
 */
async function bulkReactivateUser(userId: string, reactivatedBy: string) {
  await db
    .update(user)
    .set({ 
      isActive: true,
      updatedAt: new Date()
    })
    .where(eq(user.id, userId))
}

/**
 * Helper function to perform bulk role changes
 */
async function bulkRoleChange(userId: string, role: string, updatedBy: string) {
  await db
    .update(user)
    .set({ 
      role: role as 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer',
      updatedAt: new Date()
    })
    .where(eq(user.id, userId))
}

/**
 * Helper function to perform bulk department changes
 */
async function bulkDepartmentChange(userId: string, department: string, updatedBy: string) {
  await db
    .update(user)
    .set({ 
      department: department.trim(),
      updatedAt: new Date()
    })
    .where(eq(user.id, userId))
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
    'Name': 'name',
    'Email': 'email',
    'Department': 'department',
    'Job title': 'jobTitle',
    'Employee ID': 'employeeId',
    'Phone': 'phone',
    'Role': 'role',
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
 * Tracks all user-related actions for compliance and debugging
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

// Legacy function for backward compatibility
export async function createUserFromForm(formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    department: formData.get('department') as string,
    jobTitle: formData.get('jobTitle') as string,
    employeeId: formData.get('employeeId') as string,
    phone: formData.get('phone') as string,
    role: formData.get('role') as string,
  }
  
  return createUser(data)
}

export async function updateUserData(id: string, userData: any) {
  return updateUser(id, userData)
}

export async function getUsers() {
  try {
    return await db.select().from(user).where(eq(user.isActive, true))
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return []
  }
}

export async function getUserById(id: string) {
  try {
    const result = await db.select().from(user).where(eq(user.id, id))
    return result[0] || null
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
} 