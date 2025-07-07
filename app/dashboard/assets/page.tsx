import Link from 'next/link'
import { db } from '@/lib/db'
import { assets, assetAssignments, user } from '@/lib/db/schema'
import { hasRole, auth, getCurrentUser } from '@/lib/auth'
import { eq, and, or } from 'drizzle-orm'

export default async function AssetsPage() {
  // Get current user and check permissions
  const session = await auth()
  const currentUser = await getCurrentUser()
  
  if (!session?.user || !currentUser) {
    return <div>Access denied</div>
  }

  // Check permissions
  const canCreateAssets = await hasRole('admin')
  const canAssignAssets = await hasRole('manager')
  const canViewAllAssets = await hasRole('manager')

  // Fetch assets based on user role
  let assetList: any[] = []
  
  if (canViewAllAssets) {
    // Managers+ can see all assets
    assetList = await db.select().from(assets).where(eq(assets.isDeleted, false))
  } else {
    // Users can only see assets assigned to them
    assetList = await db
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
          eq(assetAssignments.userId, currentUser.id),
          eq(assets.isDeleted, false),
          eq(assetAssignments.isActive, true)
        )
      )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-600">
            {canViewAllAssets ? 'Manage your IT assets' : 'View your assigned assets'}
          </p>
        </div>
        {canCreateAssets && (
          <Link 
            href="/dashboard/assets/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Asset
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {canViewAllAssets ? 'Asset List' : 'My Assigned Assets'}
          </h2>
          {assetList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {canViewAllAssets ? 'No assets found' : 'No assets assigned to you'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {canViewAllAssets 
                  ? 'Start by adding your first asset' 
                  : 'Contact your manager if you need access to assets'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assetList.map((asset) => (
                    <tr key={asset.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {asset.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asset.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asset.serialNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          asset.status === 'available' ? 'bg-green-100 text-green-800' :
                          asset.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          href={`/dashboard/assets/${asset.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </Link>
                        {canAssignAssets && (
                          <Link 
                            href={`/dashboard/assignments/new?assetId=${asset.id}`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Assign
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 