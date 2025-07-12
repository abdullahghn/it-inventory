'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

interface DashboardChartsProps {
  statusBreakdown: Array<{
    status: string
    count: number
    percentage: number
  }>
  categoryBreakdown: Array<{
    category: string
    count: number
    percentage: number
  }>
  conditionBreakdown: Array<{
    condition: string
    count: number
    percentage: number
  }>
  departmentMetrics?: Array<{
    department: string
    assetCount: number
    assignedCount: number
  }>
}

// Color palette for charts
const COLORS = {
  status: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  category: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
  condition: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
  department: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.payload.status || entry.payload.category || entry.payload.condition}: {entry.value} ({entry.payload.percentage}%)
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function DashboardCharts({ 
  statusBreakdown, 
  categoryBreakdown, 
  conditionBreakdown,
  departmentMetrics 
}: DashboardChartsProps) {
  // Format data for pie charts
  const formatPieData = (data: any[], colorKey: keyof typeof COLORS) => {
    return data.map((item, index) => ({
      ...item,
      fill: COLORS[colorKey][index % COLORS[colorKey].length]
    }))
  }

  // Format department data for bar chart
  const formatDepartmentData = (data: any[]) => {
    return data?.map((dept, index) => ({
      ...dept,
      utilization: Math.round((dept.assignedCount / dept.assetCount) * 100),
      fill: COLORS.department[index % COLORS.department.length]
    })) || []
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Asset Status Distribution - Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Status Distribution</CardTitle>
          <CardDescription>
            Current status of all assets in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formatPieData(statusBreakdown, 'status')}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percentage }) => `${status} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.status[index % COLORS.status.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, textTransform: 'capitalize' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Asset Category Distribution - Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Category Distribution</CardTitle>
          <CardDescription>
            Breakdown of assets by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formatPieData(categoryBreakdown, 'category')}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.category[index % COLORS.category.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, textTransform: 'capitalize' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Asset Condition Distribution - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Condition Overview</CardTitle>
          <CardDescription>
            Distribution of assets by condition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conditionBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="condition" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department Utilization - Bar Chart */}
      {departmentMetrics && departmentMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Department Utilization</CardTitle>
            <CardDescription>
              Asset utilization rates by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatDepartmentData(departmentMetrics)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="department" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p>Total Assets: {data.assetCount}</p>
                          <p>Assigned: {data.assignedCount}</p>
                          <p>Utilization: {data.utilization}%</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="utilization" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Asset Status Trend - Line Chart (if we had historical data) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Asset Status Trends</CardTitle>
          <CardDescription>
            Monthly asset status changes (placeholder for future implementation)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">Historical Data Not Available</p>
              <p className="text-sm">
                This chart will display asset status trends over time when historical data is implemented.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 