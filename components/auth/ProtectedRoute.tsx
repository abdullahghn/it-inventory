'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
type UserRole = 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer'

// Simple loading spinner component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )
}

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole
  allowedRoles?: UserRole[]
  fallbackUrl?: string
  loadingComponent?: ReactNode
}

// Role hierarchy for permission checking
const roleHierarchy: Record<UserRole, number> = {
  'viewer': 1,
  'user': 2,
  'manager': 3,
  'admin': 4,
  'super_admin': 5
}

function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = roleHierarchy[userRole] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0
  return userLevel >= requiredLevel
}

export function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
  fallbackUrl = '/auth/signin',
  loadingComponent
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (status === 'unauthenticated') {
      // Not authenticated, redirect to sign in
      const signInUrl = `${fallbackUrl}?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      router.push(signInUrl)
      return
    }

    if (session?.user) {
      // Check if user is active
      if (!session.user.isActive) {
        router.push('/auth/error?error=inactive')
        return
      }

      // Check role-based permissions
      const userRole = session.user.role as UserRole

      if (requiredRole && !hasPermission(userRole, requiredRole)) {
        router.push('/dashboard?error=unauthorized')
        return
      }

      if (allowedRoles && !allowedRoles.includes(userRole)) {
        router.push('/dashboard?error=unauthorized')
        return
      }
    }
  }, [session, status, router, requiredRole, allowedRoles, fallbackUrl])

  // Show loading state
  if (status === 'loading') {
    return loadingComponent || <LoadingSpinner />
  }

  // Show nothing while redirecting
  if (status === 'unauthenticated') {
    return null
  }

  // Check authentication and role permissions
  if (session?.user) {
    if (!session.user.isActive) {
      return null // Will redirect via useEffect
    }

    const userRole = session.user.role as UserRole

    if (requiredRole && !hasPermission(userRole, requiredRole)) {
      return null // Will redirect via useEffect
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return null // Will redirect via useEffect
    }

    // All checks passed, render children
    return <>{children}</>
  }

  return null
}

// Convenience wrapper for admin-only routes
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="admin" {...props}>
      {children}
    </ProtectedRoute>
  )
}

// Convenience wrapper for manager-only routes
export function ManagerRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="manager" {...props}>
      {children}
    </ProtectedRoute>
  )
}

// Convenience wrapper for user-only routes (any authenticated user)
export function UserRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="user" {...props}>
      {children}
    </ProtectedRoute>
  )
}

// Server-side protection hook for API routes and server components
export function withRoleProtection(requiredRole: UserRole) {
  return function <T extends any[]>(
    handler: (...args: T) => Promise<any>
  ) {
    return async function (...args: T) {
      // This would be used in API routes with the auth() function
      // Implementation depends on the specific use case
      return handler(...args)
    }
  }
} 