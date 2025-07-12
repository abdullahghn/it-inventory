import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { UserForm } from '@/components/forms/user-form'
import { createUser } from '@/actions/users'

export default async function NewUserPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user has permission to create users
  const userRole = session.user.role
  if (!['super_admin', 'admin'].includes(userRole)) {
    redirect('/dashboard')
  }

  /**
   * Handles user creation with server-side validation
   */
  const handleCreateUser = async (data: any) => {
    'use server'
    
    try {
      await createUser(data)
    } catch (error) {
      console.error('User creation error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to create user')
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
          <p className="text-muted-foreground">
            Add a new user to the system with appropriate permissions
          </p>
        </div>
      </div>

      <UserForm
        onSubmit={handleCreateUser}
        mode="create"
        currentUserRole={userRole}
      />
    </div>
  )
} 