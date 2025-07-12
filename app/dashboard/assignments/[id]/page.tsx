import Link from 'next/link'
import { db } from '@/lib/db'
import { assetAssignments, assets, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { returnAsset } from '@/actions/assignments'

export default async function AssignmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const assignmentId = parseInt(id)

  // Server action wrapper for returnAsset
  async function handleReturnAsset(formData: FormData) {
    'use server'
    const assignmentId = parseInt(formData.get('assignmentId') as string)
    await returnAsset({ assignmentId })
  }

  // Fetch assignment with asset and user details
  const assignment = await db
    .select({
      id: assetAssignments.id,
      assignedAt: assetAssignments.assignedAt,
      returnedAt: assetAssignments.returnedAt,
      notes: assetAssignments.notes,
      isActive: assetAssignments.isActive,
      assetId: assetAssignments.assetId,
      userId: assetAssignments.userId,
      assetName: assets.name,
      assetType: assets.category,
      assetSerialNumber: assets.serialNumber,
      assetModel: assets.model,
      assetManufacturer: assets.manufacturer,
      assetStatus: assets.status,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(assetAssignments)
    .leftJoin(assets, eq(assetAssignments.assetId, assets.id))
    .leftJoin(user, eq(assetAssignments.userId, user.id))
    .where(eq(assetAssignments.id, assignmentId))

  if (!assignment[0]) {
    notFound()
  }

  const assignmentData = assignment[0]

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assignment Details</h1>
            <p className="text-gray-600">Assignment #{assignmentData.id}</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/dashboard/assignments"
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              Back to Assignments
            </Link>
            {!assignmentData.returnedAt && (
              <form action={handleReturnAsset} className="inline">
                <input type="hidden" name="assignmentId" value={assignmentData.id} />
                                 <button 
                   type="submit"
                   className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                 >
                  Return Asset
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Asset Information</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Asset Name</label>
              <p className="text-lg text-gray-900">{assignmentData.assetName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="text-gray-900">{assignmentData.assetType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  assignmentData.assetStatus === 'available' ? 'bg-green-100 text-green-800' :
                  assignmentData.assetStatus === 'assigned' ? 'bg-blue-100 text-blue-800' :
                  assignmentData.assetStatus === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {assignmentData.assetStatus}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Serial Number</label>
              <p className="text-gray-900">{assignmentData.assetSerialNumber || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <p className="text-gray-900">{assignmentData.assetModel || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                <p className="text-gray-900">{assignmentData.assetManufacturer || 'N/A'}</p>
              </div>
            </div>
            <div className="pt-3">
              <Link
                href={`/dashboard/assets/${assignmentData.assetId}`}
                className="text-blue-600 hover:text-blue-900 font-medium"
              >
                View Full Asset Details →
              </Link>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Assigned User</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {assignmentData.userImage && (
                <img 
                  src={assignmentData.userImage} 
                  alt={assignmentData.userName || 'User'} 
                  className="h-12 w-12 rounded-full"
                />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-lg text-gray-900">{assignmentData.userName || 'Unknown User'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{assignmentData.userEmail}</p>
            </div>
            <div className="pt-3">
              <Link
                href={`/dashboard/users/${assignmentData.userId}`}
                className="text-blue-600 hover:text-blue-900 font-medium"
              >
                View User Profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Assignment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned Date</label>
              <p className="text-gray-900">{assignmentData.assignedAt?.toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Return Date</label>
              <p className="text-gray-900">
                {assignmentData.returnedAt?.toLocaleDateString() || 'Not returned'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                assignmentData.returnedAt ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
              }`}>
                {assignmentData.returnedAt ? 'Returned' : 'Active'}
              </span>
            </div>
          </div>
          {assignmentData.notes && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{assignmentData.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 