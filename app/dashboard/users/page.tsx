import Link from 'next/link'
import { db } from '@/lib/db'
import { user, assetAssignments, assets } from '@/lib/db/schema'
import { auth, getCurrentUser, hasRole } from '@/lib/auth'
import { eq, and, desc, isNull, like, or, count, gte, lte, isNotNull } from 'drizzle-orm'
import { UsersClient } from './components/UsersClient'
import { 
  Plus, 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Building2,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

// User filters interface
interface UserFilters {
  search?: string
  role?: string
  department?: string
  isActive?: boolean
  hasAssignments?: boolean
  lastLoginFrom?: string
  lastLoginTo?: string
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  
  // Get current user and check permissions
  const session = await auth()
  const currentUser = await getCurrentUser()
  
  if (!session?.user) {
    return <div>Access denied</div>
  }

  // Check permissions - only super admin and admin can access
  const userRole = currentUser?.role || session.user.role || 'user'
  const canManageUsers = userRole === 'super_admin' || userRole === 'admin'
  
  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access user management.</p>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center px-4 py-2 mt-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Parse filters from search params
  const filters: UserFilters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    role: typeof params.role === 'string' ? params.role : undefined,
    department: typeof params.department === 'string' ? params.department : undefined,
    isActive: typeof params.isActive === 'string' ? params.isActive === 'true' : undefined,
    hasAssignments: typeof params.hasAssignments === 'string' ? params.hasAssignments === 'true' : undefined,
    lastLoginFrom: typeof params.lastLoginFrom === 'string' ? params.lastLoginFrom : undefined,
    lastLoginTo: typeof params.lastLoginTo === 'string' ? params.lastLoginTo : undefined,
  }

  // Build where conditions based on filters
  let whereConditions: any[] = []

  // Apply search filters
  if (filters.search) {
    const searchTerm = `%${filters.search}%`
    whereConditions.push(
      or(
        like(user.name, searchTerm),
        like(user.email, searchTerm),
        like(user.employeeId, searchTerm),
        like(user.department, searchTerm),
        like(user.jobTitle, searchTerm)
      )
    )
  }

  if (filters.role) {
    whereConditions.push(eq(user.role, filters.role as any))
  }

  if (filters.department) {
    whereConditions.push(eq(user.department, filters.department))
  }

  if (filters.isActive !== undefined) {
    whereConditions.push(eq(user.isActive, filters.isActive))
  }

  if (filters.lastLoginFrom) {
    whereConditions.push(gte(user.lastLoginAt, new Date(filters.lastLoginFrom)))
  }

  if (filters.lastLoginTo) {
    whereConditions.push(lte(user.lastLoginAt, new Date(filters.lastLoginTo)))
  }

  // Fetch users with filters
  let userList: any[] = []
  let totalCount = 0
  
  try {
    // Get total count for pagination
    const countQuery = whereConditions.length > 0 
      ? db.select({ count: count() }).from(user).where(and(...whereConditions))
      : db.select({ count: count() }).from(user)

    const countResult = await countQuery
    totalCount = Number(countResult[0]?.count || 0)

    // Get paginated results
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1
    const limit = typeof params.limit === 'string' ? parseInt(params.limit) : 20
    const offset = (page - 1) * limit

    const baseQuery = {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      department: user.department,
      jobTitle: user.jobTitle,
      employeeId: user.employeeId,
      phone: user.phone,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    userList = await db
      .select(baseQuery)
      .from(user)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset)

    // If filtering by assignments, we need to join with assignments
    if (filters.hasAssignments !== undefined) {
      const usersWithAssignments = await db
        .select({
          userId: assetAssignments.userId,
        })
        .from(assetAssignments)
        .where(
          and(
            eq(assetAssignments.isActive, true),
            isNull(assetAssignments.returnedAt)
          )
        )
        .groupBy(assetAssignments.userId)

      const userIdsWithAssignments = usersWithAssignments.map(u => u.userId)
      
      if (filters.hasAssignments) {
        userList = userList.filter(user => userIdsWithAssignments.includes(user.id))
      } else {
        userList = userList.filter(user => !userIdsWithAssignments.includes(user.id))
      }
    }

  } catch (error) {
    console.error('Database error:', error)
    userList = []
    totalCount = 0
  }

  // Fetch filter options for dropdowns
  const [roles, departments, jobTitles] = await Promise.all([
    // Roles
    db.select({ role: user.role }).from(user).groupBy(user.role),
    
    // Departments
    db.select({ department: user.department }).from(user).where(isNotNull(user.department)).groupBy(user.department),
    
    // Job Titles
    db.select({ jobTitle: user.jobTitle }).from(user).where(isNotNull(user.jobTitle)).groupBy(user.jobTitle),
  ])

  // Calculate summary statistics
  const [totalUsers, activeUsers, inactiveUsers, usersWithAssignments, recentLogins] = await Promise.all([
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(user).where(eq(user.isActive, true)),
    db.select({ count: count() }).from(user).where(eq(user.isActive, false)),
    db.select({ count: count() }).from(assetAssignments)
      .where(
        and(
          eq(assetAssignments.isActive, true),
          isNull(assetAssignments.returnedAt)
        )
      )
      .groupBy(assetAssignments.userId),
    db.select({ count: count() }).from(user).where(
      gte(user.lastLoginAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    ),
  ])

  const stats = {
    total: totalUsers[0]?.count || 0,
    active: activeUsers[0]?.count || 0,
    inactive: inactiveUsers[0]?.count || 0,
    withAssignments: usersWithAssignments.length,
    recentLogins: recentLogins[0]?.count || 0,
  }

  // Role-based permissions
  const canCreateUsers = userRole === 'super_admin' || userRole === 'admin'
  const canEditUsers = userRole === 'super_admin' || userRole === 'admin'
  const canDeleteUsers = userRole === 'super_admin' // Only super admin can delete users
  const canViewAllUsers = userRole === 'super_admin' || userRole === 'admin'

        return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">
              Manage system users and their permissions
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {canCreateUsers && (
              <Link
                href="/dashboard/users/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Link>
            )}
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
              </div>
                </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <UserX className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Inactive Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">With Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withAssignments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Recent Logins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentLogins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pass data to client component */}
      <UsersClient 
        initialUsers={userList}
        canCreateUsers={canCreateUsers}
        canEditUsers={canEditUsers}
        canDeleteUsers={canDeleteUsers}
        canViewAllUsers={canViewAllUsers}
        userRole={userRole}
        currentUserId={currentUser?.id || ''}
      />
    </div>
  )
} 