'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface UserEditPageProps {
  params: Promise<{
    id: string
  }>
}

interface UserData {
  id: string
  name: string | null
  email: string
  role: string
  department: string | null
  job_title: string | null
  employee_id: string | null
  phone: string | null
}

export default function UserEditPage({ params }: UserEditPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [userId, setUserId] = useState<string>('')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')

  // Extract params
  useEffect(() => {
    params.then(({ id }) => {
      setUserId(id)
    })
  }, [params])

  // Load user data
  useEffect(() => {
    if (!userId || !session?.user) return

    const loadUserData = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`)
        if (!response.ok) {
          if (response.status === 403) {
            router.push('/dashboard?error=unauthorized')
            return
          }
          throw new Error('Failed to load user data')
        }

        const response_data = await response.json()
        
        // The API returns data nested under 'data' property
        const userData = response_data.data
        setUserData(userData)
        
        // Populate form fields
        setName(userData.name || '')
        setDepartment(userData.department || '')
        setJobTitle(userData.jobTitle || '') // Note: API returns jobTitle, not job_title
        setEmployeeId(userData.employeeId || '') // Note: API returns employeeId, not employee_id
        setPhone(userData.phone || '')
        setRole(userData.role || 'user')
      } catch (err) {
        console.error('Error loading user data:', err)
        setError('Failed to load user data')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [userId, session, router])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const updateData: any = {
        name,
        department,
        jobTitle: jobTitle,  // Fixed: API expects jobTitle, not job_title
        employeeId: employeeId,  // Fixed: API expects employeeId, not employee_id
        phone,
      }

      // Only include role if user has permission to change it
      const canChangeRole = session?.user?.id !== userId && 
                           ['admin', 'super_admin'].includes(session?.user?.role || '')
      
      if (canChangeRole) {
        updateData.role = role
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }

      router.push(`/dashboard/users/${userId}`)
    } catch (err) {
      console.error('Error updating user:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle redirects in useEffect to avoid render-time navigation
  useEffect(() => {
    if (status === 'loading' || isLoading) return
    
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    if (userData) {
      // Check if user can edit this profile
      const canEditProfile = session.user.id === userData.id || 
                             ['manager', 'admin', 'super_admin'].includes(session.user.role || '')
      
      if (!canEditProfile) {
        router.push('/dashboard?error=unauthorized')
        return
      }
    }
  }, [status, isLoading, session, userData, router])

  if (status === 'loading' || isLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (!session?.user) {
    return <div className="p-6">Redirecting to login...</div>
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return <div className="p-6">User not found</div>
  }

  // Check if user can edit this profile
  const canEditProfile = session.user.id === userData.id || 
                         ['manager', 'admin', 'super_admin'].includes(session.user.role || '')

  if (!canEditProfile) {
    return <div className="p-6">Checking permissions...</div>
  }

  // Check if user can change roles
  const canChangeRole = session.user.id !== userData.id && 
                       ['admin', 'super_admin'].includes(session.user.role || '')

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600">{userData.name || 'Unknown User'}</p>
          </div>
          <Link
            href={`/dashboard/users/${userData.id}`}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={userData.email}
                disabled
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Department</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Engineering">Engineering</option>
                <option value="Support">Support</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Senior Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., EMP001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., +1 (555) 123-4567"
              />
            </div>

            {canChangeRole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  {session.user.role === 'super_admin' && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href={`/dashboard/users/${userData.id}`}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 