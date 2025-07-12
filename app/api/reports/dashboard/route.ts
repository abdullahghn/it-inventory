import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { assets, user, assetAssignments } from '@/lib/db/schema'
import { requireAuth, getCurrentUser, hasRole } from '@/lib/auth'
import { eq, and, isNull, count, sql, gte, lte } from 'drizzle-orm'

// ============================================================================
// GET /api/reports/dashboard - Get dashboard metrics and KPIs
// ============================================================================

export async function GET(request: NextRequest) {
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

    // Parse query parameters for date filtering
    const url = new URL(request.url)
    const dateRange = url.searchParams.get('dateRange') || '30' // Default to 30 days
    const department = url.searchParams.get('department') || null

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))

    // Build base query conditions
    const baseConditions = [eq(assets.isDeleted, false)]
    
    // Add department filter if specified and user has permissions
    const canViewAllDepartments = await hasRole('manager')
    if (department && canViewAllDepartments) {
      baseConditions.push(eq(user.department, department))
    } else if (!canViewAllDepartments) {
      // Users can only see their department's data
      baseConditions.push(eq(user.department, currentUser.department || ''))
    }

    // ============================================================================
    // ASSET COUNT METRICS
    // ============================================================================
    
    // Total assets count
    const totalAssetsResult = await db
      .select({ count: count() })
      .from(assets)
      .where(and(...baseConditions))
      .then(result => result[0]?.count || 0)

    // Assets by status
    const assetsByStatus = await db
      .select({
        status: assets.status,
        count: count(),
      })
      .from(assets)
      .where(and(...baseConditions))
      .groupBy(assets.status)

    // Assets by category
    const assetsByCategory = await db
      .select({
        category: assets.category,
        count: count(),
      })
      .from(assets)
      .where(and(...baseConditions))
      .groupBy(assets.category)

    // ============================================================================
    // UTILIZATION METRICS
    // ============================================================================
    
    // Currently assigned assets
    const assignedAssetsResult = await db
      .select({ count: count() })
      .from(assets)
      .where(and(...baseConditions, eq(assets.status, 'assigned')))
      .then(result => result[0]?.count || 0)

    // Available assets
    const availableAssetsResult = await db
      .select({ count: count() })
      .from(assets)
      .where(and(...baseConditions, eq(assets.status, 'available')))
      .then(result => result[0]?.count || 0)

    // Calculate utilization rate
    const utilizationRate = totalAssetsResult > 0 
      ? Math.round((assignedAssetsResult / totalAssetsResult) * 100) 
      : 0

    // ============================================================================
    // WARRANTY EXPIRATION ALERTS
    // ============================================================================
    
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    // Assets with warranty expiring in 30 days
    const warrantyExpiring30Days = await db
      .select({
        id: assets.id,
        assetTag: assets.assetTag,
        name: assets.name,
        warrantyExpiry: assets.warrantyExpiry,
        category: assets.category,
      })
      .from(assets)
      .where(and(
        ...baseConditions,
        gte(assets.warrantyExpiry, now),
        lte(assets.warrantyExpiry, thirtyDaysFromNow)
      ))
      .limit(10)

    // Assets with warranty expiring in 60 days
    const warrantyExpiring60Days = await db
      .select({
        id: assets.id,
        assetTag: assets.assetTag,
        name: assets.name,
        warrantyExpiry: assets.warrantyExpiry,
        category: assets.category,
      })
      .from(assets)
      .where(and(
        ...baseConditions,
        gte(assets.warrantyExpiry, thirtyDaysFromNow),
        lte(assets.warrantyExpiry, sixtyDaysFromNow)
      ))
      .limit(10)

    // Assets with warranty expiring in 90 days
    const warrantyExpiring90Days = await db
      .select({
        id: assets.id,
        assetTag: assets.assetTag,
        name: assets.name,
        warrantyExpiry: assets.warrantyExpiry,
        category: assets.category,
      })
      .from(assets)
      .where(and(
        ...baseConditions,
        gte(assets.warrantyExpiry, sixtyDaysFromNow),
        lte(assets.warrantyExpiry, ninetyDaysFromNow)
      ))
      .limit(10)

    // ============================================================================
    // RECENT ACTIVITY METRICS
    // ============================================================================
    
    // Recent assignments (last 30 days)
    const recentAssignments = await db
      .select({
        id: assetAssignments.id,
        assetId: assetAssignments.assetId,
        userId: assetAssignments.userId,
        assignedAt: assetAssignments.assignedAt,
        assetName: assets.name,
        assetTag: assets.assetTag,
        userName: user.name,
      })
      .from(assetAssignments)
      .leftJoin(assets, eq(assetAssignments.assetId, assets.id))
      .leftJoin(user, eq(assetAssignments.userId, user.id))
      .where(and(
        gte(assetAssignments.assignedAt, startDate),
        eq(assetAssignments.isActive, true)
      ))
      .orderBy(assetAssignments.assignedAt)
      .limit(10)

    // Recent returns (last 30 days)
    const recentReturns = await db
      .select({
        id: assetAssignments.id,
        assetId: assetAssignments.assetId,
        userId: assetAssignments.userId,
        returnedAt: assetAssignments.returnedAt,
        assetName: assets.name,
        assetTag: assets.assetTag,
        userName: user.name,
      })
      .from(assetAssignments)
      .leftJoin(assets, eq(assetAssignments.assetId, assets.id))
      .leftJoin(user, eq(assetAssignments.userId, user.id))
      .where(and(
        gte(assetAssignments.returnedAt, startDate),
        isNull(assetAssignments.isActive)
      ))
      .orderBy(assetAssignments.returnedAt)
      .limit(10)

    // ============================================================================
    // DEPARTMENT METRICS (if user has permissions)
    // ============================================================================
    
    let departmentMetrics = null
    if (canViewAllDepartments) {
      departmentMetrics = await db
        .select({
          department: user.department,
          assetCount: count(assets.id),
          assignedCount: sql<number>`COUNT(CASE WHEN ${assets.status} = 'assigned' THEN 1 END)`,
        })
        .from(assets)
        .leftJoin(assetAssignments, eq(assets.id, assetAssignments.assetId))
        .leftJoin(user, eq(assetAssignments.userId, user.id))
        .where(and(...baseConditions))
        .groupBy(user.department)
        .orderBy(user.department)
    }

    // ============================================================================
    // CONDITION METRICS
    // ============================================================================
    
    const assetsByCondition = await db
      .select({
        condition: assets.condition,
        count: count(),
      })
      .from(assets)
      .where(and(...baseConditions))
      .groupBy(assets.condition)

    // ============================================================================
    // COMPILE DASHBOARD DATA
    // ============================================================================
    
    const dashboardData = {
      // Summary metrics
      summary: {
        totalAssets: totalAssetsResult,
        assignedAssets: assignedAssetsResult,
        availableAssets: availableAssetsResult,
        utilizationRate,
        dateRange: parseInt(dateRange),
      },
      
      // Status breakdown
      statusBreakdown: assetsByStatus.map(item => ({
        status: item.status,
        count: item.count,
        percentage: Math.round((item.count / totalAssetsResult) * 100),
      })),
      
      // Category breakdown
      categoryBreakdown: assetsByCategory.map(item => ({
        category: item.category,
        count: item.count,
        percentage: Math.round((item.count / totalAssetsResult) * 100),
      })),
      
      // Condition breakdown
      conditionBreakdown: assetsByCondition.map(item => ({
        condition: item.condition,
        count: item.count,
        percentage: Math.round((item.count / totalAssetsResult) * 100),
      })),
      
      // Warranty alerts
      warrantyAlerts: {
        expiring30Days: warrantyExpiring30Days,
        expiring60Days: warrantyExpiring60Days,
        expiring90Days: warrantyExpiring90Days,
        totalExpiring30Days: warrantyExpiring30Days.length,
        totalExpiring60Days: warrantyExpiring60Days.length,
        totalExpiring90Days: warrantyExpiring90Days.length,
      },
      
      // Recent activity
      recentActivity: {
        assignments: recentAssignments,
        returns: recentReturns,
      },
      
      // Department metrics (if available)
      departmentMetrics,
      
      // Metadata
      metadata: {
        generatedAt: new Date().toISOString(),
        dateRange: parseInt(dateRange),
        department: department || 'all',
        userPermissions: {
          canViewAllDepartments,
          userDepartment: currentUser.department,
        },
      },
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
    })
    
  } catch (error: any) {
    console.error('GET /api/reports/dashboard error:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard metrics',
      message: error.message,
    }, { status: 500 })
  }
} 