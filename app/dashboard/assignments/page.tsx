import Link from 'next/link'
import { db } from '@/lib/db'
import { assets, assetAssignments, user } from '@/lib/db/schema'
import { eq, and, desc, count, like, inArray, or } from 'drizzle-orm'
import { hasRole, auth, getCurrentUser } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronRight, User, Calendar, Clock, Package, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'
import SearchFilters from './components/SearchFilters'

// Search and filter parameters
interface SearchParams {
  search?: string
  status?: string
  category?: string
  page?: string
  view?: 'card' | 'table'
}

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  // Check permissions and get current user
  const session = await auth()
  const currentUser = await getCurrentUser()
  const canManageAssignments = await hasRole('manager')
  
  if (!session?.user) {
    return <div>Access denied</div>
  }

  // Parse search and filter parameters
  const params = await searchParams
  const search = params.search || ''
  const status = params.status || 'all'
  const category = params.category || 'all'
  const page = parseInt(params.page || '1')
  const view = params.view || 'card'
  const limit = 20
  const offset = (page - 1) * limit

  // Build where conditions for assets
  const whereConditions = [eq(assets.isDeleted, false)]

  // Search filter
  if (search) {
    whereConditions.push(
      or(
        like(assets.name, `%${search}%`),
        like(assets.assetTag, `%${search}%`),
        like(assets.serialNumber, `%${search}%`),
        like(assets.manufacturer, `%${search}%`),
        like(assets.model, `%${search}%`)
      )!
    )
  }

  // Status filter
  if (status !== 'all') {
    whereConditions.push(eq(assets.status, status as any))
  }

  // Category filter
  if (category !== 'all') {
    whereConditions.push(eq(assets.category, category as any))
  }

  // Get total count for pagination
  const totalCount = await db
    .select({ count: count() })
    .from(assets)
    .where(and(...whereConditions))
    .then(result => result[0]?.count || 0)

  // Fetch assets with pagination
  const assetsWithAssignments = await db
    .select({
      // Asset details
      id: assets.id,
      name: assets.name,
      assetTag: assets.assetTag,
      category: assets.category,
      status: assets.status,
      condition: assets.condition,
      model: assets.model,
      manufacturer: assets.manufacturer,
      serialNumber: assets.serialNumber,
      description: assets.description,
      building: assets.building,
      floor: assets.floor,
      room: assets.room,
      desk: assets.desk,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
    })
    .from(assets)
    .where(and(...whereConditions))
    .orderBy(desc(assets.createdAt))
    .limit(limit)
    .offset(offset)

  // For each asset, get current assignment and history
  const assetsWithDetails = await Promise.all(
    assetsWithAssignments.map(async (asset) => {
      // Get current assignment (if any)
      const currentAssignment = await db
        .select({
          id: assetAssignments.id,
          userId: assetAssignments.userId,
          status: assetAssignments.status,
          assignedAt: assetAssignments.assignedAt,
          expectedReturnAt: assetAssignments.expectedReturnAt,
          returnedAt: assetAssignments.returnedAt,
          notes: assetAssignments.notes,
          purpose: assetAssignments.purpose,
          assignedBy: assetAssignments.assignedBy,
          isActive: assetAssignments.isActive,
          userName: user.name,
          userEmail: user.email,
        })
        .from(assetAssignments)
        .leftJoin(user, eq(assetAssignments.userId, user.id))
        .where(
          and(
            eq(assetAssignments.assetId, asset.id),
            eq(assetAssignments.isActive, true)
          )
        )
        .limit(1)

      // Get assignment history (last 5 assignments)
      const assignmentHistory = await db
        .select({
          id: assetAssignments.id,
          userId: assetAssignments.userId,
          status: assetAssignments.status,
          assignedAt: assetAssignments.assignedAt,
          returnedAt: assetAssignments.returnedAt,
          notes: assetAssignments.notes,
          purpose: assetAssignments.purpose,
          assignedBy: assetAssignments.assignedBy,
          returnedBy: assetAssignments.returnedBy,
          isActive: assetAssignments.isActive,
          userName: user.name,
          userEmail: user.email,
        })
        .from(assetAssignments)
        .leftJoin(user, eq(assetAssignments.userId, user.id))
        .where(eq(assetAssignments.assetId, asset.id))
        .orderBy(desc(assetAssignments.assignedAt))
        .limit(5)

      // Get total assignment count
      const assignmentCount = await db
        .select({ count: count() })
        .from(assetAssignments)
        .where(eq(assetAssignments.assetId, asset.id))

      return {
        ...asset,
        currentAssignment: currentAssignment[0] || null,
        assignmentHistory: assignmentHistory,
        totalAssignments: assignmentCount[0]?.count || 0,
      }
    })
  )

  // Filter assets based on user permissions
  let filteredAssets = assetsWithDetails
  if (!canManageAssignments) {
    // Users can only see assets they have been assigned
    filteredAssets = assetsWithDetails.filter(asset => 
      asset.assignmentHistory.some(assignment => 
        assignment.userId === currentUser?.id
      )
    )
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'assigned' && isActive) {
      return <Badge className="bg-blue-100 text-blue-800">Assigned</Badge>
    } else if (status === 'available') {
      return <Badge className="bg-green-100 text-green-800">Available</Badge>
    } else if (status === 'returned') {
      return <Badge className="bg-gray-100 text-gray-800">Returned</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'laptop':
        return '💻'
      case 'desktop':
        return '🖥️'
      case 'monitor':
        return '🖥️'
      case 'printer':
        return '🖨️'
      case 'phone':
        return '📱'
      case 'tablet':
        return '📱'
      case 'server':
        return '🖥️'
      case 'network_device':
        return '🌐'
      case 'software_license':
        return '📄'
      case 'toner':
        return '🖨️'
      default:
        return '📦'
    }
  }

  const totalPages = Math.ceil(totalCount / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  // Build URL with search params
  const buildUrl = (newParams: Partial<SearchParams>) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    if (category !== 'all') params.set('category', category)
    if (view !== 'card') params.set('view', view)
    
    // Add new params
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value.toString())
    })
    
    return `/dashboard/assignments?${params.toString()}`
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Assignments</h1>
          <p className="text-gray-600">Asset-centric view of equipment assignments</p>
        </div>
        {canManageAssignments && (
          <Link href="/dashboard/assignments/new">
            <Button>
              <Package className="w-4 h-4 mr-2" />
              New Assignment
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <SearchFilters
            initialSearch={search}
            initialStatus={status}
            initialCategory={category}
            initialView={view}
          />
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredAssets.length} of {totalCount} assets
        </p>
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
      </div>

      {/* Content */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No assets found</p>
            <p className="text-sm text-gray-400 mt-2">
              {canManageAssignments 
                ? "Try adjusting your search criteria or add assets to the system"
                : "You don't have any assigned assets yet"
              }
            </p>
          </CardContent>
        </Card>
      ) : view === 'table' ? (
        // Table View
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Assignments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-xl">{getCategoryIcon(asset.category)}</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                            <div className="text-sm text-gray-500">
                              {asset.assetTag} • {asset.category}
                            </div>
                            <div className="text-xs text-gray-400">
                              {asset.manufacturer} {asset.model}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(asset.status, asset.currentAssignment?.isActive || false)}
                      </td>
                      <td className="px-6 py-4">
                        {asset.currentAssignment ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {asset.currentAssignment.userName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {asset.currentAssignment.userEmail}
                            </div>
                            <div className="text-xs text-gray-400">
                              Since {asset.currentAssignment.assignedAt?.toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Available</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {asset.totalAssignments}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Link href={`/dashboard/assets/${asset.id}`}>
                            <Button variant="outline" size="sm">
                              View Asset
                            </Button>
                          </Link>
                          {canManageAssignments && asset.currentAssignment && (
                            <Link href={`/dashboard/assignments/${asset.currentAssignment.id}`}>
                              <Button variant="outline" size="sm">
                                Manage
                              </Button>
                            </Link>
                          )}
                          {canManageAssignments && !asset.currentAssignment && (
                            <Link href={`/dashboard/assignments/new?assetId=${asset.id}`}>
                              <Button size="sm">
                                Assign
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Card View (existing implementation)
        <div className="grid gap-6">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getCategoryIcon(asset.category)}</div>
                    <div>
                      <CardTitle className="text-lg">{asset.name}</CardTitle>
                      <CardDescription>
                        {asset.assetTag} • {asset.category} • {asset.manufacturer} {asset.model}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(asset.status, asset.currentAssignment?.isActive || false)}
                    <Link href={`/dashboard/assets/${asset.id}`}>
                      <Button variant="outline" size="sm">
                        View Asset
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Current Assignment Status */}
                <div className="mb-4">
                  {asset.currentAssignment ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">
                              Currently assigned to {asset.currentAssignment.userName}
                            </p>
                            <p className="text-sm text-blue-700">
                              {asset.currentAssignment.userEmail}
                            </p>
                            <p className="text-sm text-blue-600">
                              Assigned: {asset.currentAssignment.assignedAt?.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {canManageAssignments && (
                          <Link href={`/dashboard/assignments/${asset.currentAssignment.id}`}>
                            <Button variant="outline" size="sm">
                              Manage Assignment
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Package className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Available for assignment</p>
                            <p className="text-sm text-green-700">
                              Last assigned: {asset.assignmentHistory[0]?.returnedAt?.toLocaleDateString() || 'Never'}
                            </p>
                          </div>
                        </div>
                        {canManageAssignments && (
                          <Link href={`/dashboard/assignments/new?assetId=${asset.id}`}>
                            <Button size="sm">
                              Assign Asset
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Assignment History */}
                {asset.assignmentHistory.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                        <span className="text-sm font-medium">
                          Assignment History ({asset.totalAssignments} total)
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="space-y-3">
                        {asset.assignmentHistory.map((assignment) => (
                          <div key={assignment.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  {getStatusBadge(assignment.status, assignment.isActive)}
                                </div>
                                <div>
                                  <p className="font-medium">{assignment.userName}</p>
                                  <p className="text-sm text-gray-600">{assignment.userEmail}</p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {assignment.assignedAt?.toLocaleDateString()}
                                    </span>
                                    {assignment.returnedAt && (
                                      <span className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {assignment.returnedAt.toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Link href={`/dashboard/assignments/${assignment.id}`}>
                                <Button variant="ghost" size="sm">
                                  View
                                </Button>
                              </Link>
                            </div>
                            {assignment.notes && (
                              <p className="text-sm text-gray-600 mt-2">
                                Notes: {assignment.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {offset + 1} to {Math.min(offset + limit, totalCount)} of {totalCount} results
          </div>
          <div className="flex items-center space-x-2">
            <Link href={buildUrl({ page: (page - 1).toString() })}>
              <Button variant="outline" size="sm" disabled={!hasPrevPage}>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
            </Link>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                if (pageNum > totalPages) return null
                
                return (
                  <Link key={pageNum} href={buildUrl({ page: pageNum.toString() })}>
                    <Button
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8"
                    >
                      {pageNum}
                    </Button>
                  </Link>
                )
              })}
            </div>
            
            <Link href={buildUrl({ page: (page + 1).toString() })}>
              <Button variant="outline" size="sm" disabled={!hasNextPage}>
                Next
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
} 