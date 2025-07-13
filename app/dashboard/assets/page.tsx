import Link from 'next/link'
import { db } from '@/lib/db'
import { assets, assetAssignments, user } from '@/lib/db/schema'
import { hasRole, auth, getCurrentUser } from '@/lib/auth'
import { eq, and, asc, desc, like, inArray, isNull, or, count, gte, lte, isNotNull } from 'drizzle-orm'
import { AssetsClient } from './components/AssetsClient'
import { AdvancedAssetFilters } from '@/components/search/AdvancedAssetFilters'
import { 
  Plus, 
  Filter, 
  Search, 
  Download, 
  Eye,
  Computer,
  Users,
  Building2,
  Calendar
} from 'lucide-react'

// Asset filters interface
interface AssetFilters {
  search?: string
  category?: string
  status?: string
  condition?: string
  building?: string
  assignedTo?: string
  warrantyExpiring?: boolean
  purchaseDateFrom?: string
  purchaseDateTo?: string
}

export default async function AssetsPage({
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

  // Check permissions
  const userRole = currentUser?.role || session.user.role || 'user'
  const canCreateAssets = await hasRole('admin') || userRole === 'admin' || userRole === 'super_admin'
  const canAssignAssets = await hasRole('manager') || userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin'
  const canViewAllAssets = await hasRole('manager') || userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin'

  // Parse filters from search params
  const filters: AssetFilters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    category: typeof params.category === 'string' ? params.category : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    condition: typeof params.condition === 'string' ? params.condition : undefined,
    building: typeof params.building === 'string' ? params.building : undefined,
    assignedTo: typeof params.assignedTo === 'string' ? params.assignedTo : undefined,
    warrantyExpiring: typeof params.warrantyExpiring === 'string' ? params.warrantyExpiring === 'true' : undefined,
    purchaseDateFrom: typeof params.purchaseDateFrom === 'string' ? params.purchaseDateFrom : undefined,
    purchaseDateTo: typeof params.purchaseDateTo === 'string' ? params.purchaseDateTo : undefined,
  }

  // Build where conditions based on filters and user role
  let whereConditions: any[] = [eq(assets.isDeleted, false)]

  // Role-based filtering
  if (!canViewAllAssets) {
    // Users can only see assets assigned to them
    whereConditions.push(
      and(
        eq(assetAssignments.userId, currentUser?.id || session.user.id),
        eq(assetAssignments.isActive, true)
      )
    )
  }

  // Apply search filters
  if (filters.search) {
    const searchTerm = `%${filters.search}%`
    whereConditions.push(
      or(
        like(assets.name, searchTerm),
        like(assets.assetTag, searchTerm),
        like(assets.serialNumber, searchTerm),
        like(assets.model, searchTerm),
        like(assets.manufacturer, searchTerm)
      )
    )
  }

  if (filters.category) {
    whereConditions.push(eq(assets.category, filters.category as any))
  }

  if (filters.status) {
    whereConditions.push(eq(assets.status, filters.status as any))
  }

  if (filters.condition) {
    whereConditions.push(eq(assets.condition, filters.condition as any))
  }

  if (filters.building) {
    whereConditions.push(eq(assets.building, filters.building))
  }

  if (filters.warrantyExpiring) {
    const now = new Date()
    const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    whereConditions.push(
      and(
        isNotNull(assets.warrantyExpiry),
        gte(assets.warrantyExpiry, now),
        lte(assets.warrantyExpiry, ninetyDaysFromNow)
      )
    )
  }

  if (filters.purchaseDateFrom) {
    whereConditions.push(gte(assets.purchaseDate, new Date(filters.purchaseDateFrom)))
  }

  if (filters.purchaseDateTo) {
    whereConditions.push(lte(assets.purchaseDate, new Date(filters.purchaseDateTo)))
  }

  // Fetch assets with filters
  let assetList: any[] = []
  let totalCount = 0
  
  try {
    // Get total count for pagination
    const countQuery = canViewAllAssets 
      ? db.select({ count: count() }).from(assets).where(and(...whereConditions))
      : db.select({ count: count() }).from(assets)
          .innerJoin(assetAssignments, eq(assets.id, assetAssignments.assetId))
          .where(and(...whereConditions))

    const countResult = await countQuery
    totalCount = Number(countResult[0]?.count || 0)

    // Get paginated results
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1
    const limit = typeof params.limit === 'string' ? parseInt(params.limit) : 20
    const offset = (page - 1) * limit

    const baseQuery = {
      id: assets.id,
      assetTag: assets.assetTag,
      name: assets.name,
      category: assets.category,
      subcategory: assets.subcategory,
      status: assets.status,
      condition: assets.condition,
      serialNumber: assets.serialNumber,
      model: assets.model,
      manufacturer: assets.manufacturer,
      specifications: assets.specifications,
      purchaseDate: assets.purchaseDate,
      purchasePrice: assets.purchasePrice,
      currentValue: assets.currentValue,
      depreciationRate: assets.depreciationRate,
      warrantyExpiry: assets.warrantyExpiry,
      building: assets.building,
      floor: assets.floor,
      room: assets.room,
      desk: assets.desk,
      locationNotes: assets.locationNotes,
      description: assets.description,
      notes: assets.notes,
      isDeleted: assets.isDeleted,
      createdBy: assets.createdBy,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
    }

    if (canViewAllAssets) {
      assetList = await db
        .select(baseQuery)
        .from(assets)
        .where(and(...whereConditions))
        .orderBy(desc(assets.createdAt))
        .limit(limit)
        .offset(offset)
    } else {
      assetList = await db
        .select(baseQuery)
        .from(assets)
        .innerJoin(assetAssignments, eq(assets.id, assetAssignments.assetId))
        .where(and(...whereConditions))
        .orderBy(desc(assets.createdAt))
        .limit(limit)
        .offset(offset)
    }

    // If filtering by assigned user, we need to join with assignments
    if (filters.assignedTo && canViewAllAssets) {
      const assignedAssets = await db
        .select({
          assetId: assetAssignments.assetId,
          userName: user.name,
          userEmail: user.email,
        })
        .from(assetAssignments)
        .innerJoin(user, eq(assetAssignments.userId, user.id))
        .where(
          and(
            eq(assetAssignments.isActive, true),
            isNull(assetAssignments.returnedAt),
            like(user.name, `%${filters.assignedTo}%`)
          )
        )

      const assignedAssetIds = assignedAssets.map(a => a.assetId)
      if (assignedAssetIds.length > 0) {
        assetList = assetList.filter(asset => assignedAssetIds.includes(asset.id))
      } else {
        assetList = []
      }
    }

  } catch (error) {
    console.error('Database error:', error)
    assetList = []
    totalCount = 0
  }



  // Calculate summary statistics
  const [totalAssets, availableAssets, assignedAssets, maintenanceAssets, warrantyExpiringCount] = await Promise.all([
    db.select({ count: count() }).from(assets).where(eq(assets.isDeleted, false)),
    db.select({ count: count() }).from(assets).where(and(eq(assets.isDeleted, false), eq(assets.status, 'available'))),
    db.select({ count: count() }).from(assets).where(and(eq(assets.isDeleted, false), eq(assets.status, 'assigned'))),
    db.select({ count: count() }).from(assets).where(and(eq(assets.isDeleted, false), eq(assets.status, 'maintenance'))),
    db.select({ count: count() }).from(assets).where(
      and(
        eq(assets.isDeleted, false),
        isNotNull(assets.warrantyExpiry),
        lte(assets.warrantyExpiry, new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
      )
    )
  ])

  const stats = {
    total: totalAssets[0]?.count || 0,
    available: availableAssets[0]?.count || 0,
    assigned: assignedAssets[0]?.count || 0,
    maintenance: maintenanceAssets[0]?.count || 0,
    warrantyExpiring: warrantyExpiringCount[0]?.count || 0,
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
            <p className="text-gray-600">
              {canViewAllAssets ? 'Manage all IT assets' : 'View your assigned assets'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {canCreateAssets && (
              <Link
                href="/dashboard/assets/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Link>
            )}
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Computer className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Available</p>
              <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.maintenance}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Warranty Expiring</p>
              <p className="text-2xl font-bold text-gray-900">{stats.warrantyExpiring}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="mb-6">
        <AdvancedAssetFilters 
          showSavedFilters={true}
        />
      </div>

      {/* Pass data to client component */}
      <AssetsClient 
        initialAssets={assetList}
        canCreateAssets={canCreateAssets}
        canAssignAssets={canAssignAssets}
        canViewAllAssets={canViewAllAssets}
      />
    </div>
  )
} 