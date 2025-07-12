import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { assetAssignments, assets, user as userTable } from '@/lib/db/schema'
import { dbUtils } from '@/lib/db/utils'
import { requireAuth, hasRole, getCurrentUser } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function GET(
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
    
    // Validate assignment ID
    const { id } = await params
    const assignmentId = parseInt(id)
    if (isNaN(assignmentId) || assignmentId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid assignment ID',
      }, { status: 400 })
    }
    
    // Fetch assignment with basic details first
    const assignment = await dbUtils.findOne(
      () => db
        .select({
          id: assetAssignments.id,
          assetId: assetAssignments.assetId,
          userId: assetAssignments.userId,
          status: assetAssignments.status,
          assignedAt: assetAssignments.assignedAt,
          expectedReturnAt: assetAssignments.expectedReturnAt,
          returnedAt: assetAssignments.returnedAt,
          actualReturnCondition: assetAssignments.actualReturnCondition,
          purpose: assetAssignments.purpose,
          notes: assetAssignments.notes,
          returnNotes: assetAssignments.returnNotes,
          assignedBy: assetAssignments.assignedBy,
          returnedBy: assetAssignments.returnedBy,
          isActive: assetAssignments.isActive,
          createdAt: assetAssignments.createdAt,
          updatedAt: assetAssignments.updatedAt,
        })
        .from(assetAssignments)
        .where(eq(assetAssignments.id, assignmentId))
        .limit(1),
      'Assignment',
      assignmentId
    )
    
    // Fetch asset details
    const asset = await dbUtils.findOne(
      () => db
        .select({
          name: assets.name,
          assetTag: assets.assetTag,
          category: assets.category,
          status: assets.status,
          condition: assets.condition,
          model: assets.model,
          manufacturer: assets.manufacturer,
          serialNumber: assets.serialNumber,
          description: assets.description,
          purchaseDate: assets.purchaseDate,
          purchasePrice: assets.purchasePrice,
          warrantyExpiry: assets.warrantyExpiry,
          building: assets.building,
          floor: assets.floor,
          room: assets.room,
          desk: assets.desk,
        })
        .from(assets)
        .where(eq(assets.id, assignment.assetId))
        .limit(1),
      'Asset',
      assignment.assetId
    )
    
    // Fetch user details
    const user = await dbUtils.findOne(
      () => db
        .select({
          name: userTable.name,
          email: userTable.email,
          department: userTable.department,
          jobTitle: userTable.jobTitle,
          employeeId: userTable.employeeId,
          phone: userTable.phone,
        })
        .from(userTable)
        .where(eq(userTable.id, assignment.userId))
        .limit(1),
      'User',
      assignment.userId
    )
    
    // Fetch assigned by user details
    let assignedByUser = null
    if (assignment.assignedBy) {
      assignedByUser = await dbUtils.findOne(
        () => db
          .select({
            name: userTable.name,
            email: userTable.email,
            department: userTable.department,
          })
          .from(userTable)
          .where(eq(userTable.id, assignment.assignedBy!))
          .limit(1),
        'User',
        assignment.assignedBy!
      )
    }
    
    // Fetch returned by user details
    let returnedByUser = null
    if (assignment.returnedBy) {
      returnedByUser = await dbUtils.findOne(
        () => db
          .select({
            name: userTable.name,
            email: userTable.email,
            department: userTable.department,
          })
          .from(userTable)
          .where(eq(userTable.id, assignment.returnedBy!))
          .limit(1),
        'User',
        assignment.returnedBy!
      )
    }
    
    // RBAC: Check permissions
    const canViewAllAssignments = await hasRole('manager')
    const isOwnAssignment = assignment.userId === currentUser.id
    
    // Regular users can only view their own assignments
    if (!canViewAllAssignments && !isOwnAssignment) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to view this assignment',
      }, { status: 403 })
    }
    
    // Calculate assignment duration and overdue status
    const now = new Date()
    const assignedDate = new Date(assignment.assignedAt)
    const duration = assignment.returnedAt 
      ? Math.floor((new Date(assignment.returnedAt).getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const isOverdue = assignment.expectedReturnAt && 
                     assignment.status === 'active' && 
                     new Date(assignment.expectedReturnAt) < now
    
    const overdueDays = isOverdue && assignment.expectedReturnAt
      ? Math.floor((now.getTime() - new Date(assignment.expectedReturnAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    return NextResponse.json({
      success: true,
      data: {
        ...assignment,
        asset,
        user,
        assignedByUser,
        returnedByUser,
        duration,
        isOverdue,
        overdueDays,
      },
    })
    
  } catch (error: any) {
    const { id: assignmentIdForLog } = await params
    console.error(`GET /api/assignments/${assignmentIdForLog} error:`, error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 })
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Assignment not found',
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch assignment',
      message: error.message,
    }, { status: 500 })
  }
} 