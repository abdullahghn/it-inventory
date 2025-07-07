import Link from 'next/link'
import { db } from '@/lib/db'
import { assets, assetAssignments } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { auth, getCurrentUser, hasRole } from '@/lib/auth'
import DeleteAssetButton from '@/components/ui/DeleteAssetButton'

interface AssetDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id } = await params
  const assetId = parseInt(id)

  // Get current user and check permissions
  const session = await auth()
  const currentUser = await getCurrentUser()
  
  if (!session?.user || !currentUser) {
    notFound()
  }

  // Check permissions
  const canViewAllAssets = await hasRole('manager')
  const canAssignAssets = await hasRole('manager')
  const canEditAssets = await hasRole('admin')
  const canDeleteAssets = await hasRole('admin')

  // Fetch asset details with RBAC
  let assetData: any = null

  if (canViewAllAssets) {
    // Managers+ can view any asset
    const asset = await db.select().from(assets).where(eq(assets.id, assetId))
    assetData = asset[0]
  } else {
    // Users can only view assets assigned to them
    const asset = await db
      .select({
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
      })
      .from(assets)
      .innerJoin(assetAssignments, eq(assets.id, assetAssignments.assetId))
      .where(
        and(
          eq(assets.id, assetId),
          eq(assetAssignments.userId, currentUser.id),
          eq(assets.isDeleted, false),
          eq(assetAssignments.isActive, true)
        )
      )
      .limit(1)
    
    assetData = asset[0]
  }
  
  if (!assetData) {
    notFound()
  }
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
        <h1 className="text-3xl font-bold text-gray-900">Asset Details</h1>
            <p className="text-gray-600">{assetData.name}</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/dashboard/assets"
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              Back to Assets
            </Link>
            {canEditAssets && (
              <Link
                href={`/dashboard/assets/${assetData.id}/edit`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Edit Asset
              </Link>
            )}
            {canDeleteAssets && assetData.status !== 'assigned' && (
              <DeleteAssetButton 
                assetId={assetData.id} 
                assetName={assetData.name} 
              />
            )}
            {canAssignAssets && assetData.status === 'available' && (
              <Link
                href={`/dashboard/assignments/new?assetId=${assetData.id}`}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Assign Asset
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Asset Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <p className="text-lg font-medium text-gray-900">{assetData.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Tag
            </label>
            <p className="text-gray-900">{assetData.assetTag || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serial Number
            </label>
            <p className="text-gray-900">{assetData.serialNumber || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              assetData.status === 'available' ? 'bg-green-100 text-green-800' :
              assetData.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
              assetData.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {assetData.status}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <p className="text-gray-900">{assetData.model || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manufacturer
            </label>
            <p className="text-gray-900">{assetData.manufacturer || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <p className="text-gray-900">{assetData.condition || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <p className="text-gray-900">{assetData.category}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <p className="text-gray-900">
              {[assetData.building, assetData.floor, assetData.room, assetData.desk]
                .filter(Boolean)
                .join(', ') || 'N/A'}
            </p>
          </div>
        </div>
        {assetData.description && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{assetData.description}</p>
          </div>
        )}
      </div>
    </div>
  )
} 