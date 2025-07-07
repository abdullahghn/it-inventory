import Link from 'next/link'
import { db } from '@/lib/db'
import { assets } from '@/lib/db/schema'
import { createMaintenance } from '@/actions/maintenance'
import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NewMaintenancePage() {
  try {
    // Check permissions - only manager and above can create maintenance records
    await requireRole('manager')
  } catch (error) {
    // Redirect to dashboard with error message
    redirect('/dashboard?error=unauthorized')
  }

  // Optimized: Only fetch assets with essential fields for performance
  const assetList = await db
    .select({
      id: assets.id,
      name: assets.name,
      category: assets.category,
      serialNumber: assets.serialNumber,
      status: assets.status,
    })
    .from(assets)
    .limit(100)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Schedule Maintenance</h1>
        <p className="text-gray-600">Create a new maintenance record</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form action={createMaintenance} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Asset *
              </label>
              <select 
                name="assetId" 
                required
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
                defaultValue="medium"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Create Maintenance Record
            </button>
            <Link
              href="/dashboard/maintenance"
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