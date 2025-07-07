'use client'

import { signOut } from 'next-auth/react'
import { User } from 'next-auth'
import Link from 'next/link'

interface UserMenuProps {
  user: User & {
    role: string
    department?: string | null
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800'
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'user':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatRoleName = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="flex items-center space-x-3">
      {user.image && (
        <img
          src={user.image}
          alt={user.name || 'User'}
          className="h-8 w-8 rounded-full"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.name || 'Unknown User'}
        </p>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
            {formatRoleName(user.role)}
          </span>
          {user.department && (
            <span className="text-xs text-gray-500">{user.department}</span>
          )}
        </div>
      </div>
      <Link
        href={`/dashboard/users/${user.id}`}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
        title="View Profile"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </Link>
      <button
        onClick={handleSignOut}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
        title="Sign out"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  )
} 