'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Building,
  Activity
} from 'lucide-react'

interface DashboardMetricsProps {
  summary: {
    totalAssets: number
    assignedAssets: number
    availableAssets: number
    utilizationRate: number
    dateRange: number
  }
  warrantyAlerts: {
    totalExpiring30Days: number
    totalExpiring60Days: number
    totalExpiring90Days: number
  }
  recentActivity: {
    assignments: any[]
    returns: any[]
  }
  departmentMetrics?: any[]
}

export function DashboardMetrics({ 
  summary, 
  warrantyAlerts, 
  recentActivity,
  departmentMetrics 
}: DashboardMetricsProps) {
  // Calculate additional metrics
  const totalWarrantyAlerts = warrantyAlerts.totalExpiring30Days + 
                             warrantyAlerts.totalExpiring60Days + 
                             warrantyAlerts.totalExpiring90Days

  const recentAssignmentsCount = recentActivity.assignments.length
  const recentReturnsCount = recentActivity.returns.length

  // Get utilization status and color
  const getUtilizationStatus = (rate: number) => {
    if (rate >= 80) return { status: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' }
    if (rate >= 60) return { status: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' }
    if (rate >= 40) return { status: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-700' }
    return { status: 'Low', color: 'bg-red-500', textColor: 'text-red-700' }
  }

  const utilizationStatus = getUtilizationStatus(summary.utilizationRate)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Assets Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalAssets.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Across all categories and statuses
          </p>
        </CardContent>
      </Card>

      {/* Utilization Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.utilizationRate}%</div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="secondary" 
              className={`${utilizationStatus.color} ${utilizationStatus.textColor} border-0`}
            >
              {utilizationStatus.status}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {summary.assignedAssets} of {summary.totalAssets} assigned
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Available Assets Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Assets</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.availableAssets.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Ready for assignment
          </p>
        </CardContent>
      </Card>

      {/* Warranty Alerts Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Warranty Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalWarrantyAlerts}</div>
          <div className="flex flex-col space-y-1 mt-2">
            {warrantyAlerts.totalExpiring30Days > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600 font-medium">Critical (30 days)</span>
                <Badge variant="destructive" className="text-xs">
                  {warrantyAlerts.totalExpiring30Days}
                </Badge>
              </div>
            )}
            {warrantyAlerts.totalExpiring60Days > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-600 font-medium">Warning (60 days)</span>
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  {warrantyAlerts.totalExpiring60Days}
                </Badge>
              </div>
            )}
            {warrantyAlerts.totalExpiring90Days > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-600 font-medium">Info (90 days)</span>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  {warrantyAlerts.totalExpiring90Days}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Last {summary.dateRange} days of assignments and returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Assignments</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {recentAssignmentsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                New asset assignments
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Returns</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {recentReturnsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Assets returned
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Overview Card */}
      {departmentMetrics && departmentMetrics.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Department Overview
            </CardTitle>
            <CardDescription>
              Asset distribution across departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departmentMetrics.slice(0, 5).map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">
                      {dept.department || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {dept.assignedCount}/{dept.assetCount}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round((dept.assignedCount / dept.assetCount) * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
              {departmentMetrics.length > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  +{departmentMetrics.length - 5} more departments
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 