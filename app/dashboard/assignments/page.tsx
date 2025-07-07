import Link from 'next/link'
import { db } from '@/lib/db'
import { assetAssignments, assets, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { returnAsset } from '@/actions/assignments'
import { hasRole } from '@/lib/auth'

export default async function AssignmentsPage() {
  // Check permissions
  const canManageAssignments = await hasRole('manager')
  
  // Fetch assignments with asset and user details
  const assignmentList = await db
    .select({
      id: assetAssignments.id,
      assignedAt: assetAssignments.assignedAt,
      returnedAt: assetAssignments.returnedAt,
      notes: assetAssignments.notes,
      assetName: assets.name,
      assetType: assets.category,
      assetSerialNumber: assets.serialNumber,
      userName: user.name,
      userEmail: user.email,
    })
    .from(assetAssignments)
    .leftJoin(assets, eq(assetAssignments.assetId, assets.id))
    .leftJoin(user, eq(assetAssignments.userId, user.id))

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment Assignments</h1>
          <p className="text-gray-600">Manage asset assignments to users</p>
        </div>
        {canManageAssignments && (
          <Link 
            href="/dashboard/assignments/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            New Assignment
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Active Assignments</h2>
          {assignmentList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No assignments found</p>
              <p className="text-sm text-gray-400 mt-2">
                Start by creating your first assignment
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
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Date
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
                  {assignmentList.map((assignment) => (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.assetName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.assetType} • {assignment.assetSerialNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.userEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.assignedAt?.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          assignment.returnedAt ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {assignment.returnedAt ? 'Returned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          href={`/dashboard/assignments/${assignment.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </Link>
                        {canManageAssignments && !assignment.returnedAt && (
                          <form action={returnAsset} className="inline">
                            <input type="hidden" name="assignmentId" value={assignment.id} />
                            <button 
                              type="submit"
                              className="text-red-600 hover:text-red-900"
                            >
                            Return
                          </button>
                          </form>
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