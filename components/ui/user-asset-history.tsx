'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading, EmptyState } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { RequireRole } from '@/components/auth/RoleGuard'
import { 
  Calendar, 
  Clock, 
  Package, 
  User, 
  Building, 
  MapPin,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

// Types for asset assignment history
export interface AssetAssignment {
  assignmentId: string
  assignmentStatus: string
  assignedAt: string
  expectedReturnAt: string | null
  returnedAt: string | null
  actualReturnCondition: string | null
  purpose: string | null
  notes: string | null
  returnNotes: string | null
  isActive: boolean
  
  // Asset details
  assetId: number
  assetTag: string
  assetName: string
  assetCategory: string
  assetStatus: string
  assetCondition: string
  assetModel: string | null
  assetManufacturer: string | null
  assetSerialNumber: string | null
  
  // Location
  building: string | null
  floor: string | null
  room: string | null
  desk: string | null
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

interface UserAssetHistoryProps {
  userId: string
  userName?: string
  showHeader?: boolean
  className?: string
  maxItems?: number
  showFilters?: boolean
  showExport?: boolean
  showRefresh?: boolean
}

// Helper function to get status badge variant
const getAssignmentStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'returned': return 'secondary'
    case 'overdue': return 'destructive'
    case 'lost': return 'destructive'
    default: return 'outline'
  }
}

// Helper function to get condition badge variant
const getConditionBadgeVariant = (condition: string) => {
  switch (condition) {
    case 'new': return 'default'
    case 'excellent': return 'success'
    case 'good': return 'info'
    case 'fair': return 'warning'
    case 'poor': return 'destructive'
    case 'damaged': return 'destructive'
    default: return 'secondary'
  }
}

// Helper function to format date
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Helper function to format datetime
const formatDateTime = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Helper function to calculate assignment duration
const calculateDuration = (assignedAt: string, returnedAt: string | null) => {
  const start = new Date(assignedAt)
  const end = returnedAt ? new Date(returnedAt) : new Date()
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Helper function to check if assignment is overdue
const isOverdue = (expectedReturnAt: string | null, status: string) => {
  if (!expectedReturnAt || status !== 'active') return false
  return new Date(expectedReturnAt) < new Date()
}

export function UserAssetHistory({
  userId,
  userName,
  showHeader = true,
  className,
  maxItems = 50,
  showFilters = true,
  showExport = true,
  showRefresh = true,
}: UserAssetHistoryProps) {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<AssetAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { error: showError } = useToast()

  // Fetch user's asset assignments
  const fetchAssignments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch(`/api/users/${userId}/assets?limit=${maxItems}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setAssignments(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch assignments')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignments'
      setError(errorMessage)
      showError('Failed to fetch asset history', errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchAssignments()
  }, [userId, maxItems])

  // Handle refresh
  const handleRefresh = () => {
    fetchAssignments(true)
  }

  // Handle export
  const handleExport = () => {
    const csvContent = [
      'Asset Tag,Asset Name,Category,Status,Assigned Date,Expected Return,Returned Date,Condition,Purpose,Notes',
      ...assignments.map(assignment => [
        assignment.assetTag,
        assignment.assetName,
        assignment.assetCategory,
        assignment.assignmentStatus,
        formatDate(assignment.assignedAt),
        formatDate(assignment.expectedReturnAt),
        formatDate(assignment.returnedAt),
        assignment.actualReturnCondition || 'N/A',
        assignment.purpose || 'N/A',
        assignment.notes || 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `asset-history-${userName || userId}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Table columns
  const columns: ColumnDef<AssetAssignment>[] = [
    {
      accessorKey: 'assetName',
      header: 'Asset',
      cell: ({ row }) => {
        const assignment = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium text-sm">{assignment.assetName}</div>
            <div className="text-xs text-muted-foreground font-mono">
              {assignment.assetTag}
            </div>
            <div className="text-xs text-muted-foreground">
              {assignment.assetCategory}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'assignmentStatus',
      header: 'Status',
      cell: ({ row }) => {
        const assignment = row.original
        const status = assignment.assignmentStatus
        const isOverdueAssignment = isOverdue(assignment.expectedReturnAt, status)
        
        return (
          <div className="space-y-1">
            <Badge variant={getAssignmentStatusBadgeVariant(status)}>
              {status}
            </Badge>
            {isOverdueAssignment && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'assignedAt',
      header: 'Assignment Period',
      cell: ({ row }) => {
        const assignment = row.original
        const duration = calculateDuration(assignment.assignedAt, assignment.returnedAt)
        
        return (
          <div className="space-y-1">
            <div className="text-sm">
              <Calendar className="inline h-3 w-3 mr-1" />
              {formatDate(assignment.assignedAt)}
            </div>
            {assignment.returnedAt && (
              <div className="text-sm">
                <Clock className="inline h-3 w-3 mr-1" />
                {formatDate(assignment.returnedAt)}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {duration} day{duration !== 1 ? 's' : ''}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'expectedReturnAt',
      header: 'Expected Return',
      cell: ({ row }) => {
        const assignment = row.original
        return (
          <div className="text-sm">
            {assignment.expectedReturnAt ? (
              formatDate(assignment.expectedReturnAt)
            ) : (
              <span className="text-muted-foreground">No date set</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'actualReturnCondition',
      header: 'Condition',
      cell: ({ row }) => {
        const assignment = row.original
        const condition = assignment.actualReturnCondition || assignment.assetCondition
        
        return condition ? (
          <Badge variant={getConditionBadgeVariant(condition)}>
            {condition}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">N/A</span>
        )
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const assignment = row.original
        const location = [assignment.building, assignment.floor, assignment.room, assignment.desk]
          .filter(Boolean)
          .join(', ')
        
        return location ? (
          <div className="text-sm">
            <MapPin className="inline h-3 w-3 mr-1" />
            {location}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not specified</span>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const assignment = row.original
        return (
          <a 
            href={`/dashboard/assets/${assignment.assetId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 px-3"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">View Asset</span>
          </a>
        )
      },
    },
  ]

  // Loading state
  if (loading) {
    return <PageLoading />
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-destructive mb-2">
              Failed to load asset history
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (assignments.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title="No Asset History"
            description={`${userName || 'This user'} hasn't been assigned any assets yet.`}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Asset Assignment History</span>
              </CardTitle>
              {userName && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing asset assignments for {userName}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {showRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
              )}
              {showExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                >
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <DataTable
          columns={columns}
          data={assignments}
          searchKey="assetName"
          searchPlaceholder="Search assets..."
          enableColumnFilter={showFilters}
          enableExport={false} // We handle export manually
          enableRefresh={false} // We handle refresh manually
          isLoading={refreshing}
          pageSize={10}
          emptyMessage="No asset assignments found."
        />
      </CardContent>
    </Card>
  )
}

// Wrapper component with RBAC protection
interface ProtectedUserAssetHistoryProps extends UserAssetHistoryProps {
  requireRole?: boolean
}

export function ProtectedUserAssetHistory({
  requireRole = true,
  ...props
}: ProtectedUserAssetHistoryProps) {
  if (!requireRole) {
    return <UserAssetHistory {...props} />
  }

  return (
    <RequireRole role="manager">
      <UserAssetHistory {...props} />
    </RequireRole>
  )
} 