import Link from 'next/link'
import { db } from '@/lib/db'
import { maintenanceRecords, assets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

interface MaintenanceDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MaintenanceDetailPage({ params }: MaintenanceDetailPageProps) {
  const { id } = await params
  const maintenanceId = parseInt(id)

  // Fetch maintenance record details
  const maintenanceRecord = await db
    .select({
      id: maintenanceRecords.id,
      type: maintenanceRecords.type,
      description: maintenanceRecords.description,
      performedBy: maintenanceRecords.performedBy,
      
      completedAt: maintenanceRecords.completedAt,
      nextScheduledAt: maintenanceRecords.nextScheduledAt,
      createdAt: maintenanceRecords.createdAt,
      assetId: assets.id,
      assetName: assets.name,
      assetType: assets.category,
      assetSerialNumber: assets.serialNumber,
      assetBuilding: assets.building,
      assetFloor: assets.floor,
      assetRoom: assets.room,
      assetStatus: assets.status,
    })
    .from(maintenanceRecords)
    .leftJoin(assets, eq(maintenanceRecords.assetId, assets.id))
    .where(eq(maintenanceRecords.id, maintenanceId))

  if (!maintenanceRecord[0]) {
    notFound()
  }

  const maintenance = maintenanceRecord[0]

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance Details</h1>
            <p className="text-gray-600">Record #{maintenance.id}</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/dashboard/maintenance"
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              Back to Maintenance
            </Link>
            <Link
              href={`/dashboard/maintenance/${maintenance.id}/edit`}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Edit Record
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Maintenance Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Maintenance Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  maintenance.type === 'preventive' ? 'bg-blue-100 text-blue-800' :
                  maintenance.type === 'corrective' ? 'bg-yellow-100 text-yellow-800' :
                  maintenance.type === 'emergency' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {maintenance.type}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performed By
                </label>
                <p className="text-gray-900">{maintenance.performedBy || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performed Date
                </label>
                <p className="text-gray-900">{maintenance.completedAt?.toLocaleDateString() || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Scheduled
                </label>
                <p className="text-gray-900">{maintenance.nextScheduledAt?.toLocaleDateString() || 'Not scheduled'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Record Created
                </label>
                <p className="text-gray-900">{maintenance.createdAt?.toLocaleDateString() || 'Unknown'}</p>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{maintenance.description}</p>
            </div>
          </div>
        </div>

        {/* Asset Information */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Asset Information</h2>
            {maintenance.assetName ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Asset Name</label>
                  <p className="text-gray-900 font-medium">{maintenance.assetName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-gray-900">{maintenance.assetType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                  <p className="text-gray-900">{maintenance.assetSerialNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="text-gray-900">{maintenance.assetBuilding ? `${maintenance.assetBuilding}, ${maintenance.assetFloor}, ${maintenance.assetRoom}` : 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    maintenance.assetStatus === 'available' ? 'bg-green-100 text-green-800' :
                    maintenance.assetStatus === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    maintenance.assetStatus === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {maintenance.assetStatus}
                  </span>
                </div>
                <div className="pt-3">
                  <Link
                    href={`/dashboard/assets/${maintenance.assetId}`}
                    className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                  >
                    View Asset Details →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Asset information not available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 