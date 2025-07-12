import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user as userTable, assetAssignments } from '@/lib/db/schema'
import { requireAuth, hasRole, getCurrentUser } from '@/lib/auth'
import { eq, and, isNull, count } from 'drizzle-orm'
import { dbUtils } from '@/lib/db/utils'

// ============================================================================
// GET /api/users/[id]/can-delete - Check if user can be deleted
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
    
    // RBAC: Only super_admin can delete users
    const canDeleteUsers = await hasRole('super_admin')
    
    if (!canDeleteUsers) {
      return NextResponse.json({
        success: false,
        canDelete: false,
        error: 'Super admin role required to delete users',
      }, { status: 403 })
    }
    
    // Prevent self-deletion
    if (currentUser.id === userId) {
      return NextResponse.json({
        success: false,
        canDelete: false,
        error: 'Cannot delete your own account',
      }, { status: 400 })
    }
    
    // Check if user exists and get current data
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
    
    // Prevent deletion of other super_admin users
    if (existingUser.role === 'super_admin') {
      return NextResponse.json({
        success: false,
        canDelete: false,
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
      return NextResponse.json({
        success: false,
        canDelete: false,
        error: 'Cannot delete user with active asset assignments. Please return all assigned assets first.',
        activeAssignments: activeAssignments[0].count,
      }, { status: 400 })
    }
    
    // User can be deleted
    return NextResponse.json({
      success: true,
      canDelete: true,
      message: `User ${existingUser.name || existingUser.email} can be deleted`,
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
      },
    })
    
  } catch (error: any) {
    const { id: userIdForLog } = await params
    console.error(`GET /api/users/${userIdForLog}/can-delete error:`, error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        canDelete: false,
        error: 'Authentication required',
      }, { status: 401 })
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        canDelete: false,
        error: 'User not found',
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: false,
      canDelete: false,
      error: 'Internal server error',
      message: error.message,
    }, { status: 500 })
  }
} 