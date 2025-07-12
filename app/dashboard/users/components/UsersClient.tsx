'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { RequireRole } from '@/components/auth/RoleGuard'
import { EmptyState } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { DeleteConfirmationModal } from '@/components/ui/modal'
import { MoreHorizontal, Plus, Eye, UserPlus, Edit, Trash2, Download } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  department: string | null
  jobTitle: string | null
  employeeId: string | null
  phone: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

interface UsersClientProps {
  initialUsers: User[]
  canCreateUsers: boolean
  canEditUsers: boolean
  canDeleteUsers: boolean
  canViewAllUsers: boolean
  userRole: string
  currentUserId: string
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'super_admin': return 'destructive'
    case 'admin': return 'default'
    case 'manager': return 'info'
    case 'user': return 'secondary'
    case 'viewer': return 'outline'
    default: return 'secondary'
  }
}

const getStatusBadgeVariant = (isActive: boolean) => {
  return isActive ? 'success' : 'destructive'
}

export function UsersClient({ 
  initialUsers, 
  canCreateUsers, 
  canEditUsers, 
  canDeleteUsers, 
  canViewAllUsers,
  userRole,
  currentUserId
}: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isCheckingDelete, setIsCheckingDelete] = useState(false)
  const { success, error: showError } = useToast()

  // Update users when initialUsers change (e.g., after page refresh)
  React.useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const checkCanDelete = async (user: User) => {
    setIsCheckingDelete(true)
    try {
      const response = await fetch(`/api/users/${user.id}/can-delete`)
      const data = await response.json()
      
      if (data.success && data.canDelete) {
        // User can be deleted, open the confirmation modal
        setUserToDelete(user)
        setDeleteModalOpen(true)
      } else {
        // User cannot be deleted, show error message
        showError('Cannot delete user', data.error || 'User cannot be deleted')
      }
    } catch (error: any) {
      showError('Error checking user', 'Failed to verify if user can be deleted')
    } finally {
      setIsCheckingDelete(false)
    }
  }

  const handleDelete = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        // Try to get the error message from the response
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to delete user'
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      setUsers(prev => prev.filter(u => u.id !== user.id))
      success('User deleted', result.message || `${user.name || user.email} has been successfully deleted`)
      setDeleteModalOpen(false)
      setUserToDelete(null)
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete user'
      showError('Failed to delete user', errorMessage)
    }
  }

  const handleExport = () => {
    const csvContent = [
      'Name,Email,Role,Department,Job Title,Employee ID,Status',
      ...users.map(user => 
        `${user.name || 'N/A'},${user.email},${user.role},${user.department || 'N/A'},${user.jobTitle || 'N/A'},${user.employeeId || 'N/A'},${user.isActive ? 'Active' : 'Inactive'}`
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name') || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('email')}</div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string
        return (
          <Badge variant={getRoleBadgeVariant(role)}>
            {role.replace('_', ' ')}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => (
        <div>{row.getValue('department') || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'jobTitle',
      header: 'Job Title',
      cell: ({ row }) => (
        <div>{row.getValue('jobTitle') || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean
        return (
          <Badge variant={getStatusBadgeVariant(isActive)}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) => {
        const lastLogin = row.getValue('lastLoginAt') as string | null
        return (
          <div className="text-sm text-gray-500">
            {lastLogin ? new Date(lastLogin).toLocaleDateString() : 'Never'}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original
        const canDeleteThisUser = canDeleteUsers && user.id !== currentUserId
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/users/${user.id}`} className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canEditUsers && (
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/users/${user.id}/edit`} className="flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit User
                  </Link>
                </DropdownMenuItem>
              )}
              {canDeleteThisUser && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => checkCanDelete(user)}
                    disabled={isCheckingDelete}
                    className="flex items-center text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isCheckingDelete ? 'Checking...' : 'Delete User'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<UserPlus className="h-12 w-12" />}
        title="No users found"
        description="Get started by creating your first user account."
        action={
          canCreateUsers ? (
            <Button _asChild>
              <Link href="/dashboard/users/new">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Link>
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users ({users.length})</h2>
          <p className="text-sm text-gray-600">Manage system users and their permissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {canCreateUsers && (
            <Button _asChild>
              <Link href="/dashboard/users/new">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Link>
            </Button>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={users} />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setUserToDelete(null)
        }}
        onConfirm={() => userToDelete && handleDelete(userToDelete)}
        itemName={userToDelete?.name || userToDelete?.email || 'this user'}
        itemType="user"
        additionalInfo="This action cannot be undone."
      />
    </div>
  )
} 