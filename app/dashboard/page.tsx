import Link from 'next/link'
import { db } from '@/lib/db'
import { assets, user, assetAssignments, maintenanceRecords } from '@/lib/db/schema'
import { count, eq, desc, isNull, and, gte, lte } from 'drizzle-orm'
import { auth, hasRole } from '@/lib/auth'
import { 
  Computer, 
  Users, 
  UserCheck, 
  Wrench, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Building2,
  Shield,
  BarChart3,
  Plus,
  Eye
} from 'lucide-react'

// Role-specific dashboard widgets
async function AdminDashboard({ stats, recentData }: any) {
  return (
    <div className="space-y-6">
      {/* Admin-specific stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total Assets</h3>
              <p className="text-3xl font-bold">{stats.totalAssets}</p>
              <p className="text-blue-100 text-sm">Across all departments</p>
            </div>
            <Computer className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active Users</h3>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
              <p className="text-green-100 text-sm">With system access</p>
            </div>
            <Users className="h-8 w-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active Assignments</h3>
              <p className="text-3xl font-bold">{stats.activeAssignments}</p>
              <p className="text-purple-100 text-sm">Currently deployed</p>
            </div>
            <UserCheck className="h-8 w-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Maintenance</h3>
              <p className="text-3xl font-bold">{stats.totalMaintenance}</p>
              <p className="text-orange-100 text-sm">Records this month</p>
            </div>
            <Wrench className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/assets/new" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Plus className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium">Add New Asset</h3>
              <p className="text-sm text-gray-600">Register equipment</p>
            </div>
          </Link>
          <Link href="/dashboard/users/new" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium">Add User</h3>
              <p className="text-sm text-gray-600">Create account</p>
            </div>
          </Link>
          <Link href="/dashboard/reports" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <BarChart3 className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <h3 className="font-medium">View Reports</h3>
              <p className="text-sm text-gray-600">Analytics & insights</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              System Alerts
            </h2>
          </div>
          <div className="space-y-3">
            {stats.warrantyExpiring > 0 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-3" />
                <div>
                  <p className="font-medium text-red-800">{stats.warrantyExpiring} assets with expiring warranty</p>
                  <p className="text-sm text-red-600">Within 30 days</p>
                </div>
              </div>
            )}
            {stats.overdueMaintenance > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Wrench className="h-4 w-4 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium text-yellow-800">{stats.overdueMaintenance} assets need maintenance</p>
                  <p className="text-sm text-yellow-600">Overdue</p>
                </div>
              </div>
            )}
            {stats.warrantyExpiring === 0 && stats.overdueMaintenance === 0 && (
              <p className="text-gray-500 text-center py-4">No active alerts</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <Link href="/dashboard/assignments" className="text-blue-600 hover:text-blue-800 text-sm">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentData.assignments.slice(0, 5).map((assignment: any) => (
              <div key={assignment.id} className="flex items-start space-x-3 py-2">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{assignment.assetName}</span> assigned to{' '}
                    <span className="font-medium">{assignment.userName}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {assignment.assignedAt?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

async function ManagerDashboard({ stats, recentData }: any) {
  return (
    <div className="space-y-6">
      {/* Manager-specific stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Department Assets</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalAssets}</p>
            </div>
            <Computer className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Team Members</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Active Assignments</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.activeAssignments}</p>
            </div>
            <UserCheck className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Asset Status Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Available</span>
              <span className="font-semibold text-green-600">{stats.availableAssets || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Assigned</span>
              <span className="font-semibold text-blue-600">{stats.assignedAssets || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Maintenance</span>
              <span className="font-semibold text-yellow-600">{stats.maintenanceAssets || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Assignments</h2>
          <div className="space-y-3">
            {recentData.assignments.slice(0, 4).map((assignment: any) => (
              <div key={assignment.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{assignment.assetName}</p>
                  <p className="text-sm text-gray-500">{assignment.userName}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {assignment.assignedAt?.toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

async function UserDashboard({ stats, recentData }: any) {
  return (
    <div className="space-y-6">
      {/* User-specific stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">My Assets</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.assignedAssets}</p>
            </div>
            <Computer className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Warranty Status</h3>
              <p className="text-3xl font-bold text-green-600">{stats.warrantyExpiring}</p>
              <p className="text-sm text-gray-500">Expiring soon</p>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Maintenance</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.maintenanceNeeded}</p>
              <p className="text-sm text-gray-500">Due soon</p>
            </div>
            <Wrench className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* My Assets */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Assigned Assets</h2>
          <Link href="/dashboard/assets" className="text-blue-600 hover:text-blue-800 text-sm">
            View All →
          </Link>
        </div>
        <div className="space-y-3">
          {recentData.myAssets.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No assets assigned to you</p>
          ) : (
            recentData.myAssets.map((asset: any) => (
              <div key={asset.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center space-x-4">
                  <Computer className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{asset.name}</p>
                    <p className="text-sm text-gray-500">{asset.category} • {asset.assetTag}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    asset.status === 'assigned' ? 'bg-green-100 text-green-800' :
                    asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {asset.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    Assigned {asset.assignedAt?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) return null

  const userRole = session.user.role || 'user'
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const isManager = userRole === 'manager'
  const isUser = userRole === 'user' || userRole === 'viewer'

  // Calculate date ranges
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  // Fetch statistics based on user role
  const [
    totalAssets,
    totalUsers,
    activeAssignments,
    totalMaintenance,
    warrantyExpiring,
    overdueMaintenance,
    availableAssets,
    assignedAssets,
    maintenanceAssets,
    myAssignedAssets,
    myWarrantyExpiring,
    myMaintenanceNeeded,
    recentAssets,
    recentAssignments,
    recentMaintenance,
    myAssets
  ] = await Promise.all([
    // Total assets count
    db.select({ count: count() }).from(assets).where(eq(assets.isDeleted, false)),
    
    // Total users count
    db.select({ count: count() }).from(user),
    
    // Active assignments count
    db.select({ count: count() }).from(assetAssignments).where(isNull(assetAssignments.returnedAt)),
    
    // Total maintenance records count
    db.select({ count: count() }).from(maintenanceRecords),
    
    // Assets with expiring warranty (admin only)
    isAdmin ? db.select({ count: count() }).from(assets).where(
      and(
        eq(assets.isDeleted, false),
        gte(assets.warrantyExpiry, now),
        lte(assets.warrantyExpiry, ninetyDaysFromNow)
      )
    ) : Promise.resolve([{ count: 0 }]),
    
    // Overdue maintenance (admin only)
    isAdmin ? db.select({ count: count() }).from(maintenanceRecords).where(
      and(
        eq(maintenanceRecords.isCompleted, false),
        lte(maintenanceRecords.scheduledAt, now)
      )
    ) : Promise.resolve([{ count: 0 }]),
    
    // Available assets (manager/user)
    (isManager || isUser) ? db.select({ count: count() }).from(assets).where(
      and(
        eq(assets.isDeleted, false),
        eq(assets.status, 'available')
      )
    ) : Promise.resolve([{ count: 0 }]),
    
    // Assigned assets (manager/user)
    (isManager || isUser) ? db.select({ count: count() }).from(assets).where(
      and(
        eq(assets.isDeleted, false),
        eq(assets.status, 'assigned')
      )
    ) : Promise.resolve([{ count: 0 }]),
    
    // Maintenance assets (manager/user)
    (isManager || isUser) ? db.select({ count: count() }).from(assets).where(
      and(
        eq(assets.isDeleted, false),
        eq(assets.status, 'maintenance')
      )
    ) : Promise.resolve([{ count: 0 }]),
    
    // My assigned assets (user only)
    isUser ? db.select({ count: count() }).from(assetAssignments).where(
      and(
        eq(assetAssignments.userId, session.user.id),
        isNull(assetAssignments.returnedAt)
      )
    ) : Promise.resolve([{ count: 0 }]),
    
    // My warranty expiring (user only)
    isUser ? db.select({ count: count() }).from(assets)
      .innerJoin(assetAssignments, eq(assets.id, assetAssignments.assetId))
      .where(
        and(
          eq(assetAssignments.userId, session.user.id),
          isNull(assetAssignments.returnedAt),
          gte(assets.warrantyExpiry, now),
          lte(assets.warrantyExpiry, ninetyDaysFromNow)
        )
      ) : Promise.resolve([{ count: 0 }]),
    
    // My maintenance needed (user only)
    isUser ? db.select({ count: count() }).from(maintenanceRecords)
      .innerJoin(assets, eq(maintenanceRecords.assetId, assets.id))
      .innerJoin(assetAssignments, eq(assets.id, assetAssignments.assetId))
      .where(
        and(
          eq(assetAssignments.userId, session.user.id),
          isNull(assetAssignments.returnedAt),
          eq(maintenanceRecords.isCompleted, false),
          lte(maintenanceRecords.scheduledAt, now)
        )
      ) : Promise.resolve([{ count: 0 }]),
    
    // Recent assets (admin/manager)
    (isAdmin || isManager) ? db.select({
      id: assets.id,
      name: assets.name,
      category: assets.category,
      status: assets.status,
      assetTag: assets.assetTag,
      createdAt: assets.createdAt,
    }).from(assets).where(eq(assets.isDeleted, false)).orderBy(desc(assets.createdAt)).limit(5) : Promise.resolve([]),
    
    // Recent assignments (admin/manager)
    (isAdmin || isManager) ? db.select({
      id: assetAssignments.id,
      assetName: assets.name,
      userName: user.name,
      assignedAt: assetAssignments.assignedAt,
      returnedAt: assetAssignments.returnedAt,
    }).from(assetAssignments)
      .leftJoin(assets, eq(assetAssignments.assetId, assets.id))
      .leftJoin(user, eq(assetAssignments.userId, user.id))
      .orderBy(desc(assetAssignments.assignedAt))
      .limit(5) : Promise.resolve([]),
    
    // Recent maintenance (admin/manager)
    (isAdmin || isManager) ? db.select({
      id: maintenanceRecords.id,
      type: maintenanceRecords.type,
      assetName: assets.name,
      completedAt: maintenanceRecords.completedAt,
    }).from(maintenanceRecords)
      .leftJoin(assets, eq(maintenanceRecords.assetId, assets.id))
      .orderBy(desc(maintenanceRecords.completedAt))
      .limit(3) : Promise.resolve([]),
    
    // My assets (user only)
    isUser ? db.select({
      id: assets.id,
      name: assets.name,
      category: assets.category,
      status: assets.status,
      assetTag: assets.assetTag,
      assignedAt: assetAssignments.assignedAt,
    }).from(assets)
      .innerJoin(assetAssignments, eq(assets.id, assetAssignments.assetId))
      .where(
        and(
          eq(assetAssignments.userId, session.user.id),
          isNull(assetAssignments.returnedAt)
        )
      )
      .orderBy(desc(assetAssignments.assignedAt))
      .limit(5) : Promise.resolve([]),
  ])

  const stats = {
    totalAssets: totalAssets[0]?.count || 0,
    totalUsers: totalUsers[0]?.count || 0,
    activeAssignments: activeAssignments[0]?.count || 0,
    totalMaintenance: totalMaintenance[0]?.count || 0,
    warrantyExpiring: warrantyExpiring[0]?.count || 0,
    overdueMaintenance: overdueMaintenance[0]?.count || 0,
    availableAssets: availableAssets[0]?.count || 0,
    assignedAssets: assignedAssets[0]?.count || 0,
    maintenanceAssets: maintenanceAssets[0]?.count || 0,
    myAssignedAssets: myAssignedAssets[0]?.count || 0,
    myWarrantyExpiring: myWarrantyExpiring[0]?.count || 0,
    myMaintenanceNeeded: myMaintenanceNeeded[0]?.count || 0,
  }

  const recentData = {
    assets: recentAssets,
    assignments: recentAssignments,
    maintenance: recentMaintenance,
    myAssets: myAssets,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {session.user.name}! Here's your {userRole.replace('_', ' ')} overview.
        </p>
      </div>

      {/* Role-specific dashboard */}
      {isAdmin && <AdminDashboard stats={stats} recentData={recentData} />}
      {isManager && <ManagerDashboard stats={stats} recentData={recentData} />}
      {isUser && <UserDashboard stats={stats} recentData={recentData} />}
    </div>
  )
} 