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

// ============================================================================
// GET /api/users/[id] - Get user profile with RBAC
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const userId = params.id
    if (!userId || userId.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID',
      }, { status: 400 })
    }
    
    // RBAC: Check permissions
    const canViewAllUsers = await hasRole('manager')
    const canViewFullDetails = await hasRole('admin')
    const isOwnProfile = currentUser.id === userId
    
    // Users can only view their own profile unless they're manager+
    if (!canViewAllUsers && !isOwnProfile) {
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
    if (canViewFullDetails || isOwnProfile) {
      selectFields = {
        ...selectFields,
        jobTitle: userTable.jobTitle,
        employeeId: userTable.employeeId,
        phone: userTable.phone,
        image: userTable.image,
        lastLoginAt: userTable.lastLoginAt,
        updatedAt: userTable.updatedAt,
      }
    } else if (canViewAllUsers) {
      selectFields = {
        ...selectFields,
        jobTitle: userTable.jobTitle,
        employeeId: userTable.employeeId,
      }
    }
    
    // Additional constraints for non-managers
    const whereConditions = [eq(userTable.id, userId)]
    
    if (!canViewAllUsers && !isOwnProfile) {
      // Regular users can only see active users in their department
      whereConditions.push(
        eq(userTable.isActive, true),
        eq(userTable.department, currentUser.department || '')
      )
    }
    
    // Fetch user from database
    const user = await dbUtils.findOne(
      () => db
        .select(selectFields)
        .from(userTable)
        .where(and(...whereConditions))
        .limit(1),
      'User',
      userId
    )
    
    return NextResponse.json({
      success: true,
      data: user,
      permissions: {
        canViewAllUsers,
        canViewFullDetails,
        isOwnProfile,
      },
    })
    
  } catch (error: any) {
    console.error(`GET /api/users/${params.id} error:`, error)
    
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
  { params }: { params: { id: string } }
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
    const userId = params.id
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
    
    // Users can only update their own profile unless they're admin+
    if (!canUpdateAllUsers && !isOwnProfile) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to update this user',
      }, { status: 403 })
    }
    
    // Check if user exists and get current data
    const existingUser = await dbUtils.findOne(
      () => db
        .select({
          id: userTable.id,
          role: userTable.role,
          isActive: userTable.isActive,
          department: userTable.department,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1),
      'User',
      userId
    )
    
    // Remove id from update data
    const { id, ...userUpdateData } = updateData
    
         // RBAC: Restrict what fields can be updated based on role
     const sanitizedUpdateData: any = {}
     
     if (isOwnProfile && !canUpdateBasicInfo) {
       // Regular users can only update basic personal info
       const allowedFields = ['name', 'phone', 'jobTitle'] as const
       for (const field of allowedFields) {
         if (userUpdateData[field] !== undefined) {
           sanitizedUpdateData[field] = (userUpdateData as any)[field]
         }
       }
     } else if (canUpdateBasicInfo && !canUpdateAllUsers) {
       // Managers can update more fields but not role/security settings
       const allowedFields = ['name', 'phone', 'jobTitle', 'department', 'employeeId'] as const
       for (const field of allowedFields) {
         if (userUpdateData[field] !== undefined) {
           sanitizedUpdateData[field] = (userUpdateData as any)[field]
         }
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
    console.error(`PUT /api/users/${params.id} error:`, error)
    
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
    
    if (error.message.includes('already exists')) {
      return NextResponse.json({
        success: false,
        error: 'Email already exists',
      }, { status: 409 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    }, { status: 500 })
  }
} 