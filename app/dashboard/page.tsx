import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assets, user, assetAssignments } from '@/lib/db/schema'
import { eq, and, isNull, count, sql, gte, lte } from 'drizzle-orm'
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { WarrantyAlerts } from '@/components/dashboard/WarrantyAlerts'
import { ReportsExport } from '@/components/dashboard/ReportsExport'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  FileText,
  Activity,
  Package,
  Users,
  Building
} from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Fetch dashboard data directly from database
  const fetchDashboardData = async () => {
    try {
      // Calculate date range (30 days)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      // Build base query conditions
      const baseConditions = [eq(assets.isDeleted, false)]
      
      // Add department filter based on user permissions
      const canViewAllDepartments = session.user.role === 'super_admin' || session.user.role === 'admin' || session.user.role === 'manager'
      if (!canViewAllDepartments) {
        // Users can only see their department's data
        baseConditions.push(eq(user.department, session.user.department || ''))
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
          dateRange: 30,
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
          dateRange: 30,
          department: 'all',
          userPermissions: {
            canViewAllDepartments,
            userDepartment: session.user.department,
          },
        },
      }

      return dashboardData
      
    } catch (error: any) {
      console.error('Dashboard data fetch error:', error)
      return null
    }
  }

  const dashboardData = await fetchDashboardData()

  // If no data available, show placeholder
  if (!dashboardData) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name}. Here's an overview of your IT assets.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            Last updated: {new Date(dashboardData.metadata.generatedAt).toLocaleString()}
          </Badge>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="warranty" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Warranty Alerts
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <DashboardMetrics 
            summary={dashboardData.summary}
            warrantyAlerts={dashboardData.warrantyAlerts}
            recentActivity={dashboardData.recentActivity}
            departmentMetrics={dashboardData.departmentMetrics || []}
          />

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.summary.totalAssets}</div>
                <p className="text-xs text-muted-foreground">
                  Across all categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.summary.assignedAssets}</div>
                <p className="text-xs text-muted-foreground">
                  Assets currently assigned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.summary.utilizationRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Asset utilization efficiency
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.departmentMetrics?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active departments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity Summary
              </CardTitle>
              <CardDescription>
                Latest assignments and returns in the last {dashboardData.summary.dateRange} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Assignments */}
                <div>
                  <h4 className="font-medium mb-3 text-green-700">Recent Assignments</h4>
                  <div className="space-y-2">
                    {dashboardData.recentActivity.assignments.slice(0, 5).map((assignment: any) => (
                      <div key={assignment.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{assignment.assetName}</p>
                          <p className="text-xs text-muted-foreground">
                            Assigned to {assignment.userName}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {dashboardData.recentActivity.assignments.length === 0 && (
                      <p className="text-sm text-muted-foreground">No recent assignments</p>
                    )}
                  </div>
                </div>

                {/* Recent Returns */}
                <div>
                  <h4 className="font-medium mb-3 text-blue-700">Recent Returns</h4>
                  <div className="space-y-2">
                    {dashboardData.recentActivity.returns.slice(0, 5).map((return_: any) => (
                      <div key={return_.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{return_.assetName}</p>
                          <p className="text-xs text-muted-foreground">
                            Returned by {return_.userName}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(return_.returnedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {dashboardData.recentActivity.returns.length === 0 && (
                      <p className="text-sm text-muted-foreground">No recent returns</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <DashboardCharts 
            statusBreakdown={dashboardData.statusBreakdown}
            categoryBreakdown={dashboardData.categoryBreakdown}
            conditionBreakdown={dashboardData.conditionBreakdown}
            departmentMetrics={(dashboardData.departmentMetrics || [])
              .map((dept: any) => ({
                ...dept,
                department: dept.department || 'Unassigned'
              }))
              .filter((dept: any, index: number, arr: any[]) => 
                arr.findIndex((d: any) => d.department === dept.department) === index
              )}
          />
        </TabsContent>

        {/* Warranty Alerts Tab */}
        <TabsContent value="warranty" className="space-y-4">
          <WarrantyAlerts 
            expiring30Days={dashboardData.warrantyAlerts.expiring30Days.map((asset: any) => ({
              ...asset,
              warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.toISOString() : ''
            }))}
            expiring60Days={dashboardData.warrantyAlerts.expiring60Days.map((asset: any) => ({
              ...asset,
              warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.toISOString() : ''
            }))}
            expiring90Days={dashboardData.warrantyAlerts.expiring90Days.map((asset: any) => ({
              ...asset,
              warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.toISOString() : ''
            }))}
            totalExpiring30Days={dashboardData.warrantyAlerts.totalExpiring30Days}
            totalExpiring60Days={dashboardData.warrantyAlerts.totalExpiring60Days}
            totalExpiring90Days={dashboardData.warrantyAlerts.totalExpiring90Days}
          />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <ReportsExport 
            departments={[...new Set((dashboardData.departmentMetrics || []).map((d: any) => d.department || 'Unassigned'))]}
            categories={dashboardData.categoryBreakdown.map((c: any) => c.category)}
            conditions={dashboardData.conditionBreakdown.map((c: any) => c.condition)}
            statuses={dashboardData.statusBreakdown.map((s: any) => s.status)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 