'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { RoleBadge, RequireRole, type UserRole } from '@/components/auth/RoleGuard'
import { PageLoading, EmptyState } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { DeleteConfirmationModal } from '@/components/ui/modal'
import { MoreHorizontal, Plus, Eye, Edit, UserCheck, UserX, Download } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string
  employeeId: string
  isActive: boolean
  image: string
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const { success, error: showError } = useToast()

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/users', {
          credentials: 'include', // Ensure cookies are sent
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data) {
          setUsers(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch users')
        }
      } catch (error) {
        console.error('Fetch error:', error)
        showError('Failed to fetch users', 'Please try again later')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [showError])

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      })
      
      if (!response.ok) throw new Error('Failed to update user status')
      
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      ))
      
      success(
        `User ${!user.isActive ? 'activated' : 'deactivated'}`,
        `${user.name} has been successfully ${!user.isActive ? 'activated' : 'deactivated'}`
      )
    } catch (error) {
      showError('Failed to update user status', 'Please try again later')
    }
  }

  const handleDelete = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete user')
      
      setUsers(prev => prev.filter(u => u.id !== user.id))
      success('User deleted', `${user.name} has been successfully deleted`)
      setDeleteModalOpen(false)
      setUserToDelete(null)
    } catch (error) {
      showError('Failed to delete user', 'Please try again later')
    }
  }

  const handleExport = () => {
    const csvContent = [
      'Name,Email,Role,Department,Employee ID,Status',
      ...users.map(user => 
        `${user.name},${user.email},${user.role},${user.department || 'N/A'},${user.employeeId || 'N/A'},${user.isActive ? 'Active' : 'Inactive'}`
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
      header: 'User',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center space-x-3">
            {user.image && (
              <img 
                className="h-10 w-10 rounded-full" 
                src={user.image} 
                alt={user.name || 'User'} 
              />
            )}
            <div>
              <div className="font-medium text-gray-900">
                {user.name || 'No name'}
              </div>
              {user.employeeId && (
                <div className="text-sm text-gray-500">
                  ID: {user.employeeId}
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="text-sm text-gray-900">{row.getValue('email')}</div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as UserRole
        return <RoleBadge role={role} />
      },
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => (
        <div className="text-sm text-gray-900">
          {row.getValue('department') || 'Not assigned'}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean
        return (
          <Badge variant={isActive ? 'success' : 'destructive'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original
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
                  View Profile
                </Link>
              </DropdownMenuItem>
              
              <RequireRole role="admin">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/users/${user.id}/edit`} className="flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit User
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => handleToggleStatus(user)}
                  className="flex items-center"
                >
                  {user.isActive ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600"
                  onClick={() => {
                    setUserToDelete(user)
                    setDeleteModalOpen(true)
                  }}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Delete User
                </DropdownMenuItem>
              </RequireRole>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (loading) {
    return <PageLoading />
  }

  return (
    <RequireRole role="manager">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600">Manage system users and permissions</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <RequireRole role="admin">
              <Link href="/dashboard/users/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </Link>
            </RequireRole>
          </div>
        </div>

        {users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Start by adding your first user to the system"
            action={
              <RequireRole role="admin">
                <Link href="/dashboard/users/new">
                  <Button>Add First User</Button>
                </Link>
              </RequireRole>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={users}
            searchKey="name"
            searchPlaceholder="Search users..."
          />
        )}

        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={() => userToDelete && handleDelete(userToDelete)}
          itemName={userToDelete?.name || ''}
          itemType="user"
        />
      </div>
    </RequireRole>
  )
} 