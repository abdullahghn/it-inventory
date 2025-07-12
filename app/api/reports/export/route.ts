import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { assets, user, assetAssignments } from '@/lib/db/schema'
import { requireAuth, getCurrentUser, hasRole } from '@/lib/auth'
import { eq, and, isNull, gte, lte, like, inArray } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// ============================================================================
// POST /api/reports/export - Generate and export reports
// ============================================================================

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { 
      reportType, 
      format = 'csv', 
      filters = {},
      dateRange = 30 
    } = body

    // Validate report type
    const validReportTypes = [
      'assets', 
      'assignments', 
      'warranty', 
      'utilization', 
      'department'
    ]
    
    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid report type',
      }, { status: 400 })
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))

    // Build base query conditions
    const baseConditions = [eq(assets.isDeleted, false)]
    
    // Apply filters
    if (filters.department && await hasRole('manager')) {
      baseConditions.push(eq(user.department, filters.department))
    } else if (!(await hasRole('manager'))) {
      // Users can only see their department's data
      baseConditions.push(eq(user.department, currentUser.department || ''))
    }

    if (filters.category) {
      baseConditions.push(eq(assets.category, filters.category))
    }

    if (filters.status) {
      baseConditions.push(eq(assets.status, filters.status))
    }

    if (filters.condition) {
      baseConditions.push(eq(assets.condition, filters.condition))
    }

    // ============================================================================
    // GENERATE REPORT DATA BASED ON TYPE
    // ============================================================================
    
    let reportData: any[] = []
    let fileName = ''
    let headers: string[] = []

    switch (reportType) {
      case 'assets':
        // Assets report
        const assetsData = await db
          .select({
            assetTag: assets.assetTag,
            name: assets.name,
            category: assets.category,
            status: assets.status,
            condition: assets.condition,
            manufacturer: assets.manufacturer,
            model: assets.model,
            serialNumber: assets.serialNumber,
            purchaseDate: assets.purchaseDate,
            purchasePrice: assets.purchasePrice,
            warrantyExpiry: assets.warrantyExpiry,
            building: assets.building,
            floor: assets.floor,
            room: assets.room,
            assignedTo: user.name,
            assignedDate: assetAssignments.assignedAt,
            createdAt: assets.createdAt,
          })
          .from(assets)
          .leftJoin(assetAssignments, and(
            eq(assets.id, assetAssignments.assetId),
            eq(assetAssignments.isActive, true)
          ))
          .leftJoin(user, eq(assetAssignments.userId, user.id))
          .where(and(...baseConditions))
          .orderBy(assets.assetTag)

        reportData = assetsData.map(asset => ({
          'Asset Tag': asset.assetTag,
          'Name': asset.name,
          'Category': asset.category,
          'Status': asset.status,
          'Condition': asset.condition,
          'Manufacturer': asset.manufacturer || 'N/A',
          'Model': asset.model || 'N/A',
          'Serial Number': asset.serialNumber || 'N/A',
          'Purchase Date': asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A',
          'Purchase Price': asset.purchasePrice ? `$${asset.purchasePrice}` : 'N/A',
          'Warranty Expiry': asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A',
          'Building': asset.building || 'N/A',
          'Floor': asset.floor || 'N/A',
          'Room': asset.room || 'N/A',
          'Assigned To': asset.assignedTo || 'Unassigned',
          'Assigned Date': asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString() : 'N/A',
          'Created Date': new Date(asset.createdAt).toLocaleDateString(),
        }))

        headers = Object.keys(reportData[0] || {})
        fileName = `assets-report-${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'assignments':
        // Assignments report
        const assignmentsData = await db
          .select({
            assignmentId: assetAssignments.id,
            assetTag: assets.assetTag,
            assetName: assets.name,
            assetCategory: assets.category,
            assignedTo: user.name,
            assignedBy: sql<string>`(SELECT name FROM user WHERE id = ${assetAssignments.assignedBy})`,
            assignedDate: assetAssignments.assignedAt,
            returnedDate: assetAssignments.returnedAt,
            expectedReturnDate: assetAssignments.expectedReturnAt,
            returnCondition: assetAssignments.actualReturnCondition,
            purpose: assetAssignments.purpose,
            notes: assetAssignments.notes,
            isActive: assetAssignments.isActive,
          })
          .from(assetAssignments)
          .leftJoin(assets, eq(assetAssignments.assetId, assets.id))
          .leftJoin(user, eq(assetAssignments.userId, user.id))
          .where(gte(assetAssignments.assignedAt, startDate))
          .orderBy(assetAssignments.assignedAt)

        reportData = assignmentsData.map(assignment => ({
          'Assignment ID': assignment.assignmentId,
          'Asset Tag': assignment.assetTag,
          'Asset Name': assignment.assetName,
          'Asset Category': assignment.assetCategory,
          'Assigned To': assignment.assignedTo,
          'Assigned By': assignment.assignedBy,
          'Assigned Date': new Date(assignment.assignedDate).toLocaleDateString(),
          'Returned Date': assignment.returnedDate ? new Date(assignment.returnedDate).toLocaleDateString() : 'Active',
          'Expected Return': assignment.expectedReturnDate ? new Date(assignment.expectedReturnDate).toLocaleDateString() : 'Indefinite',
          'Return Condition': assignment.returnCondition || 'N/A',
          'Purpose': assignment.purpose || 'N/A',
          'Notes': assignment.notes || 'N/A',
          'Status': assignment.isActive ? 'Active' : 'Returned',
        }))

        headers = Object.keys(reportData[0] || {})
        fileName = `assignments-report-${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'warranty':
        // Warranty expiration report
        const now = new Date()
        const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

        const warrantyData = await db
          .select({
            assetTag: assets.assetTag,
            name: assets.name,
            category: assets.category,
            manufacturer: assets.manufacturer,
            model: assets.model,
            warrantyExpiry: assets.warrantyExpiry,
            assignedTo: user.name,
            daysUntilExpiry: sql<number>`EXTRACT(DAY FROM (${assets.warrantyExpiry} - NOW()))`,
          })
          .from(assets)
          .leftJoin(assetAssignments, and(
            eq(assets.id, assetAssignments.assetId),
            eq(assetAssignments.isActive, true)
          ))
          .leftJoin(user, eq(assetAssignments.userId, user.id))
          .where(and(
            ...baseConditions,
            gte(assets.warrantyExpiry, now),
            lte(assets.warrantyExpiry, ninetyDaysFromNow)
          ))
          .orderBy(assets.warrantyExpiry)

        reportData = warrantyData.map(item => ({
          'Asset Tag': item.assetTag,
          'Name': item.name,
          'Category': item.category,
          'Manufacturer': item.manufacturer || 'N/A',
          'Model': item.model || 'N/A',
          'Warranty Expiry': item.warrantyExpiry ? new Date(item.warrantyExpiry).toLocaleDateString() : 'N/A',
          'Days Until Expiry': Math.ceil(item.daysUntilExpiry || 0),
          'Assigned To': item.assignedTo || 'Unassigned',
          'Alert Level': item.daysUntilExpiry <= 30 ? 'Critical' : item.daysUntilExpiry <= 60 ? 'Warning' : 'Info',
        }))

        headers = Object.keys(reportData[0] || {})
        fileName = `warranty-report-${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'utilization':
        // Asset utilization report
        const utilizationData = await db
          .select({
            category: assets.category,
            totalAssets: sql<number>`COUNT(${assets.id})`,
            assignedAssets: sql<number>`COUNT(CASE WHEN ${assets.status} = 'assigned' THEN 1 END)`,
            availableAssets: sql<number>`COUNT(CASE WHEN ${assets.status} = 'available' THEN 1 END)`,
            maintenanceAssets: sql<number>`COUNT(CASE WHEN ${assets.status} = 'maintenance' THEN 1 END)`,
            retiredAssets: sql<number>`COUNT(CASE WHEN ${assets.status} = 'retired' THEN 1 END)`,
          })
          .from(assets)
          .where(and(...baseConditions))
          .groupBy(assets.category)
          .orderBy(assets.category)

        reportData = utilizationData.map(item => ({
          'Category': item.category,
          'Total Assets': item.totalAssets,
          'Assigned': item.assignedAssets,
          'Available': item.availableAssets,
          'In Maintenance': item.maintenanceAssets,
          'Retired': item.retiredAssets,
          'Utilization Rate': `${Math.round((item.assignedAssets / item.totalAssets) * 100)}%`,
        }))

        headers = Object.keys(reportData[0] || {})
        fileName = `utilization-report-${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'department':
        // Department-wise asset report
        if (!(await hasRole('manager'))) {
          return NextResponse.json({
            success: false,
            error: 'Insufficient permissions for department report',
          }, { status: 403 })
        }

        const departmentData = await db
          .select({
            department: user.department,
            totalAssets: sql<number>`COUNT(${assets.id})`,
            assignedAssets: sql<number>`COUNT(CASE WHEN ${assets.status} = 'assigned' THEN 1 END)`,
            availableAssets: sql<number>`COUNT(CASE WHEN ${assets.status} = 'available' THEN 1 END)`,
            totalUsers: sql<number>`COUNT(DISTINCT ${user.id})`,
            avgAssetsPerUser: sql<number>`ROUND(COUNT(${assets.id})::DECIMAL / NULLIF(COUNT(DISTINCT ${user.id}), 0), 2)`,
          })
          .from(assets)
          .leftJoin(assetAssignments, eq(assets.id, assetAssignments.assetId))
          .leftJoin(user, eq(assetAssignments.userId, user.id))
          .where(and(...baseConditions))
          .groupBy(user.department)
          .orderBy(user.department)

        reportData = departmentData.map(item => ({
          'Department': item.department || 'Unassigned',
          'Total Assets': item.totalAssets,
          'Assigned Assets': item.assignedAssets,
          'Available Assets': item.availableAssets,
          'Total Users': item.totalUsers,
          'Avg Assets Per User': item.avgAssetsPerUser || 0,
          'Utilization Rate': `${Math.round((item.assignedAssets / item.totalAssets) * 100)}%`,
        }))

        headers = Object.keys(reportData[0] || {})
        fileName = `department-report-${new Date().toISOString().split('T')[0]}.csv`
        break
    }

    // ============================================================================
    // GENERATE CSV CONTENT
    // ============================================================================
    
    if (format === 'csv') {
      // Create CSV content
      const csvHeaders = headers.join(',')
      const csvRows = reportData.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
      
      const csvContent = [csvHeaders, ...csvRows].join('\n')

      // Return CSV file
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    }

    // For future: Add Excel export support
    return NextResponse.json({
      success: false,
      error: 'Unsupported export format',
    }, { status: 400 })
    
  } catch (error: any) {
    console.error('POST /api/reports/export error:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate report',
      message: error.message,
    }, { status: 500 })
  }
} 