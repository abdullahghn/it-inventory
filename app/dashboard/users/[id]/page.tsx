import Link from 'next/link'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { hasRole } from '@/lib/auth'
import { UserAssetHistory } from '@/components/ui/user-asset-history'

interface UserProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params

  // Get current session for RBAC checks
  const session = await auth()
  if (!session?.user) {
    notFound()
  }

  // Fetch user details
  const userData = await db.select().from(user).where(eq(user.id, id))
  
  if (!userData[0]) {
    notFound()
  }

  const currentUser = userData[0]

  // RBAC Protection: Users can only view their own profile or manager+ can view any profile
  const isOwnProfile = session.user.id === currentUser.id
  const canViewOtherProfiles = await hasRole('manager')
  
  if (!isOwnProfile && !canViewOtherProfiles) {
    // Redirect to dashboard with unauthorized error if trying to view another user's profile
    redirect('/dashboard?error=unauthorized')
  }

  // Check if current user can access users list
  const canAccessUsersList = await hasRole('manager')

  // Check if current user can edit this profile
  const canEditProfile = session.user.id === currentUser.id || await hasRole('manager')

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            <p className="text-gray-600">{currentUser.name || 'Unknown User'}</p>
          </div>
          <div className="flex space-x-3">
            {canEditProfile && (
              <Link
                href={`/dashboard/users/${currentUser.id}/edit`}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Edit Profile
              </Link>
            )}
            {canAccessUsersList ? (
              <Link
                href="/dashboard/users"
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Back to Users
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Back to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="flex items-start space-x-4 mb-6">
          {currentUser.image && (
            <img 
              src={currentUser.image} 
              alt={currentUser.name || 'User'} 
              className="h-16 w-16 rounded-full"
            />
          )}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <p className="text-lg font-medium text-gray-900">{currentUser.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <p className="text-gray-900">{currentUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Verified
                </label>
                <p className="text-gray-900">
                  {currentUser.emailVerified ? 
                    currentUser.emailVerified.toLocaleDateString() : 
                    'Not verified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <p className="text-gray-900 text-sm font-mono">{currentUser.id}</p>
              </div>
              {currentUser.department && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <p className="text-gray-900">{currentUser.department}</p>
                </div>
              )}
              {currentUser.jobTitle && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <p className="text-gray-900">{currentUser.jobTitle}</p>
                </div>
              )}
              {currentUser.employeeId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID
                  </label>
                  <p className="text-gray-900">{currentUser.employeeId}</p>
                </div>
              )}
              {currentUser.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <p className="text-gray-900">{currentUser.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Asset Assignment History */}
      <UserAssetHistory 
        userId={currentUser.id}
        userName={currentUser.name || undefined}
        showHeader={true}
        maxItems={20}
        showFilters={true}
        showExport={true}
        showRefresh={true}
      />
    </div>
  )
}