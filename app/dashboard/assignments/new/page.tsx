import Link from 'next/link'
import { db } from '@/lib/db'
import { assets, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { assignAsset } from '@/actions/assignments'
import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NewAssignmentPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ assetId?: string; userId?: string; notes?: string }> 
}) {
  try {
    // Check permissions - only manager and above can assign assets
    await requireRole('manager')
  } catch (error) {
    // Redirect to dashboard with error message
    redirect('/dashboard?error=unauthorized')
  }
  
  // Await searchParams before using (Next.js 15 requirement)
  const params = await searchParams
  
  // Optimized: Only fetch available assets with essential fields
  const availableAssets = await db
    .select({
      id: assets.id,
      name: assets.name,
      category: assets.category,
      serialNumber: assets.serialNumber,
      status: assets.status,
    })
    .from(assets)
    .where(eq(assets.status, 'available'))
    .limit(100) // Limit for performance
  
  // Optimized: Only fetch essential user fields
  const activeUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .limit(100) // Limit for performance
  
  // Pre-populate form if URL params exist
  const preSelectedAssetId = params.assetId
  const preSelectedUserId = params.userId
  const preFilledNotes = params.notes

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">New Assignment</h1>
        <p className="text-gray-600">Assign equipment to a user</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form action={assignAsset} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Available Asset *
              </label>
              <select 
                name="assetId" 
                required
                defaultValue={preSelectedAssetId || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an available asset</option>
                {availableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} - {asset.category} ({asset.serialNumber})
                  </option>
                ))}
              </select>
              {availableAssets.length === 0 && (
                <p className="text-sm text-red-600 mt-1">No available assets found</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to User *
              </label>
              <select 
                name="userId" 
                required
                defaultValue={preSelectedUserId || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a user</option>
                {activeUsers.map((userItem) => (
                  <option key={userItem.id} value={userItem.id}>
                    {userItem.name} ({userItem.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Notes
            </label>
            <textarea
              name="notes"
              rows={4}
              defaultValue={preFilledNotes || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any notes about this assignment"
            />
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Create Assignment
            </button>
            <Link
              href="/dashboard/assignments"
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