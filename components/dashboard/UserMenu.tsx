'use client'

import { signOut, useSession } from 'next-auth/react'
import { User } from 'next-auth'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { LoadingSpinner } from '@/components/ui/loading'
import { ChevronDown, LogOut, User as UserIcon, Settings, HelpCircle } from 'lucide-react'

interface UserMenuProps {
  user: User & {
    role: string
    department?: string | null
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ callbackUrl: '/auth/signin' })
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'user':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatRoleName = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '👑'
      case 'admin':
        return '⚙️'
      case 'manager':
        return '👔'
      case 'user':
        return '👤'
      case 'viewer':
        return '👁️'
      default:
        return '👤'
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* User button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        {/* User avatar */}
        <div className="flex-shrink-0">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="h-10 w-10 rounded-full border-2 border-gray-200"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-200">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name || 'Unknown User'}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
              <span className="mr-1">{getRoleIcon(user.role)}</span>
              {formatRoleName(user.role)}
            </span>
            {user.department && (
              <span className="text-xs text-gray-500 truncate">{user.department}</span>
            )}
          </div>
        </div>

        {/* Dropdown arrow */}
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isMenuOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown menu - Positioned above the button */}
      {isMenuOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto">
          {/* Profile link */}
          <Link
            href={`/dashboard/users/${user.id}`}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            onClick={() => setIsMenuOpen(false)}
          >
            <UserIcon className="h-4 w-4 mr-3 text-gray-400" />
            View Profile
          </Link>

          {/* Settings link (if admin) */}
          {(user.role === 'admin' || user.role === 'super_admin') && (
            <Link
              href="/dashboard/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings className="h-4 w-4 mr-3 text-gray-400" />
              Settings
            </Link>
          )}

          {/* Help link */}
          <Link
            href="/dashboard/help"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            onClick={() => setIsMenuOpen(false)}
          >
            <HelpCircle className="h-4 w-4 mr-3 text-gray-400" />
            Help & Support
          </Link>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1" />

          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningOut ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-3">Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-3" />
                Sign out
              </>
            )}
          </button>
        </div>
      )}

      {/* Session info */}
      {session && (
        <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Session active</span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Online
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 