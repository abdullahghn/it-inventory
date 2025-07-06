import Link from 'next/link'
import { db } from '@/lib/db'
import { maintenanceRecords, assets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { updateMaintenance } from '@/actions/maintenance'

interface MaintenanceEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MaintenanceEditPage({ params }: MaintenanceEditPageProps) {
  const { id } = await params
  const maintenanceId = parseInt(id)

  // Fetch maintenance record to edit
  const maintenanceRecord = await db
    .select({
      id: maintenanceRecords.id,
      assetId: assets.id,
      type: maintenanceRecords.type,
      title: maintenanceRecords.title,
      description: maintenanceRecords.description,
      priority: maintenanceRecords.priority,
      performedBy: maintenanceRecords.performedBy,
      nextScheduledAt: maintenanceRecords.nextScheduledAt,
      assetName: assets.name,
      assetType: assets.category,
    })
    .from(maintenanceRecords)
    .leftJoin(assets, eq(maintenanceRecords.assetId, assets.id))
    .where(eq(maintenanceRecords.id, maintenanceId))

  if (!maintenanceRecord[0]) {
    notFound()
  }

  // Fetch all assets for the dropdown
  const assetList = await db
    .select({
      id: assets.id,
      name: assets.name,
      category: assets.category,
      serialNumber: assets.serialNumber,
    })
    .from(assets)
    .limit(100)

  const maintenance = maintenanceRecord[0]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Maintenance Record</h1>
        <p className="text-gray-600">Update maintenance record #{maintenance.id}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form action={updateMaintenance} className="space-y-6">
          <input type="hidden" name="id" value={maintenance.id} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Asset *
              </label>
              <select 
                name="assetId" 
                required
                defaultValue={maintenance.assetId || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an asset</option>
                {assetList.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} - {asset.category} ({asset.serialNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maintenance Type *
              </label>
              <select 
                name="type" 
                required
                defaultValue={maintenance.type || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type</option>
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
                <option value="emergency">Emergency</option>
                <option value="upgrade">Upgrade</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={maintenance.title || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter maintenance title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              rows={4}
              required
              defaultValue={maintenance.description || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the maintenance work performed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select 
                name="priority" 
                defaultValue={maintenance.priority || "medium"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Performed By
              </label>
              <input
                type="text"
                name="performedBy"
                defaultValue={maintenance.performedBy || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter technician name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Scheduled Date
            </label>
            <input
              type="date"
              name="nextScheduledAt"
              defaultValue={
                maintenance.nextScheduledAt 
                  ? new Date(maintenance.nextScheduledAt).toISOString().split('T')[0] 
                  : ""
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Update Maintenance Record
            </button>
            <Link
              href={`/dashboard/maintenance/${maintenance.id}`}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 