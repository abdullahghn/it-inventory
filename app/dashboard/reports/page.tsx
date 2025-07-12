import Link from 'next/link'
import { db } from '@/lib/db'
import { assets, user, assetAssignments, maintenanceRecords } from '@/lib/db/schema'
import { auth, getCurrentUser, hasRole } from '@/lib/auth'
import { eq, and, desc, isNull, gte, lte, count, sum, avg, isNotNull } from 'drizzle-orm'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Users,
  Computer,
  Wrench,
  AlertTriangle,
  Download,
  Filter,
  Eye,
  Building2,
  Shield
} from 'lucide-react'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  
  // Get current user and check permissions
  const session = await auth()
  const currentUser = await getCurrentUser()
  
  if (!session?.user) {
    return <div>Access denied</div>
  }

  // Check permissions - managers+ can access reports
  const userRole = currentUser?.role || session.user.role || 'user'
  const canViewReports = userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin'
  
  if (!canViewReports) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access reports.</p>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center px-4 py-2 mt-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Parse date range from search params
  const dateFrom = typeof params.dateFrom === 'string' ? new Date(params.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const dateTo = typeof params.dateTo === 'string' ? new Date(params.dateTo) : new Date()

  // Calculate date ranges for different periods
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  // Fetch comprehensive analytics data
  const [
    totalAssets,
    totalUsers,
    totalAssignments,
    totalMaintenance,
    assetsByStatus,
    assetsByCategory,
    assetsByCondition,
    maintenanceByType,
    warrantyExpiring,
    overdueMaintenance,
    totalValue,
    averageAssetValue,
    usersByRole,
    usersByDepartment,
    recentActivity,
    topAssets,
    assetUtilization
  ] = await Promise.all([
    // Total counts
    db.select({ count: count() }).from(assets).where(eq(assets.isDeleted, false)),
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(assetAssignments),
    db.select({ count: count() }).from(maintenanceRecords),
    
    // Assets by status
    db.select({
      status: assets.status,
      count: count()
    }).from(assets).where(eq(assets.isDeleted, false)).groupBy(assets.status),
    
    // Assets by category
    db.select({
      category: assets.category,
      count: count()
    }).from(assets).where(eq(assets.isDeleted, false)).groupBy(assets.category),
    
    // Assets by condition
    db.select({
      condition: assets.condition,
      count: count()
    }).from(assets).where(eq(assets.isDeleted, false)).groupBy(assets.condition),
    
    // Maintenance by type
    db.select({
      type: maintenanceRecords.type,
      count: count()
    }).from(maintenanceRecords).groupBy(maintenanceRecords.type),
    
    // Warranty expiring soon
    db.select({ count: count() }).from(assets).where(
      and(
        eq(assets.isDeleted, false),
        isNotNull(assets.warrantyExpiry),
        gte(assets.warrantyExpiry, now),
        lte(assets.warrantyExpiry, new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000))
      )
    ),
    
    // Overdue maintenance
    db.select({ count: count() }).from(maintenanceRecords).where(
      and(
        eq(maintenanceRecords.isCompleted, false),
        isNotNull(maintenanceRecords.scheduledAt),
        lte(maintenanceRecords.scheduledAt, now)
      )
    ),
    
    // Total asset value
    db.select({ total: sum(assets.currentValue) }).from(assets).where(
      and(
        eq(assets.isDeleted, false),
        isNotNull(assets.currentValue)
      )
    ),
    
    // Average asset value
    db.select({ average: avg(assets.currentValue) }).from(assets).where(
      and(
        eq(assets.isDeleted, false),
        isNotNull(assets.currentValue)
      )
    ),
    
    // Users by role
    db.select({
      role: user.role,
      count: count()
    }).from(user).groupBy(user.role),
    
    // Users by department
    db.select({
      department: user.department,
      count: count()
    }).from(user).where(isNotNull(user.department)).groupBy(user.department),
    
    // Recent activity (last 10 assignments)
    db.select({
      id: assetAssignments.id,
      assetName: assets.name,
      userName: user.name,
      assignedAt: assetAssignments.assignedAt,
      returnedAt: assetAssignments.returnedAt,
    }).from(assetAssignments)
      .leftJoin(assets, eq(assetAssignments.assetId, assets.id))
      .leftJoin(user, eq(assetAssignments.userId, user.id))
      .orderBy(desc(assetAssignments.assignedAt))
      .limit(10),
    
    // Top assets by assignment count
    db.select({
      assetId: assetAssignments.assetId,
      assetName: assets.name,
      assignmentCount: count()
    }).from(assetAssignments)
      .leftJoin(assets, eq(assetAssignments.assetId, assets.id))
      .groupBy(assetAssignments.assetId, assets.name)
      .orderBy(desc(count()))
      .limit(5),
    
    // Asset utilization (assigned vs available)
    db.select({
      assigned: count()
    }).from(assets).where(
      and(
        eq(assets.isDeleted, false),
        eq(assets.status, 'assigned')
      )
    )
  ])

  // Calculate utilization percentage
  const totalAssetCount = totalAssets[0]?.count || 0
  const assignedAssetCount = assetUtilization[0]?.assigned || 0
  const utilizationPercentage = totalAssetCount > 0 ? (assignedAssetCount / totalAssetCount) * 100 : 0

  // Prepare chart data
  const chartData = {
    assetsByStatus: assetsByStatus.map(item => ({
      name: item.status || 'unknown',
      value: Number(item.count)
    })),
    assetsByCategory: assetsByCategory.map(item => ({
      name: item.category || 'unknown',
      value: Number(item.count)
    })),
    usersByRole: usersByRole.map(item => ({
      name: item.role || 'unknown',
      value: Number(item.count)
    })),
    maintenanceByType: maintenanceByType.map(item => ({
      name: item.type || 'unknown',
      value: Number(item.count)
    }))
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">
              Comprehensive insights into your IT inventory system
            </p>
      </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Assets</h3>
              <p className="text-3xl font-bold">{totalAssets[0]?.count || 0}</p>
              <p className="text-blue-100 text-sm">In inventory</p>
            </div>
            <Computer className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Asset Utilization</h3>
              <p className="text-3xl font-bold">{utilizationPercentage.toFixed(1)}%</p>
              <p className="text-green-100 text-sm">{assignedAssetCount} assigned</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Value</h3>
              <p className="text-3xl font-bold">
                ${totalValue[0]?.total ? parseFloat(totalValue[0].total.toString()).toLocaleString() : '0'}
              </p>
              <p className="text-purple-100 text-sm">Asset portfolio</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active Users</h3>
              <p className="text-3xl font-bold">{totalUsers[0]?.count || 0}</p>
              <p className="text-orange-100 text-sm">System users</p>
            </div>
            <Users className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Alerts and Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            System Alerts
          </h2>
          <div className="space-y-3">
            {warrantyExpiring[0]?.count > 0 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <Shield className="h-4 w-4 text-red-500 mr-3" />
                <div>
                  <p className="font-medium text-red-800">{warrantyExpiring[0].count} assets with expiring warranty</p>
                  <p className="text-sm text-red-600">Within 90 days</p>
                </div>
              </div>
            )}
            {overdueMaintenance[0]?.count > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Wrench className="h-4 w-4 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium text-yellow-800">{overdueMaintenance[0].count} overdue maintenance tasks</p>
                  <p className="text-sm text-yellow-600">Requires attention</p>
                </div>
              </div>
            )}
            {warrantyExpiring[0]?.count === 0 && overdueMaintenance[0]?.count === 0 && (
              <p className="text-gray-500 text-center py-4">No active alerts</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 py-2">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.assetName || 'Unknown Asset'}</span> {activity.returnedAt ? 'returned from' : 'assigned to'}{' '}
                    <span className="font-medium">{activity.userName || 'Unknown User'}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.assignedAt?.toLocaleDateString() || 'Unknown date'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Asset Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Asset Distribution by Status
          </h2>
          <div className="space-y-3">
            {chartData.assetsByStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    item.name === 'available' ? 'bg-green-500' :
                    item.name === 'assigned' ? 'bg-blue-500' :
                    item.name === 'maintenance' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-gray-700 capitalize">{item.name}</span>
                </div>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Categories */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Assets by Category
          </h2>
          <div className="space-y-3">
            {chartData.assetsByCategory.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-gray-700 capitalize">{item.name.replace('_', ' ')}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Statistics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
          <div className="space-y-3">
            {chartData.usersByRole.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-gray-700 capitalize">{item.name.replace('_', ' ')}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Statistics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Maintenance by Type</h2>
          <div className="space-y-3">
            {chartData.maintenanceByType.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-gray-700 capitalize">{item.name}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Assets */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Most Assigned Assets</h2>
          <div className="space-y-3">
            {topAssets.map((asset) => (
              <div key={asset.assetId} className="flex items-center justify-between">
                <span className="text-gray-700 truncate">{asset.assetName || 'Unknown Asset'}</span>
                <span className="font-semibold">{asset.assignmentCount} assignments</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Financial Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Total Asset Value</h3>
            <p className="text-3xl font-bold text-blue-600">
              ${totalValue[0]?.total ? parseFloat(totalValue[0].total.toString()).toLocaleString() : '0'}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Average Asset Value</h3>
            <p className="text-3xl font-bold text-green-600">
              ${averageAssetValue[0]?.average ? parseFloat(averageAssetValue[0].average.toString()).toFixed(2) : '0'}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Asset Utilization</h3>
            <p className="text-3xl font-bold text-purple-600">{utilizationPercentage.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
} 