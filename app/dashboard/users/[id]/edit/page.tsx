import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { UserForm } from '@/components/forms/user-form'
import { updateUserData } from '@/actions/users'
import { notFound } from 'next/navigation'

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user has permission to edit users
  const userRole = session.user.role
  if (!['super_admin', 'admin'].includes(userRole)) {
    redirect('/dashboard')
  }

  // Fetch the user data
  const userId = params.id
  const userData = await db.query.user.findFirst({
    where: eq(user.id, userId),
  })

  if (!userData) {
    notFound()
  }

  // Check if user can edit this user (admin can't edit super_admin)
  if (userRole === 'admin' && userData.role === 'super_admin') {
    redirect('/dashboard/users')
  }

  /**
   * Handles user update with server-side validation
   */
  const handleUpdateUser = async (data: any) => {
    'use server'
    
    try {
      await updateUserData(userId, data)
    } catch (error) {
      console.error('User update error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to update user')
    }
  }

  // Prepare initial data for the form
  const initialData = {
    name: userData.name || '',
    email: userData.email,
    department: userData.department || '',
    jobTitle: userData.jobTitle || '',
    employeeId: userData.employeeId || '',
    phone: userData.phone || '',
    role: userData.role,
    isActive: userData.isActive,
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit User Profile</h1>
          <p className="text-muted-foreground">
            Update user information and role assignments
          </p>
        </div>
      </div>

      <UserForm
        initialData={initialData}
        onSubmit={handleUpdateUser}
        mode="edit"
        currentUserRole={userRole}
      />
    </div>
  )
} 