'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'

interface UseAuthReturn {
  session: any
  user: any
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (provider?: string, options?: any) => Promise<void>
  signOut: () => Promise<void>
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  isInDepartment: (department: string) => boolean
  isActiveUser: boolean
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const isLoading = status === 'loading' || isSigningIn || isSigningOut
  const isAuthenticated = status === 'authenticated' && !!session?.user
  const user = session?.user

  const handleSignIn = useCallback(async (provider = 'google', options = {}) => {
    setIsSigningIn(true)
    try {
      await signIn(provider, {
        callbackUrl: '/dashboard',
        ...options
      })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsSigningIn(false)
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true)
    try {
      await signOut({ callbackUrl: '/auth/signin' })
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }, [])

  const hasRole = useCallback((role: string): boolean => {
    if (!user?.role) return false
    return user.role === role
  }, [user?.role])

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    if (!user?.role) return false
    return roles.includes(user.role)
  }, [user?.role])

  const isInDepartment = useCallback((department: string): boolean => {
    if (!user?.department) return false
    return user.department === department
  }, [user?.department])

  const isActiveUser = user?.isActive !== false

  return {
    session,
    user,
    isLoading,
    isAuthenticated,
    signIn: handleSignIn,
    signOut: handleSignOut,
    hasRole,
    hasAnyRole,
    isInDepartment,
    isActiveUser
  }
}

// Hook for protected routes
export function useProtectedRoute(requiredRole?: string, redirectTo = '/auth/signin') {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth()
  const router = useRouter()

  if (!isLoading && !isAuthenticated) {
    router.push(redirectTo)
    return { isAuthorized: false, isLoading }
  }

  if (!isLoading && requiredRole && !hasRole(requiredRole)) {
    router.push('/dashboard')
    return { isAuthorized: false, isLoading }
  }

  return { isAuthorized: true, isLoading, user }
}

// Hook for role-based component rendering
export function useRoleGuard(requiredRoles: string[]) {
  const { hasAnyRole, isLoading } = useAuth()
  
  return {
    canAccess: hasAnyRole(requiredRoles),
    isLoading
  }
} 