'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { Shield, Lock, AlertTriangle, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// User role types based on PRD
export type UserRole = 'super_admin' | 'admin' | 'it_staff' | 'manager' | 'user' | 'end_user' | 'viewer'

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  user: 2,
  end_user: 2, // Same level as user
  manager: 3,
  it_staff: 4,
  admin: 5,
  super_admin: 6,
}

// Get role display info
const ROLE_CONFIG: Record<UserRole, { 
  label: string
  color: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
  description: string
}> = {
  viewer: { 
    label: 'Viewer', 
    color: 'outline', 
    description: 'View-only access to assigned assets' 
  },
  user: { 
    label: 'User', 
    color: 'secondary', 
    description: 'Standard user with personal asset access' 
  },
  end_user: { 
    label: 'End User', 
    color: 'secondary', 
    description: 'Standard user with personal asset access' 
  },
  manager: { 
    label: 'Manager', 
    color: 'info', 
    description: 'Department management and oversight' 
  },
  it_staff: { 
    label: 'IT Staff', 
    color: 'warning', 
    description: 'IT operations and daily management' 
  },
  admin: { 
    label: 'Administrator', 
    color: 'success', 
    description: 'System administration and configuration' 
  },
  super_admin: { 
    label: 'Super Admin', 
    color: 'destructive', 
    description: 'Full system control and security' 
  },
}

// Permission checker utility
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

// Department-based access checker
export function hasDepartmentAccess(
  userRole: UserRole,
  userDepartment: string,
  targetDepartment: string
): boolean {
  // Super admin and admin have access to all departments
  if (userRole === 'super_admin' || userRole === 'admin') {
    return true
  }
  
  // IT staff has access to all departments for operational purposes
  if (userRole === 'it_staff') {
    return true
  }
  
  // Managers only have access to their own department
  if (userRole === 'manager') {
    return userDepartment === targetDepartment
  }
  
  // End users and viewers only have access to their own department
  return userDepartment === targetDepartment
}

// Role guard component props
interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredRoles?: UserRole[]
  allowedRoles?: UserRole[]
  blockedRoles?: UserRole[]
  fallback?: React.ReactNode
  showFallback?: boolean
  requireDepartmentMatch?: boolean
  targetDepartment?: string
}

// Main role guard component
export function RoleGuard({
  children,
  requiredRole,
  requiredRoles = [],
  allowedRoles = [],
  blockedRoles = [],
  fallback,
  showFallback = true,
  requireDepartmentMatch = false,
  targetDepartment,
}: RoleGuardProps) {
  const { data: session, status } = useSession()

  // Loading state
  if (status === 'loading') {
    return showFallback ? <RoleGuardLoading /> : null
  }

  // Not authenticated
  if (!session?.user) {
    return showFallback ? <RoleGuardUnauthorized /> : null
  }

  const userRole = session.user.role as UserRole
  const userDepartment = session.user.department || ''

  // Check if user is blocked
  if (blockedRoles.length > 0 && blockedRoles.includes(userRole)) {
    return showFallback ? (fallback || <RoleGuardBlocked userRole={userRole} />) : null
  }

  // Check role permissions
  let hasAccess = true

  // Single required role check
  if (requiredRole) {
    hasAccess = hasPermission(userRole, requiredRole)
  }

  // Multiple required roles check (user must have ALL roles)
  if (requiredRoles.length > 0) {
    hasAccess = requiredRoles.every(role => hasPermission(userRole, role))
  }

  // Allowed roles check (user must have ONE of the allowed roles)
  if (allowedRoles.length > 0) {
    hasAccess = allowedRoles.includes(userRole)
  }

  // Department access check
  if (requireDepartmentMatch && targetDepartment) {
    hasAccess = hasAccess && hasDepartmentAccess(userRole, userDepartment, targetDepartment)
  }

  if (!hasAccess) {
    return showFallback ? (fallback || <RoleGuardForbidden userRole={userRole} />) : null
  }

  return <>{children}</>
}

// Specific permission checkers
export function RequireRole({ role, children, fallback }: {
  role: UserRole
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <RoleGuard requiredRole={role} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function RequireAnyRole({ roles, children, fallback }: {
  roles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={roles} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function RequireAdmin({ children, fallback }: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <RoleGuard requiredRole="admin" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function RequireManager({ children, fallback }: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <RoleGuard requiredRole="manager" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

// Role display component
interface RoleBadgeProps {
  role: UserRole
  showDescription?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function RoleBadge({ role, showDescription = false, size = 'md' }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role as UserRole]
  
  // Fallback for unknown roles
  if (!config) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className={size === 'sm' ? 'text-xs' : undefined}>
          <Shield className={`mr-1 ${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
          {role}
        </Badge>
      </div>
    )
  }
  
  return (
    <div className="flex items-center space-x-2">
      <Badge variant={config.color} className={size === 'sm' ? 'text-xs' : undefined}>
        <Shield className={`mr-1 ${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
        {config.label}
      </Badge>
      {showDescription && (
        <span className="text-xs text-muted-foreground">{config.description}</span>
      )}
    </div>
  )
}

// Permission-based visibility
interface PermissionGateProps {
  permission: () => boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ permission, children, fallback }: PermissionGateProps) {
  const hasAccess = permission()
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Fallback components
function RoleGuardLoading() {
  return (
    <Card className="max-w-sm mx-auto">
      <CardContent className="p-6 text-center">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
          <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
        </div>
      </CardContent>
    </Card>
  )
}

function RoleGuardUnauthorized() {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Authentication Required</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          You need to be logged in to access this content.
        </p>
        <Button onClick={() => window.location.href = '/auth/signin'} className="w-full">
          Sign In
        </Button>
      </CardContent>
    </Card>
  )
}

function RoleGuardForbidden({ userRole }: { userRole: UserRole }) {
  const config = ROLE_CONFIG[userRole]
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle>Access Denied</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You don't have permission to access this content.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Your Role:</span>
          <RoleBadge role={userRole} />
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()} 
          className="w-full"
        >
          Go Back
        </Button>
      </CardContent>
    </Card>
  )
}

function RoleGuardBlocked({ userRole }: { userRole: UserRole }) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-destructive" />
          <CardTitle>Access Blocked</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your role has been restricted from accessing this content.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Your Role:</span>
          <RoleBadge role={userRole} />
        </div>
      </CardContent>
    </Card>
  )
}

// Custom hooks for role checking
export function useUserRole(): UserRole | null {
  const { data: session } = useSession()
  return (session?.user?.role as UserRole) || null
}

export function useHasPermission(requiredRole: UserRole): boolean {
  const userRole = useUserRole()
  return userRole ? hasPermission(userRole, requiredRole) : false
}

export function useIsAdmin(): boolean {
  return useHasPermission('admin')
}

export function useIsManager(): boolean {
  return useHasPermission('manager')
}

export function useCanManageUsers(): boolean {
  const userRole = useUserRole()
  return userRole ? ['super_admin', 'admin'].includes(userRole) : false
}

export function useCanManageAssets(): boolean {
  const userRole = useUserRole()
  return userRole ? ['super_admin', 'admin'].includes(userRole) : false
}

export function useCanAssignAssets(): boolean {
  const userRole = useUserRole()
  return userRole ? ['super_admin', 'admin', 'it_staff', 'manager'].includes(userRole) : false
} 