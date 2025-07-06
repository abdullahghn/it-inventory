import Link from 'next/link'
import { db } from '@/lib/db'
import { assets, user, assetAssignments, maintenanceRecords } from '@/lib/db/schema'
import { count, eq, desc, isNull } from 'drizzle-orm'

export default async function DashboardPage() {
  // Fetch real statistics from database
  const [
    totalAssets,
    totalUsers,
    activeAssignments,
    totalMaintenance,
    recentAssets,
    recentAssignments,
    recentMaintenance
  ] = await Promise.all([
    // Total assets count
    db.select({ count: count() }).from(assets),
    
    // Total users count
    db.select({ count: count() }).from(user),
    
    // Active assignments count (not returned)
    db.select({ count: count() }).from(assetAssignments).where(isNull(assetAssignments.returnedAt)),
    
    // Total maintenance records count
    db.select({ count: count() }).from(maintenanceRecords),
    
    // Recent assets (last 5)
    db.select({
      id: assets.id,
      name: assets.name,
      category: assets.category,
      status: assets.status,
      createdAt: assets.createdAt,
    }).from(assets).where(eq(assets.isDeleted, false)).orderBy(desc(assets.createdAt)).limit(5),
    
    // Recent assignments (last 5)
    db.select({
      id: assetAssignments.id,
      assetName: assets.name,
      userName: user.name,
      assignedAt: assetAssignments.assignedAt,
      returnedAt: assetAssignments.returnedAt,
    }).from(assetAssignments)
      .leftJoin(assets, eq(assetAssignments.assetId, assets.id))
      .leftJoin(user, eq(assetAssignments.userId, user.id))
      .orderBy(desc(assetAssignments.assignedAt))
      .limit(5),
    
    // Recent maintenance (last 5)
    db.select({
      id: maintenanceRecords.id,
      type: maintenanceRecords.type,
      assetName: assets.name,
      completedAt: maintenanceRecords.completedAt,
    }).from(maintenanceRecords)
      .leftJoin(assets, eq(maintenanceRecords.assetId, assets.id))
      .orderBy(desc(maintenanceRecords.completedAt))
      .limit(3),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your IT inventory system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Real Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Total Assets</h3>
              <p className="text-3xl font-bold text-blue-600">{totalAssets[0]?.count || 0}</p>
            </div>
            <div className="text-blue-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
              <p className="text-3xl font-bold text-green-600">{totalUsers[0]?.count || 0}</p>
            </div>
            <div className="text-green-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Active Assignments</h3>
              <p className="text-3xl font-bold text-purple-600">{activeAssignments[0]?.count || 0}</p>
            </div>
            <div className="text-purple-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Maintenance Records</h3>
              <p className="text-3xl font-bold text-orange-600">{totalMaintenance[0]?.count || 0}</p>
            </div>
            <div className="text-orange-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assets */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Assets</h2>
            <Link href="/dashboard/assets" className="text-blue-600 hover:text-blue-900 text-sm">
              View All →
            </Link>
          </div>
          {recentAssets.length === 0 ? (
            <p className="text-gray-500">No assets added yet</p>
          ) : (
            <div className="space-y-3">
              {recentAssets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{asset.name}</p>
                    <p className="text-sm text-gray-500">{asset.category}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      asset.status === 'available' ? 'bg-green-100 text-green-800' :
                      asset.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                      asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {asset.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {asset.createdAt?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <Link href="/dashboard/assignments" className="text-blue-600 hover:text-blue-900 text-sm">
              View All →
            </Link>
          </div>
          {recentAssignments.length === 0 && recentMaintenance.length === 0 ? (
            <p className="text-gray-500">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {/* Recent Assignments */}
              {recentAssignments.slice(0, 3).map((assignment) => (
                <div key={`assignment-${assignment.id}`} className="flex items-start space-x-3 py-2">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{assignment.assetName}</span> assigned to{' '}
                      <span className="font-medium">{assignment.userName}</span>
                      {assignment.returnedAt && (
                        <span className="text-green-600"> (Returned)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {assignment.assignedAt?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Recent Maintenance */}
              {recentMaintenance.map((maintenance) => (
                <div key={`maintenance-${maintenance.id}`} className="flex items-start space-x-3 py-2">
                  <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{maintenance.type}</span> maintenance on{' '}
                      <span className="font-medium">{maintenance.assetName}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {maintenance.completedAt?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 