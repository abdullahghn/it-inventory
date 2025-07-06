import Link from 'next/link'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

interface UserProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params

  // Fetch user details
  const userData = await db.select().from(user).where(eq(user.id, id))
  
  if (!userData[0]) {
    notFound()
  }

  const currentUser = userData[0]

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            <p className="text-gray-600">{currentUser.name || 'Unknown User'}</p>
          </div>
          <Link
            href="/dashboard/users"
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Back to Users
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}