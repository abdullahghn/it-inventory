import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { user as userTable } from '@/lib/db/schema'
import { 
  updateUserSchema,
  type UpdateUser 
} from '@/lib/validations'
import { dbUtils } from '@/lib/db/utils'
import { requireAuth, hasRole, getCurrentUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { count, isNull } from 'drizzle-orm'
import { assetAssignments } from '@/lib/db/schema'

// ============================================================================
// GET /api/users/[id] - Get user profile with RBAC
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await requireAuth()
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Current user not found',
      }, { status: 404 })
    }
    
    // Validate user ID
    const { id } = await params
    const userId = id
    if (!userId || userId.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 400 })
    }
    
    // RBAC: Check permissions
    const canViewAllUsers = await hasRole('admin')
    const canViewBasicInfo = await hasRole('manager')
    const isOwnProfile = currentUser.id === userId
    
    // Fetch user data first to check department
    const targetUser = await dbUtils.findOne(
      () => db
        .select({
          id: userTable.id,
          department: userTable.department,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1),
      'User',
      userId
    )
    
    // Department-based access control for managers  
    const isSameDepartment = currentUser.department && targetUser.department && 
                             currentUser.department.toLowerCase() === targetUser.department.toLowerCase()
    
    // Permission hierarchy:
    // - Users: Own profile only
    // - Managers: Own profile + same department (full), other departments (read-only)
    // - Admins: All users (full access)
    const canView = isOwnProfile || 
                   canViewAllUsers || 
                   (canViewBasicInfo && isSameDepartment) ||
                   (canViewBasicInfo && !isOwnProfile && !isSameDepartment) // Read-only for other depts
    
    if (!canView) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to view this user profile',
      }, { status: 403 })
    }
    
    // Different field selection based on role and ownership
    let selectFields: any = {
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
      department: userTable.department,
      isActive: userTable.isActive,
      createdAt: userTable.createdAt,
    }
    
    // Add more fields based on permissions
    if (canViewAllUsers || isOwnProfile || (canViewBasicInfo && isSameDepartment)) {
      selectFields = {
        ...selectFields,
        jobTitle: userTable.jobTitle,
        employeeId: userTable.employeeId,
        phone: userTable.phone,
        image: userTable.image,
        lastLoginAt: userTable.lastLoginAt,
        updatedAt: userTable.updatedAt,
      }
    } else if (canViewBasicInfo) {
      selectFields = {
        ...selectFields,
        jobTitle: userTable.jobTitle,
        employeeId: userTable.employeeId,
      }
    }
    
    // Fetch user from database
    const user = await dbUtils.findOne(
      () => db
        .select(selectFields)
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1),
      'User',
      userId
    )
    
    return NextResponse.json({
      success: true,
      data: user,
      permissions: {
        canViewAllUsers,
        canViewBasicInfo,
        isOwnProfile,
        isSameDepartment,
      },
    })
    
  } catch (error: any) {
    const { id: userIdForLog } = await params
    console.error(`GET /api/users/${userIdForLog} error:`, error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 })
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
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
// PUT /api/users/[id] - Update user with RBAC
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await requireAuth()
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Current user not found',
      }, { status: 404 })
    }
    
    // Validate user ID
    const { id } = await params
    const userId = id
    if (!userId || userId.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 400 })
    }
    
    // Parse and validate request body
    const body = await request.json()
    const updateData = updateUserSchema.parse({ ...body, id: userId })
    
    // RBAC: Check permissions
    const canUpdateAllUsers = await hasRole('admin')
    const canUpdateBasicInfo = await hasRole('manager')
    const isOwnProfile = currentUser.id === userId
    
    // Check if user exists and get current data for department comparison
    const existingUser = await dbUtils.findOne(
      () => db
        .select({
          id: userTable.id,
          role: userTable.role,
          isActive: userTable.isActive,
          department: userTable.department,
          employeeId: userTable.employeeId,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1),
      'User',
      userId
    )
    
    // Department-based access control for managers
    const isSameDepartment = currentUser.department && existingUser.department && 
                             currentUser.department.toLowerCase() === existingUser.department.toLowerCase()
    
    // Permission hierarchy:
    // - Users: Own profile only
    // - Managers: Own profile + same department users (edit), other departments (read-only)
    // - Admins: All users (edit)
    const canEdit = isOwnProfile || 
                   (canUpdateAllUsers) || 
                   (canUpdateBasicInfo && isSameDepartment)
    
    const canViewOnly = canEdit || 
                       (canUpdateBasicInfo && !isOwnProfile && !isSameDepartment)
    
    if (!canEdit && !canViewOnly) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to access this user',
      }, { status: 403 })
    }
    
    // If this is a read-only request (no edit permissions), block the update
    if (!canEdit) {
      return NextResponse.json({
        success: false,
        error: 'Read-only access: Cannot edit users from other departments',
      }, { status: 403 })
    }
    
    // Remove id from update data (email already excluded from schema)
    const { id: _, ...userUpdateData } = updateData
    
    // Skip employeeId update if it's the same as current (treat null and empty string as equivalent)
    const currentEmployeeId = existingUser.employeeId || ''
    const newEmployeeId = userUpdateData.employeeId || ''
    if (currentEmployeeId === newEmployeeId) {
      delete userUpdateData.employeeId
    }
    
         // RBAC: Restrict what fields can be updated based on role
     const sanitizedUpdateData: any = {}
     
     if (isOwnProfile && !canUpdateBasicInfo) {
       // Regular users can update their own profile information (except department)
       const allowedFields = ['name', 'phone', 'jobTitle', 'employeeId'] as const
       for (const field of allowedFields) {
         if (userUpdateData[field] !== undefined) {
           sanitizedUpdateData[field] = (userUpdateData as any)[field]
         }
       }
       
       // Department changes require Admin+ permissions (even for own profile)
       if (userUpdateData.department && userUpdateData.department !== existingUser.department) {
         return NextResponse.json({
           success: false,
           error: 'Admin role required to change department assignments',
         }, { status: 403 })
       }
     } else if (canUpdateBasicInfo && !canUpdateAllUsers) {
       // Managers can update basic fields but not role/security settings or department assignments
       const allowedFields = ['name', 'phone', 'jobTitle', 'employeeId'] as const
       for (const field of allowedFields) {
         if (userUpdateData[field] !== undefined) {
           sanitizedUpdateData[field] = (userUpdateData as any)[field]
         }
       }
       
       // Department changes require Admin+ permissions
       if (userUpdateData.department && userUpdateData.department !== existingUser.department) {
         return NextResponse.json({
           success: false,
           error: 'Admin role required to change user department assignments',
         }, { status: 403 })
       }
     } else if (canUpdateAllUsers) {
      // Admins can update all fields
      Object.assign(sanitizedUpdateData, userUpdateData)
      
      // Additional validation for role changes
      if (userUpdateData.role && userUpdateData.role !== existingUser.role) {
        // Only super_admin can change roles to/from admin/super_admin
        if (['admin', 'super_admin'].includes(userUpdateData.role) || 
            ['admin', 'super_admin'].includes(existingUser.role)) {
          const isSuperAdmin = await hasRole('super_admin')
          if (!isSuperAdmin) {
            return NextResponse.json({
              success: false,
              error: 'Super admin role required to change admin roles',
            }, { status: 403 })
          }
        }
      }
    }
    
    // Prevent users from changing their own role or active status
    if (isOwnProfile) {
      delete sanitizedUpdateData.role
      delete sanitizedUpdateData.isActive
    }
    
    // Always update the updatedAt timestamp
    sanitizedUpdateData.updatedAt = new Date()
    
    // Update user in database
    const updatedUser = await dbUtils.update(
      () => db
        .update(userTable)
        .set(sanitizedUpdateData)
        .where(eq(userTable.id, userId))
        .returning({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          role: userTable.role,
          department: userTable.department,
          jobTitle: userTable.jobTitle,
          employeeId: userTable.employeeId,
          phone: userTable.phone,
          isActive: userTable.isActive,
          updatedAt: userTable.updatedAt,
        }),
      'User',
      userId
    )
    
    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    })
    
  } catch (error: any) {
    const { id: userIdForLog } = await params
    console.error(`PUT /api/users/${userIdForLog} error:`, error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user data',
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
        error: 'User not found',
      }, { status: 404 })
    }
    
    if (error.message.includes('already exists') || error.code === '23505') {
      // Check which field is causing the unique constraint violation
      let fieldError = 'already exists'
      if (error.detail || error.message) {
        const errorDetail = error.detail || error.message
        if (errorDetail.includes('email')) {
          fieldError = 'Email already exists'
        } else if (errorDetail.includes('employee_id')) {
          fieldError = 'Employee ID already exists'
        } else {
          fieldError = 'A field with this value already exists'
        }
      }
      
      return NextResponse.json({
        success: false,
        error: fieldError,
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
// DELETE /api/users/[id] - Delete user with RBAC
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await requireAuth()
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Current user not found',
      }, { status: 404 })
    }
    
    // Validate user ID
    const { id } = await params
    const userId = id
    if (!userId || userId.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 400 })
    }
    
    // RBAC: Only super_admin can delete users
    const canDeleteUsers = await hasRole('super_admin')
    
    if (!canDeleteUsers) {
      return NextResponse.json({
        success: false,
        error: 'Super admin role required to delete users',
      }, { status: 403 })
    }
    
    // Prevent self-deletion
    if (currentUser.id === userId) {
      console.log(`DELETE /api/users/${userId}: Self-deletion attempt blocked`)
      return NextResponse.json({
        success: false,
        error: 'Cannot delete your own account',
      }, { status: 400 })
    }
    
    // Check if user exists and get current data
    console.log(`DELETE /api/users/${userId}: Looking up user data`)
    const existingUser = await dbUtils.findOne(
      () => db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          role: userTable.role,
          isActive: userTable.isActive,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1),
      'User',
      userId
    )
    console.log(`DELETE /api/users/${userId}: User found - ${existingUser.name} (${existingUser.role})`)
    
    // Prevent deletion of other super_admin users
    if (existingUser.role === 'super_admin') {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete other super admin users',
      }, { status: 403 })
    }
    
    // Check if user has active asset assignments
    const activeAssignments = await db
      .select({ count: count() })
      .from(assetAssignments)
      .where(
        and(
          eq(assetAssignments.userId, userId),
          eq(assetAssignments.isActive, true),
          isNull(assetAssignments.returnedAt)
        )
      )
    
    if (activeAssignments[0]?.count > 0) {
      console.log(`DELETE /api/users/${userId}: User has ${activeAssignments[0].count} active asset assignments`)
      return NextResponse.json({
        success: false,
        error: 'Cannot delete user with active asset assignments. Please return all assigned assets first.',
      }, { status: 400 })
    }
    
    // Soft delete: Set isActive to false instead of actually deleting
    // This preserves data integrity and allows for audit trails
    const deletedUser = await dbUtils.update(
      () => db
        .update(userTable)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, userId))
        .returning({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          role: userTable.role,
          isActive: userTable.isActive,
          updatedAt: userTable.updatedAt,
        }),
      'User',
      userId
    )
    
    return NextResponse.json({
      success: true,
      data: deletedUser,
      message: `User ${existingUser.name || existingUser.email} has been deactivated successfully`,
    })
    
  } catch (error: any) {
    const { id: userIdForLog } = await params
    console.error(`DELETE /api/users/${userIdForLog} error:`, error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 })
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    }, { status: 500 })
  }
} 