'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileText, 
  Users, 
  Package, 
  AlertTriangle, 
  TrendingUp,
  Building,
  Calendar,
  Filter
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ReportsExportProps {
  departments?: string[]
  categories?: string[]
  conditions?: string[]
  statuses?: string[]
}

interface ReportConfig {
  type: string
  format: string
  filters: {
    department?: string
    category?: string
    status?: string
    condition?: string
    dateRange?: number
  }
}

export function ReportsExport({ 
  departments = [], 
  categories = [], 
  conditions = [], 
  statuses = [] 
}: ReportsExportProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'assets',
    format: 'csv',
    filters: {
      dateRange: 30
    }
  })

  // Report type definitions
  const reportTypes = [
    {
      value: 'assets',
      label: 'Assets Report',
      description: 'Complete asset inventory with details',
      icon: Package,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      value: 'assignments',
      label: 'Assignments Report',
      description: 'Asset assignment history and current status',
      icon: Users,
      color: 'bg-green-100 text-green-800'
    },
    {
      value: 'warranty',
      label: 'Warranty Report',
      description: 'Assets with expiring warranties',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800'
    },
    {
      value: 'utilization',
      label: 'Utilization Report',
      description: 'Asset utilization by category',
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      value: 'department',
      label: 'Department Report',
      description: 'Asset distribution by department',
      icon: Building,
      color: 'bg-orange-100 text-orange-800'
    }
  ]

  // Handle report generation
  const generateReport = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportConfig),
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'report.csv'

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        type: 'success',
        title: 'Report Generated',
        description: `${filename} has been downloaded successfully.`,
      })
    } catch (error) {
      console.error('Report generation error:', error)
      toast({
        type: 'error',
        title: 'Report Generation Failed',
        description: 'Failed to generate report. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update report configuration
  const updateConfig = (key: string, value: any) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.')
      setReportConfig(prev => {
        const newConfig = { ...prev }
        if (parent === 'filters') {
          newConfig.filters = { ...newConfig.filters, [child]: value }
        }
        return newConfig
      })
    } else {
      setReportConfig(prev => ({
        ...prev,
        [key]: value
      }))
    }
  }

  const selectedReport = reportTypes.find(r => r.value === reportConfig.type)

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Report Type
          </CardTitle>
          <CardDescription>
            Choose the type of report you want to generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const IconComponent = report.icon
              return (
                <div
                  key={report.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    reportConfig.type === report.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateConfig('type', report.value)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${report.color}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{report.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {report.description}
                      </p>
                    </div>
                    {reportConfig.type === report.value && (
                      <Badge variant="secondary" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Configuration
          </CardTitle>
          <CardDescription>
            Configure report format and filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select
                value={reportConfig.format}
                onValueChange={(value) => updateConfig('format', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel" disabled>Excel (Coming Soon)</SelectItem>
                  <SelectItem value="pdf" disabled>PDF (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range (Days)</Label>
              <Select
                value={reportConfig.filters.dateRange?.toString()}
                onValueChange={(value) => updateConfig('filters.dateRange', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

                         {/* Department Filter */}
             {departments.length > 0 && (
               <div className="space-y-2">
                 <Label htmlFor="department">Department</Label>
                 <Select
                   value={reportConfig.filters.department || 'all'}
                   onValueChange={(value) => updateConfig('filters.department', value === 'all' ? '' : value)}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="All departments" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All departments</SelectItem>
                     {departments.map((dept) => (
                       <SelectItem key={dept} value={dept}>
                         {dept}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}

             {/* Category Filter */}
             {categories.length > 0 && (
               <div className="space-y-2">
                 <Label htmlFor="category">Category</Label>
                 <Select
                   value={reportConfig.filters.category || 'all'}
                   onValueChange={(value) => updateConfig('filters.category', value === 'all' ? '' : value)}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="All categories" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All categories</SelectItem>
                     {categories.map((category) => (
                       <SelectItem key={category} value={category}>
                         {category}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}

             {/* Status Filter */}
             {statuses.length > 0 && (
               <div className="space-y-2">
                 <Label htmlFor="status">Status</Label>
                 <Select
                   value={reportConfig.filters.status || 'all'}
                   onValueChange={(value) => updateConfig('filters.status', value === 'all' ? '' : value)}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="All statuses" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All statuses</SelectItem>
                     {statuses.map((status) => (
                       <SelectItem key={status} value={status}>
                         {status}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}

             {/* Condition Filter */}
             {conditions.length > 0 && (
               <div className="space-y-2">
                 <Label htmlFor="condition">Condition</Label>
                 <Select
                   value={reportConfig.filters.condition || 'all'}
                   onValueChange={(value) => updateConfig('filters.condition', value === 'all' ? '' : value)}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="All conditions" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All conditions</SelectItem>
                     {conditions.map((condition) => (
                       <SelectItem key={condition} value={condition}>
                         {condition}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}
          </div>
        </CardContent>
      </Card>

      {/* Generate Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Generate Report
          </CardTitle>
          <CardDescription>
            {selectedReport && `Generate ${selectedReport.label} in ${reportConfig.format.toUpperCase()} format`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedReport && (
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${selectedReport.color}`}>
                    <selectedReport.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedReport.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedReport.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Button 
              onClick={generateReport} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 