import Link from 'next/link'
import { db } from '@/lib/db'
import { maintenanceRecords, assets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function MaintenancePage() {
  // Fetch maintenance records with asset details
  const maintenanceList = await db
    .select({
      id: maintenanceRecords.id,
      type: maintenanceRecords.type,
      description: maintenanceRecords.description,
      performedBy: maintenanceRecords.performedBy,
      completedAt: maintenanceRecords.completedAt,
      nextScheduledAt: maintenanceRecords.nextScheduledAt,
      assetName: assets.name,
      assetType: assets.category,
      assetSerialNumber: assets.serialNumber,
    })
    .from(maintenanceRecords)
    .leftJoin(assets, eq(maintenanceRecords.assetId, assets.id))
    .orderBy(maintenanceRecords.completedAt)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Records</h1>
          <p className="text-gray-600">Track asset maintenance and repairs</p>
        </div>
        <Link 
          href="/dashboard/maintenance/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Schedule Maintenance
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Maintenance History</h2>
          {maintenanceList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No maintenance records found</p>
              <p className="text-sm text-gray-400 mt-2">
                Start by scheduling your first maintenance
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performed By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performed Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Scheduled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {maintenanceList.map((maintenance) => (
                    <tr key={maintenance.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {maintenance.assetName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {maintenance.assetType} • {maintenance.assetSerialNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          maintenance.type === 'preventive' ? 'bg-blue-100 text-blue-800' :
                          maintenance.type === 'corrective' ? 'bg-yellow-100 text-yellow-800' :
                          maintenance.type === 'emergency' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {maintenance.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={maintenance.description}>
                        {maintenance.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {maintenance.performedBy || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {maintenance.completedAt?.toLocaleDateString() || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {maintenance.nextScheduledAt?.toLocaleDateString() || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          href={`/dashboard/maintenance/${maintenance.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </Link>
                        <Link 
                          href={`/dashboard/maintenance/${maintenance.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </Link>
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